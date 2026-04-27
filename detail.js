


// Configuration API
const API_BASE = 'https://shopnet-immo-backend.onrender.com/api/biens';
let currentBien = null;
let favoriteIds = [];

// FAVORIS local storage
function loadFavorites() {
  const stored = localStorage.getItem('shopnet_favorites');
  favoriteIds = stored ? JSON.parse(stored) : [];
  updateFavCounter();
}
function saveFavorites() {
  localStorage.setItem('shopnet_favorites', JSON.stringify(favoriteIds));
  updateFavCounter();
}
function updateFavCounter() {
  const counter = document.getElementById('globalFavCount');
  if (counter) counter.innerText = favoriteIds.length;
  const favSpan = document.getElementById('favorisCountDisplay');
  if (favSpan) favSpan.innerText = favoriteIds.length;
}
function isFavorite(id) { return favoriteIds.includes(id); }
function addFavorite(id) { if (!isFavorite(id)) { favoriteIds.push(id); saveFavorites(); } }
function removeFavorite(id) { favoriteIds = favoriteIds.filter(fid => fid != id); saveFavorites(); }
function toggleFavorite(id) {
  if (isFavorite(id)) { removeFavorite(id); return false; }
  else { addFavorite(id); return true; }
}

// Mise à jour du bouton favori
function updateFavButton(bienId) {
  const btn = document.getElementById('favoriteBtn');
  if (!btn) return;
  const isFav = isFavorite(bienId);
  const icon = btn.querySelector('i');
  const textSpan = document.getElementById('favoriteText');
  if (isFav) {
    icon.className = 'fas fa-heart';
    textSpan.innerText = 'Retirer des favoris';
    btn.classList.add('active');
  } else {
    icon.className = 'far fa-heart';
    textSpan.innerText = 'Ajouter aux favoris';
    btn.classList.remove('active');
  }
}

// Messages animés
const messages = [
  "🏡 Offrez-vous un cadre de vie exceptionnel...",
  "✨ Une pépite rare : confort et sécurité.",
  "💎 Investissez dans votre bonheur.",
  "🌿 Vivez une expérience unique.",
  "🚀 Ce bien booste votre quotidien.",
  "🏠 L'art de vivre SHOPNET IMMOBILIER."
];
let msgInterval;
function startMessageCarousel() {
  const msgDiv = document.getElementById('messageText');
  if (!msgDiv) return;
  let idx = 0;
  if (msgInterval) clearInterval(msgInterval);
  msgInterval = setInterval(() => {
    idx = (idx + 1) % messages.length;
    msgDiv.style.opacity = '0';
    setTimeout(() => {
      msgDiv.innerText = messages[idx];
      msgDiv.style.opacity = '1';
    }, 300);
  }, 5000);
}

// Affichage complet
function renderDetail(bien) {
  const images = bien.images?.length ? bien.images : ['https://placehold.co/800x500?text=SHOPNET+IMMO'];
  const lieu = [bien.ville, bien.commune, bien.quartier].filter(Boolean).join(', ');
  const priceFormatted = new Intl.NumberFormat().format(bien.prix);
  const typeOffre = bien.type_offre === 'Vente' ? 'achat' : 'mois';
  const miniDesc = `${bien.type_bien || 'Bien'} en ${bien.type_offre || 'location'} à ${bien.ville || 'emplacement idéal'}.`;

  const detailsHtml = `
    <div class="detail-item"><span class="detail-label"><i class="fas fa-map-pin"></i> Localisation</span><span class="detail-value">${escapeHtml(lieu)}</span></div>
    <div class="detail-item"><span class="detail-label"><i class="fas fa-arrows-alt"></i> Superficie</span><span class="detail-value">${bien.superficie ? bien.superficie + ' m²' : 'Non spécifiée'}</span></div>
    <div class="detail-item"><span class="detail-label"><i class="fas fa-bed"></i> Chambres</span><span class="detail-value">${bien.chambres || 0}</span></div>
    <div class="detail-item"><span class="detail-label"><i class="fas fa-bath"></i> SdB</span><span class="detail-value">${bien.salles_bain || 0}</span></div>
    <div class="detail-item"><span class="detail-label"><i class="fas fa-hashtag"></i> Réf.</span><span class="detail-value">${escapeHtml(bien.reference || '---')}</span></div>
  `;

  const html = `
    <div class="gallery">
      <img class="main-image" id="mainImage" src="${images[0]}" alt="${bien.titre}">
      <div class="thumbnails" id="thumbnails"></div>
    </div>
    <div class="detail-content">
      <div class="title-row">
        <h1>${escapeHtml(bien.titre)}</h1>
        <button class="favorite-btn" id="favoriteBtn"><i class="far fa-heart"></i> <span id="favoriteText">Ajouter aux favoris</span></button>
      </div>
      <div class="price">${priceFormatted} ${bien.devise} <small>/ ${typeOffre}</small></div>
      <div class="stats-badge">
        <span><i class="fas fa-shopping-cart"></i> <span id="reservationsCount">0</span> réservations</span>
        <span><i class="fas fa-heart"></i> <span id="favorisCountDisplay">${favoriteIds.length}</span> favoris</span>
      </div>
      <div class="meta-badge">${bien.type_bien || 'Bien'} • ${bien.type_offre === 'Vente' ? 'Vente' : 'Location'}</div>
      <div class="detail-list">${detailsHtml}</div>

      <div class="info-block"><h3><i class="fas fa-home"></i> À propos</h3><p>${miniDesc}</p></div>
      <div class="info-block"><h3><i class="fas fa-map-marker-alt"></i> Localisation</h3><p>📍 ${lieu || 'Quartier accessible, proche commodités'}</p></div>
      <div class="info-block"><h3><i class="fas fa-shield-alt"></i> Transaction sécurisée</h3><p>Bien vérifié par SHOPNET IMMOBILIER.</p></div>
      <div class="info-block"><h3><i class="fas fa-comment-dots"></i> Contact</h3><p>Contactez le propriétaire via WhatsApp ou téléphone.</p></div>
      <div class="info-block"><h3><i class="fas fa-check-circle"></i> Points forts</h3><ul class="advantages-list"><li>✔ Bon emplacement</li><li>✔ Prix compétitif</li><li>✔ Accès facile</li></ul></div>

      <div class="contact-actions">
        ${bien.whatsapp ? `<a href="#" id="whatsappDynamicBtn" class="whatsapp-btn"><i class="fab fa-whatsapp"></i> WhatsApp</a>` : ''}
        ${bien.telephone ? `<a href="tel:${bien.telephone.replace(/[^0-9+]/g, '')}" class="call-btn"><i class="fas fa-phone-alt"></i> Appeler</a>` : ''}
        <button class="share-btn" id="shareBtn"><i class="fas fa-share-alt"></i> Partager</button>
      </div>
      <button class="reserve-btn" id="reserveBtn"><i class="fas fa-calendar-check"></i> Réserver ce bien</button>
      <div class="message-carousel"><div class="message-text" id="messageText">🏡 Offrez-vous un cadre de vie exceptionnel...</div></div>
    </div>
    <div class="similar-section" id="similarSection" style="display: none;">
      <h2 class="similar-title">Logements similaires</h2>
      <div class="similar-grid" id="similarGrid"></div>
    </div>
  `;

  document.getElementById('detailContainer').innerHTML = html;

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

  updateFavButton(bien.id);
  document.getElementById('favoriteBtn')?.addEventListener('click', () => {
    toggleFavorite(bien.id);
    updateFavButton(bien.id);
    updateFavCounter();
  });

  // WhatsApp avec indicateur pays +243
  if (bien.whatsapp) {
    const waBtn = document.getElementById('whatsappDynamicBtn');
    let rawNumber = bien.whatsapp.toString().replace(/\D/g, '');
    // S'assurer que le numéro commence par 243 (RDC) ou ajouter 243 par défaut
    if (!rawNumber.startsWith('243') && rawNumber.length === 9) {
      rawNumber = '243' + rawNumber;
    } else if (!rawNumber.startsWith('243') && rawNumber.length > 9 && !rawNumber.startsWith('243')) {
      // Si déjà un code autre, on laisse tel quel mais mieux vaut forcer 243
      rawNumber = '243' + rawNumber.slice(-9);
    }
    const whatsappUrl = `https://wa.me/${rawNumber}`;
    const messageText = encodeURIComponent(
      `Bonjour, je suis intéressé par le bien "${bien.titre}" (${bien.prix} ${bien.devise}) à ${bien.ville || 'RDC'}.\n\n🔗 Lien de l'annonce : ${window.location.href}\n\nEst-il toujours disponible ? Merci.`
    );
    waBtn.href = `${whatsappUrl}?text=${messageText}`;
    waBtn.target = '_blank';
  }

  // Partage
  document.getElementById('shareBtn')?.addEventListener('click', () => {
    if (navigator.share) navigator.share({ title: bien.titre, url: window.location.href });
    else navigator.clipboard.writeText(window.location.href).then(() => alert('Lien copié'));
  });

  // Réservation fictive
  let reservations = 0;
  document.getElementById('reserveBtn')?.addEventListener('click', () => {
    reservations++;
    document.getElementById('reservationsCount').innerText = reservations;
    alert(`✅ Bien réservé ! Total : ${reservations}`);
  });

  startMessageCarousel();
}

// Chargement des biens similaires
async function loadSimilar(ville) {
  try {
    const res = await fetch(`${API_BASE}/public`);
    const data = await res.json();
    if (data.success && data.biens) {
      let similars = data.biens.filter(b => b.id != currentBien.id && b.status === 'approved');
      if (ville) similars = similars.filter(b => b.ville === ville);
      similars = similars.slice(0, 4);
      if (similars.length) {
        const section = document.getElementById('similarSection');
        const grid = document.getElementById('similarGrid');
        section.style.display = 'block';
        grid.innerHTML = similars.map(b => `
          <div class="similar-card" data-id="${b.id}">
            <img class="similar-card-img" src="${b.images?.[0] || 'https://placehold.co/400x250'}" alt="${b.titre}">
            <div class="similar-card-content">
              <div class="similar-card-title">${escapeHtml(b.titre)}</div>
              <div class="similar-card-price">${new Intl.NumberFormat().format(b.prix)} ${b.devise}</div>
              <div class="similar-card-details">
                <span>🏠 ${b.superficie || '?'} m²</span>
                <span>🛏️ ${b.chambres || 0}</span>
              </div>
            </div>
          </div>
        `).join('');
        document.querySelectorAll('.similar-card').forEach(card => {
          card.addEventListener('click', () => window.location.href = `detail.html?id=${card.dataset.id}`);
        });
      }
    }
  } catch(e) { console.warn(e); }
}

// Modal favoris
async function refreshFavModal() {
  const container = document.getElementById('favoritesListContainer');
  if (!container) return;
  if (!favoriteIds.length) {
    container.innerHTML = `<div class="empty-fav"><i class="far fa-heart"></i> Aucun favori</div>`;
    return;
  }
  const favBiens = [];
  for (let id of favoriteIds) {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      const data = await res.json();
      if (data.success) favBiens.push(data.bien);
    } catch(e) {}
  }
  if (!favBiens.length) {
    container.innerHTML = `<div class="empty-fav">Aucun bien valide</div>`;
    return;
  }
  container.innerHTML = `<div class="favorites-list">${favBiens.map(b => `
    <div class="favorite-item" data-id="${b.id}">
      <img src="${b.images?.[0] || 'https://placehold.co/100'}">
      <div class="fav-info">
        <h4>${escapeHtml(b.titre)}</h4>
        <p>${new Intl.NumberFormat().format(b.prix)} ${b.devise}</p>
      </div>
      <button class="remove-fav-btn" data-id="${b.id}">Retirer</button>
    </div>
  `).join('')}</div>`;
  document.querySelectorAll('.remove-fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFavorite(parseInt(btn.dataset.id));
      refreshFavModal();
      if (currentBien && currentBien.id == btn.dataset.id) updateFavButton(currentBien.id);
    });
  });
  document.querySelectorAll('.favorite-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-fav-btn')) return;
      window.location.href = `detail.html?id=${item.dataset.id}`;
    });
  });
}

// Chargement principal
async function loadDetail() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    document.getElementById('detailContainer').innerHTML = '<div class="error-message">❌ Aucun bien sélectionné</div>';
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    currentBien = data.bien;
    currentBien.images = currentBien.images || [];
    renderDetail(currentBien);
    loadSimilar(currentBien.ville);
  } catch(err) {
    document.getElementById('detailContainer').innerHTML = `<div class="error-message">⚠️ ${err.message}</div>`;
  }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  loadFavorites();
  loadDetail();
  const modal = document.getElementById('favoritesModal');
  const openBtn = document.getElementById('openFavModalBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  if (openBtn && modal) {
    openBtn.addEventListener('click', async () => {
      await refreshFavModal();
      modal.classList.add('active');
    });
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}