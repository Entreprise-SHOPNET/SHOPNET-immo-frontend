

const API_BASE = 'https://shopnet-immo-backend.onrender.com/api/agent';

let currentBien = null;

// Récupération du token depuis localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Fonction d'appel API sécurisée
async function apiFetch(url, options = {}) {
  const token = getToken();
  if (!token) throw new Error('Non authentifié');
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
  if (!res.ok) {
    let errMsg = `Erreur ${res.status}`;
    try { const err = await res.json(); errMsg = err.message || errMsg; } catch(e) {}
    throw new Error(errMsg);
  }
  return res.json();
}

// Chargement du bien depuis l'API (endpoint /my-biens/:id ? ou /biens/:id)
// On utilise l'endpoint /biens/:id (public) mais avec token pour voir même les stats privées ?
// Le backend précédent avait /api/agent/my-biens, mais pour un détail spécifique on peut faire /api/agent/biens/:id
// Je vais supposer qu'il existe /api/agent/bien/:id ou /api/biens/:id (public). 
// Pour plus de fiabilité, j'utilise /api/biens/public?id=... ou /api/biens/:id
// Mais le dashboard utilisait /my-biens. Je vais utiliser /api/biens/:id public car le propriétaire voit ses propres biens, mais le token peut être requis.
// Je privilégie /api/biens/:id avec token (car stats privées). Je crée un endpoint générique.

async function loadPropertyDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) {
    document.getElementById('infoGrid').innerHTML = '<div class="loader">❌ Aucun identifiant de bien</div>';
    return;
  }

  try {
    // Tentative avec l'API agent (authentifiée)
    // Si le backend ne fournit pas /agent/bien/:id, on utilise /biens/:id avec token
    const response = await fetch(`https://shopnet-immo-backend.onrender.com/api/biens/${id}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Impossible de charger le bien');
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    currentBien = data.bien;
    currentBien.images = currentBien.images || [];
    renderPropertyData(currentBien);
  } catch (err) {
    console.error(err);
    document.getElementById('infoGrid').innerHTML = `<div class="loader">⚠️ Erreur : ${err.message}</div>`;
  }
}

// Affichage des informations
function renderPropertyData(bien) {
  // Titre
  document.getElementById('propertyTitle').innerText = bien.titre || 'Sans titre';

  // Statistiques (valeurs mockées ou réelles si backend les fournit)
  document.getElementById('statViews').innerText = bien.vues_total || bien.vues || 0;
  document.getElementById('statWhatsapp').innerText = bien.clics_whatsapp || 0;
  document.getElementById('statAppels').innerText = bien.appels || 0;

  // Grille d'informations détaillées
  const lieu = [bien.ville, bien.commune, bien.quartier].filter(Boolean).join(', ');
  const typeOffre = bien.type_offre === 'Vente' ? 'Vente' : 'Location';
  const statusText = bien.status === 'approved' ? 'Approuvé' : (bien.status === 'pending' ? 'En attente' : 'Rejeté');
  const statusClass = bien.status;

  const infoHtml = `
    <div class="info-cards">
      <div class="info-item"><div class="info-label">🏷️ Type de bien</div><div class="info-value">${escapeHtml(bien.type_bien || 'Non spécifié')}</div></div>
      <div class="info-item"><div class="info-label">📌 Offre</div><div class="info-value">${typeOffre}</div></div>
      <div class="info-item"><div class="info-label">💰 Prix</div><div class="info-value">${new Intl.NumberFormat().format(bien.prix)} ${bien.devise || 'USD'}</div></div>
      <div class="info-item"><div class="info-label">📍 Localisation</div><div class="info-value">${escapeHtml(lieu || 'Non renseigné')}</div></div>
      <div class="info-item"><div class="info-label">📐 Superficie</div><div class="info-value">${bien.superficie ? bien.superficie + ' m²' : 'Non précisée'}</div></div>
      <div class="info-item"><div class="info-label">🛏️ Chambres</div><div class="info-value">${bien.chambres || 0}</div></div>
      <div class="info-item"><div class="info-label">🛁 Salles de bain</div><div class="info-value">${bien.salles_bain || 0}</div></div>
      <div class="info-item"><div class="info-label">📅 Date d’ajout</div><div class="info-value">${bien.created_at ? new Date(bien.created_at).toLocaleDateString() : 'Non disponible'}</div></div>
      <div class="info-item"><div class="info-label">✅ Statut</div><div class="info-value"><span class="status-badge ${statusClass}">${statusText}</span></div></div>
      ${bien.reference ? `<div class="info-item"><div class="info-label">🔖 Référence</div><div class="info-value">${escapeHtml(bien.reference)}</div></div>` : ''}
      <div class="info-item"><div class="info-label">📞 Téléphone propriétaire</div><div class="info-value">${bien.telephone ? escapeHtml(bien.telephone) : 'Non communiqué'}</div></div>
      <div class="info-item"><div class="info-label">📱 WhatsApp propriétaire</div><div class="info-value">${bien.whatsapp ? escapeHtml(bien.whatsapp) : 'Non communiqué'}</div></div>
    </div>
  `;
  document.getElementById('infoGrid').innerHTML = infoHtml;

  // Galerie photos
  const galBlock = document.getElementById('galleryBlock');
  const galContainer = document.getElementById('imagesGallery');
  if (bien.images && bien.images.length > 0) {
    galBlock.style.display = 'block';
    galContainer.innerHTML = bien.images.map(img => `<img src="${img}" alt="Photo du bien" loading="lazy">`).join('');
    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeLightbox = document.querySelector('.lightbox-close');
    document.querySelectorAll('#imagesGallery img').forEach(img => {
      img.addEventListener('click', () => {
        lightbox.style.display = 'flex';
        lightboxImg.src = img.src;
      });
    });
    closeLightbox.addEventListener('click', () => lightbox.style.display = 'none');
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) lightbox.style.display = 'none';
    });
  } else {
    galBlock.style.display = 'none';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

// Vérification de l'authentification
document.addEventListener('DOMContentLoaded', () => {
  if (!getToken()) {
    window.location.href = '/login.html';
    return;
  }
  loadPropertyDetail();
});