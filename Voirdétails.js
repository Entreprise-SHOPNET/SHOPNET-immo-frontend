

const API_BASE = 'https://shopnet-immo-backend.onrender.com/api/biens';

function getToken() {
  return localStorage.getItem('token');
}

async function loadPropertyDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) {
    document.getElementById('infoGrid').innerHTML = '<div class="loader">❌ Aucun identifiant de bien</div>';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Impossible de charger le bien');
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    const bien = data.bien;
    bien.images = bien.images || [];
    renderPropertyData(bien);
  } catch (err) {
    console.error(err);
    document.getElementById('infoGrid').innerHTML = `<div class="loader">⚠️ Erreur : ${err.message}</div>`;
  }
}

function renderPropertyData(bien) {
  // Titre
  document.getElementById('propertyTitle').innerText = bien.titre || 'Sans titre';

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
      <div class="info-item"><div class="info-label">📞 Téléphone propriétaire</div><div class="info-value">${escapeHtml(bien.telephone || 'Non communiqué')}</div></div>
      <div class="info-item"><div class="info-label">📱 WhatsApp propriétaire</div><div class="info-value">${escapeHtml(bien.whatsapp || 'Non communiqué')}</div></div>
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