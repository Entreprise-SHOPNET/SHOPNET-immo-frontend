


const API_URL = 'https://shopnet-immo-backend.onrender.com/api/biens/public';

let allProperties = [];
let filteredProperties = [];

// Éléments DOM
const grid = document.getElementById('propertiesGrid');
const featuredScroll = document.getElementById('featuredScroll');
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
  // Rafraîchir l'affichage pour mettre à jour les cœurs
  applyFilters();
}

// Chargement initial
document.addEventListener('DOMContentLoaded', () => {
  fetchProperties();
  searchCity.addEventListener('input', applyFilters);
  filterType.addEventListener('change', applyFilters);
  filterOffer.addEventListener('change', applyFilters);

  // Fermeture de la bannière promo
  const closeBtn = document.getElementById('closePromo');
  const banner = document.getElementById('promoBanner');
  if (closeBtn && banner) {
    closeBtn.addEventListener('click', () => {
      banner.style.display = 'none';
    });
  }
});

async function fetchProperties() {
  grid.innerHTML = '<div class="loader">📡 Chargement des annonces...</div>';
  featuredScroll.innerHTML = '<div class="loader">📡 Chargement...</div>';
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
    grid.innerHTML = `<div class="error-message">⚠️ Erreur : ${err.message}. Vérifiez votre connexion.</div>`;
    featuredScroll.innerHTML = '';
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

  renderFeatured(); // 3 premières annonces en carrousel
  renderGrid();
}

// Carrousel horizontal : 3 premières annonces (ou les 3 premières filtrées)
function renderFeatured() {
  const featured = filteredProperties.slice(0, 3);
  if (!featured.length) {
    featuredScroll.innerHTML = '<div class="loader">Aucune annence à la une</div>';
    return;
  }
  featuredScroll.innerHTML = featured.map(prop => createFeaturedCard(prop)).join('');
  attachFavoriteEvents();
}

function createFeaturedCard(prop) {
  const imageUrl = prop.images[0];
  const priceFormatted = new Intl.NumberFormat().format(prop.prix);
  const lieu = [prop.ville, prop.quartier].filter(Boolean).join(', ') || 'RDC';
  const favClass = isFavorite(prop.id) ? 'active' : '';
  return `
    <div class="featured-card" data-id="${prop.id}">
      <img class="featured-card-img" src="${imageUrl}" alt="${prop.titre}" loading="lazy" onerror="this.src='https://placehold.co/600x400?text=Image+indisponible'">
      <div class="card-content">
        <h3 class="card-title">${escapeHtml(prop.titre)}</h3>
        <div class="card-price">${priceFormatted} ${prop.devise}</div>
        <div class="card-location"><i class="fas fa-map-pin"></i> ${escapeHtml(lieu)}</div>
      </div>
      <div class="favorite-btn ${favClass}" data-id="${prop.id}">
        <i class="fas fa-heart"></i>
      </div>
    </div>
  `;
}

// Grille principale : alterne les styles (classique / horizontal)
function renderGrid() {
  if (!filteredProperties.length) {
    grid.innerHTML = '<div class="loader">🏡 Aucun bien ne correspond à vos critères.</div>';
    return;
  }

  let html = '';
  filteredProperties.forEach((prop, index) => {
    // Alterne : index pair -> carte classique, index impair -> carte horizontale
    if (index % 2 === 0) {
      html += createClassicCard(prop);
    } else {
      html += createHorizontalCard(prop);
    }
  });
  grid.innerHTML = html;
  attachCardClickEvents();
  attachFavoriteEvents();
}

function createClassicCard(prop) {
  const imageUrl = prop.images[0];
  const priceFormatted = new Intl.NumberFormat().format(prop.prix);
  const lieu = [prop.ville, prop.quartier].filter(Boolean).join(', ') || 'RDC';
  const favClass = isFavorite(prop.id) ? 'active' : '';
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
      <div class="favorite-btn ${favClass}" data-id="${prop.id}">
        <i class="fas fa-heart"></i>
      </div>
    </div>
  `;
}

function createHorizontalCard(prop) {
  const imageUrl = prop.images[0];
  const priceFormatted = new Intl.NumberFormat().format(prop.prix);
  const lieu = [prop.ville, prop.quartier].filter(Boolean).join(', ') || 'RDC';
  const favClass = isFavorite(prop.id) ? 'active' : '';
  return `
    <div class="property-card-horizontal" data-id="${prop.id}">
      <img class="card-img-horizontal" src="${imageUrl}" alt="${prop.titre}" loading="lazy" onerror="this.src='https://placehold.co/600x400?text=Image+indisponible'">
      <div class="card-content-horizontal">
        <h3 class="card-title-horizontal">${escapeHtml(prop.titre)}</h3>
        <div class="card-price-horizontal">${priceFormatted} ${prop.devise}</div>
        <div class="card-location-horizontal"><i class="fas fa-map-pin"></i> ${escapeHtml(lieu)}</div>
        <div class="card-meta-horizontal">
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

function attachCardClickEvents() {
  document.querySelectorAll('.property-card, .property-card-horizontal, .featured-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Ne pas déclencher si on clique sur le cœur
      if (e.target.closest('.favorite-btn')) return;
      const id = card.dataset.id;
      if (id) window.location.href = `detail.html?id=${id}`;
    });
  });
}

function attachFavoriteEvents() {
  document.querySelectorAll('.favorite-btn').forEach(btn => {
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
  // Mettre à jour visuellement
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