


const API_URL = 'https://shopnet-immo-backend.onrender.com/api/biens/public';

let allProperties = [];
let filteredProperties = [];

// Éléments DOM
const grid = document.getElementById('propertiesGrid');
const searchCity = document.getElementById('searchCity');
const filterType = document.getElementById('filterType');
const filterOffer = document.getElementById('filterOffer');

// Chargement initial
document.addEventListener('DOMContentLoaded', () => {
  fetchProperties();
  searchCity.addEventListener('input', applyFilters);
  filterType.addEventListener('change', applyFilters);
  filterOffer.addEventListener('change', applyFilters);
});

async function fetchProperties() {
  grid.innerHTML = '<div class="loader">📡 Chargement des annonces...</div>';
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.success && data.biens) {
      allProperties = data.biens.map(b => ({
        ...b,
        images: Array.isArray(b.images) && b.images.length ? b.images : ['https://placehold.co/600x400?text=SHOPNET+IMMO']
      }));
      applyFilters();
    } else {
      throw new Error(data.message || 'Aucun bien disponible');
    }
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<div class="error-message">⚠️ Erreur : ${err.message}. Vérifiez votre connexion ou réessayez plus tard.</div>`;
  }
}

function applyFilters() {
  const cityTerm = searchCity.value.toLowerCase().trim();
  const typeVal = filterType.value;
  const offerVal = filterOffer.value;

  filteredProperties = allProperties.filter(prop => {
    if (typeVal && prop.type_bien !== typeVal) return false;
    if (offerVal && prop.type_offre !== offerVal) return false;
    if (cityTerm) {
      const ville = (prop.ville || '').toLowerCase();
      const quartier = (prop.quartier || '').toLowerCase();
      if (!ville.includes(cityTerm) && !quartier.includes(cityTerm)) return false;
    }
    return true;
  });
  renderGrid();
}

function renderGrid() {
  if (!filteredProperties.length) {
    grid.innerHTML = '<div class="loader">🏡 Aucun bien ne correspond à vos critères.</div>';
    return;
  }
  grid.innerHTML = filteredProperties.map(prop => createCard(prop)).join('');
  // Attacher les événements de clic sur chaque carte
  document.querySelectorAll('.property-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const id = card.dataset.id;
      window.location.href = `detail.html?id=${id}`;
    });
  });
}

function createCard(prop) {
  const imageUrl = prop.images[0];
  const priceFormatted = new Intl.NumberFormat().format(prop.prix);
  const lieu = [prop.ville, prop.quartier].filter(Boolean).join(', ') || 'RDC';
  return `
    <div class="property-card" data-id="${prop.id}">
      <img class="card-img" src="${imageUrl}" alt="${prop.titre}" loading="lazy" onerror="this.src='https://placehold.co/600x400?text=Image+indisponible'">
      <div class="card-content">
        <h3 class="card-title">${escapeHtml(prop.titre)}</h3>
        <div class="card-price">${priceFormatted} ${prop.devise}</div>
        <div class="card-location"><i class="fas fa-map-pin"></i> ${escapeHtml(lieu)}</div>
        <div class="card-meta">
          <span>${prop.type_bien || 'Bien'}</span>
          <span class="meta-tag">${prop.type_offre === 'Vente' ? '🏷️ Vente' : '🔑 Location'}</span>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}