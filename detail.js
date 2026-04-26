


// Configuration API
// API
// API Configuration
const API_BASE = 'http://100.64.134.89:5000/api/biens';
let currentBien = null;
let favoriteIds = [];

// ======================= FAVORIS (localStorage) =======================
function loadFavoritesFromStorage() {
  const stored = localStorage.getItem('shopnet_favorites');
  favoriteIds = stored ? JSON.parse(stored) : [];
  updateGlobalFavCounter();
}
function saveFavoritesToStorage() {
  localStorage.setItem('shopnet_favorites', JSON.stringify(favoriteIds));
  updateGlobalFavCounter();
}
function updateGlobalFavCounter() {
  const counterSpan = document.getElementById('globalFavCount');
  if (counterSpan) counterSpan.innerText = favoriteIds.length;
  const favStatSpan = document.getElementById('favorisCountDisplay');
  if (favStatSpan) favStatSpan.innerText = favoriteIds.length;
}
function isFavorite(bienId) { return favoriteIds.includes(bienId); }
function addFavorite(bienId) { if (!favoriteIds.includes(bienId)) { favoriteIds.push(bienId); saveFavoritesToStorage(); } }
function removeFavorite(bienId) { favoriteIds = favoriteIds.filter(id => id != bienId); saveFavoritesToStorage(); }
function toggleFavorite(bienId) {
  if (isFavorite(bienId)) { removeFavorite(bienId); return false; }
  else { addFavorite(bienId); return true; }
}
function updateFavoriteButtonState(bienId) {
  const favBtn = document.getElementById('favoriteBtn');
  if (!favBtn) return;
  const isFav = isFavorite(bienId);
  const icon = favBtn.querySelector('i');
  const textSpan = document.getElementById('favoriteText');
  if (isFav) {
    icon.className = 'fas fa-heart';
    textSpan.innerText = 'Retirer des favoris';
    favBtn.classList.add('active');
  } else {
    icon.className = 'far fa-heart';
    textSpan.innerText = 'Ajouter aux favoris';
    favBtn.classList.remove('active');
  }
}

// ======================= CARROUSEL MESSAGES =======================
const messagesList = [
  "🏡 Offrez-vous un cadre de vie exceptionnel avec ce type de logement conçu pour votre bien-être quotidien.",
  "✨ Une pépite rare : confort, sécurité et emplacement privilégié vous attendent.",
  "💎 Investissez dans votre bonheur : chaque détail a été pensé pour votre confort.",
  "🌿 Vivez une expérience unique, alliant modernité et sérénité.",
  "🚀 Ce bien immobilier booste votre quotidien et votre investissement.",
  "🏠 L'art de vivre selon SHOPNET IMMOBILIER : authenticité et élégance."
];
let messageInterval = null;
function startMessageCarousel() {
  const msgDiv = document.getElementById('messageText');
  if (!msgDiv) return;
  let idx = 0;
  if (messageInterval) clearInterval(messageInterval);
  messageInterval = setInterval(() => {
    idx = (idx + 1) % messagesList.length;
    msgDiv.classList.add('animate-out');
    setTimeout(() => {
      msgDiv.innerText = messagesList[idx];
      msgDiv.classList.remove('animate-out');
      msgDiv.classList.add('animate-in');
      setTimeout(() => msgDiv.classList.remove('animate-in'), 500);
    }, 500);
  }, 5000);
}

// ======================= RENDER DETAIL COMPLET =======================
function renderDetail(bien) {
  const images = bien.images?.length ? bien.images : ['https://placehold.co/800x500?text=SHOPNET+IMMO'];
  const lieu = [bien.ville, bien.commune, bien.quartier].filter(Boolean).join(', ');
  const priceFormatted = new Intl.NumberFormat().format(bien.prix);
  const typeOffre = bien.type_offre === 'Vente' ? 'achat' : 'mois';

  // Mini description dynamique
  const miniDesc = `Un ${bien.type_bien || 'bien'} en ${bien.type_offre || 'location'} situé à ${bien.ville || 'emplacement idéal'}, offrant un cadre agréable et pratique.`;

  const detailsHtml = `
    <div class="detail-item"><span class="detail-label"><i class="fas fa-map-pin"></i> Localisation</span><span class="detail-value">${escapeHtml(lieu)}</span></div>
    <div class="detail-item"><span class="detail-label"><i class="fas fa-arrows-alt"></i> Superficie</span><span class="detail-value">${bien.superficie ? bien.superficie + ' m²' : 'Non spécifiée'}</span></div>
    <div class="detail-item"><span class="detail-label"><i class="fas fa-bed"></i> Chambres</span><span class="detail-value">${bien.chambres || 0}</span></div>
    <div class="detail-item"><span class="detail-label"><i class="fas fa-bath"></i> SdB</span><span class="detail-value">${bien.salles_bain || 0}</span></div>
    ${bien.reference ? `<div class="detail-item"><span class="detail-label"><i class="fas fa-hashtag"></i> Réf.</span><span class="detail-value">${escapeHtml(bien.reference)}</span></div>` : ''}
  `;

  const mainHTML = `
    <div class="detail-grid">
      <div class="gallery">
        <img class="main-image" id="mainImage" src="${images[0]}" alt="${bien.titre}">
        <div class="thumbnails" id="thumbnails"></div>
      </div>
      <div class="info-section">
        <div class="title-row">
          <h1>${escapeHtml(bien.titre)}</h1>
          <button class="favorite-btn" id="favoriteBtn"><i class="far fa-heart"></i> <span id="favoriteText">Ajouter aux favoris</span></button>
        </div>
        <div class="price">À partir de ${priceFormatted} ${bien.devise} <small>/ ${typeOffre}</small></div>
        <div class="stats-badge">
          <span><i class="fas fa-shopping-cart"></i> <span id="reservationsCount">0</span> réservations</span>
          <span><i class="fas fa-heart"></i> <span id="favorisCountDisplay">${favoriteIds.length}</span> favoris</span>
        </div>
        <div class="meta-badge">${bien.type_bien || 'Bien'} • ${bien.type_offre === 'Vente' ? 'Vente' : 'Location'}</div>
        <div class="detail-list">${detailsHtml}</div>

        <!-- SECTION À PROPOS -->
        <div class="info-block">
          <h3><i class="fas fa-home"></i> À propos du bien</h3>
          <p>Ce bien a été soigneusement sélectionné pour offrir confort, sécurité et accessibilité. Idéal pour un usage personnel ou un investissement, il répond aux standards modernes de qualité.</p>
          <p><strong>✨ Mini description :</strong> ${miniDesc}</p>
        </div>

        <!-- SECTION LOCALISATION -->
        <div class="info-block">
          <h3><i class="fas fa-map-marker-alt"></i> Localisation</h3>
          <p>📍 Situé dans un quartier accessible et sécurisé, proche des commodités essentielles (routes principales, commerces, écoles).</p>
        </div>

        <!-- SECTION CONFIANCE -->
        <div class="info-block">
          <h3><i class="fas fa-shield-alt"></i> Transaction sécurisée</h3>
          <p>Ce bien a été vérifié et validé sur SHOPNET IMMOBILIER pour garantir une expérience fiable et transparente.</p>
        </div>

        <!-- SECTION CONTACT (incitative) -->
        <div class="info-block">
          <h3><i class="fas fa-comment-dots"></i> Contactez le propriétaire</h3>
          <p>Intéressé par ce bien ? Contactez directement le propriétaire pour plus d’informations ou pour organiser une visite.</p>
        </div>

        <!-- SECTION ENGAGEMENT -->
        <div class="info-block">
          <h3><i class="fas fa-bullhorn"></i> Opportunité unique</h3>
          <p>Ne manquez pas cette opportunité unique. Les biens de qualité comme celui-ci trouvent rapidement preneur.</p>
        </div>

        <!-- SECTION AVANTAGES -->
        <div class="info-block">
          <h3><i class="fas fa-check-circle"></i> Points forts</h3>
          <ul class="advantages-list">
            <li>✔ Bon emplacement</li>
            <li>✔ Prix compétitif</li>
            <li>✔ Accès facile</li>
            <li>✔ Idéal pour habitation ou investissement</li>
          </ul>
        </div>

        <div class="contact-actions">
          ${bien.whatsapp ? `<a href="#" id="whatsappDynamicBtn" class="whatsapp-btn" target="_blank"><i class="fab fa-whatsapp"></i> WhatsApp</a>` : ''}
          ${bien.telephone ? `<a href="tel:${bien.telephone.replace(/[^0-9+]/g, '')}" class="call-btn"><i class="fas fa-phone-alt"></i> Appeler</a>` : ''}
          <button class="share-btn" id="shareBtn"><i class="fas fa-share-alt"></i> Partager</button>
        </div>
        <button class="reserve-btn" id="reserveBtn"><i class="fas fa-calendar-check"></i> Réserver ce bien</button>
        <div class="message-carousel">
          <div class="message-text" id="messageText">🏡 Offrez-vous un cadre de vie exceptionnel...</div>
        </div>
      </div>
    </div>
    <div class="similar-section" id="similarSection" style="display: none;">
      <h2 class="similar-title">Plus de logements similaires</h2>
      <p class="similar-sub">Découvrez d’autres biens disponibles qui pourraient correspondre à vos besoins.</p>
      <div class="similar-grid" id="similarGrid"></div>
    </div>
  `;

  document.getElementById('detailContainer').innerHTML = mainHTML;

  // Miniatures
  const thumbContainer = document.getElementById('thumbnails');
  if (images.length > 1) {
    thumbContainer.innerHTML = images.map((img, idx) => `<img class="thumb ${idx===0?'active':''}" src="${img}" data-src="${img}">`).join('');
    document.querySelectorAll('.thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        document.getElementById('mainImage').src = thumb.dataset.src;
        document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
  }

  // Favori
  const favBtn = document.getElementById('favoriteBtn');
  updateFavoriteButtonState(bien.id);
  favBtn.addEventListener('click', () => {
    toggleFavorite(bien.id);
    updateFavoriteButtonState(bien.id);
    const favStatSpan = document.getElementById('favorisCountDisplay');
    if (favStatSpan) favStatSpan.innerText = favoriteIds.length;
  });

  // WhatsApp dynamique avec message prérempli
  if (bien.whatsapp) {
    const waBtn = document.getElementById('whatsappDynamicBtn');
    const whatsappNumber = bien.whatsapp.replace(/[^0-9+]/g, '');
    const message = encodeURIComponent(
      `Bonjour, je suis intéressé par le bien Immobilier "${bien.titre}" à ${bien.ville || 'localité'} vu sur SHOPNET IMMOBILIER. Est-il toujours disponible ?`
    );
    waBtn.href = `https://wa.me/${whatsappNumber}?text=${message}`;
  }

  // Partage (Web Share API fallback)
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const shareUrl = window.location.href;
      const shareText = `Découvrez ${bien.titre} - ${bien.prix} ${bien.devise} à ${bien.ville}`;
      if (navigator.share) {
        navigator.share({ title: bien.titre, text: shareText, url: shareUrl });
      } else {
        navigator.clipboard.writeText(shareUrl);
        alert('🔗 Lien copié dans le presse-papier !');
      }
    });
  }

  // Réservation mock
  let reservations = 0;
  document.getElementById('reserveBtn').addEventListener('click', () => {
    reservations++;
    document.getElementById('reservationsCount').innerText = reservations;
    alert(`✅ Bien réservé ! Total réservations : ${reservations}`);
  });

  startMessageCarousel();
}

// ======================= BIENS SIMILAIRES (DÉTAILS COMPLETS) =======================
async function loadSimilarProperties(ville) {
  try {
    const res = await fetch(`${API_BASE}/public`);
    const data = await res.json();
    if (data.success && data.biens) {
      let similars = data.biens.filter(b => b.id != currentBien.id && b.status === 'approved');
      if (ville) similars = similars.filter(b => b.ville === ville);
      similars = similars.slice(0, 4);
      if (similars.length) displaySimilarWithDetails(similars);
    }
  } catch(e) { console.warn(e); }
}

function displaySimilarWithDetails(biens) {
  const section = document.getElementById('similarSection');
  const grid = document.getElementById('similarGrid');
  if (!section || !grid) return;
  grid.innerHTML = biens.map(b => `
    <div class="similar-card" data-id="${b.id}">
      <img class="similar-card-img" src="${b.images?.[0] || 'https://placehold.co/400x250'}" alt="${b.titre}">
      <div class="similar-card-content">
        <div class="similar-card-title">${escapeHtml(b.titre)}</div>
        <div class="similar-card-price">${new Intl.NumberFormat().format(b.prix)} ${b.devise}</div>
        <div class="similar-card-details">
          <span>🏠 ${b.superficie || '?'} m²</span>
          <span>🛏️ ${b.chambres || 0}</span>
          <span>📍 ${b.ville || 'N/C'}</span>
        </div>
        <div class="similar-card-details" style="margin-top: 6px;">
          <span>📞 ${b.whatsapp ? 'WhatsApp dispo' : 'Contact'}</span>
        </div>
      </div>
    </div>
  `).join('');
  section.style.display = 'block';
  document.querySelectorAll('.similar-card').forEach(card => {
    card.addEventListener('click', () => window.location.href = `detail.html?id=${card.dataset.id}`);
  });
}

// ======================= MODAL FAVORIS =======================
async function refreshFavoritesModal() {
  const container = document.getElementById('favoritesListContainer');
  if (!container) return;
  if (favoriteIds.length === 0) {
    container.innerHTML = `<div class="empty-fav"><i class="far fa-heart"></i> Aucun bien en favori.<br>Ajoutez vos coups de cœur !</div>`;
    return;
  }
  container.innerHTML = '<div class="empty-fav">Chargement de vos favoris...</div>';
  const favBiens = [];
  for (let id of favoriteIds) {
    try {
      const resp = await fetch(`${API_BASE}/${id}`);
      const data = await resp.json();
      if (data.success) favBiens.push(data.bien);
    } catch(e) { console.warn(`Impossible de charger le bien ${id}`); }
  }
  if (favBiens.length === 0) {
    container.innerHTML = `<div class="empty-fav">Aucun bien valide en favori</div>`;
    return;
  }
  container.innerHTML = `<div class="favorites-list">${favBiens.map(b => `
    <div class="favorite-item" data-id="${b.id}">
      <img src="${b.images?.[0] || 'https://placehold.co/100'}" alt="${b.titre}">
      <div class="fav-info">
        <h4>${escapeHtml(b.titre)}</h4>
        <p>${new Intl.NumberFormat().format(b.prix)} ${b.devise}</p>
        <small>${b.ville || ''}</small>
      </div>
      <button class="remove-fav-btn" data-id="${b.id}">Retirer</button>
    </div>
  `).join('')}</div>`;
  document.querySelectorAll('.remove-fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idToRemove = parseInt(btn.dataset.id);
      removeFavorite(idToRemove);
      refreshFavoritesModal();
      if (currentBien && currentBien.id === idToRemove) {
        updateFavoriteButtonState(currentBien.id);
        const favStatSpan = document.getElementById('favorisCountDisplay');
        if (favStatSpan) favStatSpan.innerText = favoriteIds.length;
      }
    });
  });
  document.querySelectorAll('.favorite-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if(e.target.classList.contains('remove-fav-btn')) return;
      const id = item.dataset.id;
      if(id) window.location.href = `detail.html?id=${id}`;
    });
  });
}

// ======================= CHARGEMENT INITIAL =======================
async function loadBienDetail() {
  const id = new URLSearchParams(window.location.search).get('id');
  const container = document.getElementById('detailContainer');
  if (!id) {
    container.innerHTML = '<div class="error-message">❌ Aucun bien sélectionné</div>';
    return;
  }
  container.innerHTML = '<div class="loader">🔍 Chargement...</div>';
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error('Bien introuvable');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    currentBien = data.bien;
    currentBien.images = currentBien.images || [];
    renderDetail(currentBien);
    loadSimilarProperties(currentBien.ville);
  } catch (err) {
    container.innerHTML = `<div class="error-message">⚠️ ${err.message}</div>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

// Gestion modal
document.addEventListener('DOMContentLoaded', () => {
  loadFavoritesFromStorage();
  loadBienDetail();
  const modal = document.getElementById('favoritesModal');
  const openBtn = document.getElementById('openFavModalBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  if (openBtn && modal) {
    openBtn.addEventListener('click', async () => {
      await refreshFavoritesModal();
      modal.classList.add('active');
    });
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('active'); });
  }
});