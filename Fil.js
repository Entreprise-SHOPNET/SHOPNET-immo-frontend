


const API_URL = 'https://shopnet-immo-backend.onrender.com/api/biens/public';

let allProperties = [];
let filteredProperties = [];

// Éléments DOM
const featuredGrid = document.getElementById('featuredGrid');
const allPropertiesGrid = document.getElementById('allPropertiesGrid');
const searchCity = document.getElementById('searchCity');
const filterType = document.getElementById('filterType');
const filterOffer = document.getElementById('filterOffer');

// Gestion des favoris (localStorage)
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function isFavorite(id) {
  return favorites.includes(id);
}

function toggleFavorite(id, event) {
  event.stopPropagation();
  if (isFavorite(id)) {
    favorites = favorites.filter(favId => favId !== id);
  } else {
    favorites.push(id);
  }
  saveFavorites();
  applyFilters(); // rafraîchit l'affichage
}

// Chargement initial
document.addEventListener('DOMContentLoaded', () => {
  fetchProperties();
  searchCity.addEventListener('input', applyFilters);
  filterType.addEventListener('change', applyFilters);
  filterOffer.addEventListener('change', applyFilters);
});

async function fetchProperties() {
  featuredGrid.innerHTML = '<div class="loader">📡 Chargement coups de cœur...</div>';
  allPropertiesGrid.innerHTML = '<div class="loader">📡 Chargement annonces...</div>';
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
    featuredGrid.innerHTML = `<div class="error-message">⚠️ Erreur : ${err.message}. Vérifiez votre connexion.</div>`;
    allPropertiesGrid.innerHTML = '';
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

  // Séparer les 3 premiers pour les "Coups de cœur", le reste pour la grille générale
  const featuredItems = filteredProperties.slice(0, 3);
  const restItems = filteredProperties.slice(3);

  renderGrid(featuredGrid, featuredItems, true);
  renderGrid(allPropertiesGrid, restItems, false);
}

// Rendu générique d'une grille (avec un message si vide)
function renderGrid(container, properties, isFeatured) {
  if (!container) return;

  if (properties.length === 0) {
    container.innerHTML = '<div class="empty-message">✨ Aucun bien à afficher dans cette section.</div>';
    return;
  }

  let html = '';
  properties.forEach(prop => {
    html += createPropertyCard(prop);
  });
  container.innerHTML = html;
  attachCardClickEvents(container);
  attachFavoriteEvents(container);
}

// Création d'une carte unique (compacte, adaptée à grille 2/3 colonnes)
function createPropertyCard(prop) {
  const imageUrl = prop.images[0];
  const priceFormatted = new Intl.NumberFormat().format(prop.prix);
  const lieu = [prop.ville, prop.quartier].filter(Boolean).join(', ') || 'RDC';
  const favClass = isFavorite(prop.id) ? 'active' : '';
  return `
    <div class="property-card" data-id="${prop.id}">
      <img class="card-img" src="${imageUrl}" alt="${escapeHtml(prop.titre)}" loading="lazy" onerror="this.src='https://placehold.co/600x400?text=Image+indisponible'">
      <div class="card-content">
        <h3 class="card-title">${escapeHtml(prop.titre)}</h3>
        <div class="card-price">${priceFormatted} ${prop.devise}</div>
        <div class="card-location"><i class="fas fa-map-pin"></i> ${escapeHtml(lieu)}</div>
        <div class="card-meta">
          <span>${prop.type_bien || 'Bien'}</span>
          <span class="meta-tag">${prop.type_offre === 'Vente' ? '🏷️ Vente' : '🔑 Location'}</span>
        </div>
      </div>
      <div class="favorite-btn ${favClass}" data-id="${prop.id}">
        <i class="fas fa-heart"></i>
      </div>
    </div>
  `;
}

// Gestion du clic sur une carte (redirection vers détail)
function attachCardClickEvents(container) {
  container.querySelectorAll('.property-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.favorite-btn')) return;
      const id = card.dataset.id;
      if (id) window.location.href = `detail.html?id=${id}`;
    });
  });
}

// Gestion des favoris pour les cartes d'un conteneur
function attachFavoriteEvents(container) {
  container.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.removeEventListener('click', handleFavoriteClick);
    btn.addEventListener('click', handleFavoriteClick);
  });
}

function handleFavoriteClick(e) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const id = parseInt(btn.dataset.id);
  if (!id) return;
  toggleFavorite(id, e);
  if (isFavorite(id)) {
    btn.classList.add('active');
  } else {
    btn.classList.remove('active');
  }
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