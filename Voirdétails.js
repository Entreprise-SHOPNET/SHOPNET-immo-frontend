


// Configuration PRODUCTION (Render)
const API_BASE = 'https://shopnet-immo-backend.onrender.com/api/agent';
const ANALYTICS_BASE = 'https://shopnet-immo-backend.onrender.com/api/analytics';

function getToken() {
  return localStorage.getItem('token');
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  if (!token) throw new Error('Non authentifié');
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
  if (!res.ok) {
    let errMsg = `Erreur HTTP ${res.status}`;
    try {
      const err = await res.json();
      errMsg = err.message || errMsg;
    } catch(e) {}
    throw new Error(errMsg);
  }
  return res.json();
}

function getBienId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function loadBienDetails() {
  const bienId = getBienId();
  if (!bienId) {
    document.getElementById('infoGrid').innerHTML = '<div class="error">ID manquant</div>';
    return;
  }

  try {
    const data = await apiFetch(`${API_BASE}/my-biens`);
    if (!data.success) throw new Error(data.message);
    const bien = data.biens.find(b => b.id == bienId);
    if (!bien) throw new Error('Bien non trouvé');

    let stats = { views: 0, whatsapp_clicks: 0, appels: 0 };
    try {
      const statsData = await apiFetch(`${ANALYTICS_BASE}/bien/${bienId}`);
      if (statsData.success) stats = statsData.stats;
    } catch(e) { console.warn('Stats indisponibles'); }

    displayPage(bien, stats);
  } catch (err) {
    document.getElementById('infoGrid').innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
  }
}

function displayPage(bien, stats) {
  document.getElementById('propertyTitle').innerText = bien.titre || 'Bien immobilier';
  const views = stats.views || 0;
  const perfMsg = document.getElementById('performanceMessage');
  if (views === 0) {
    perfMsg.innerHTML = `📊 <strong>${escapeHtml(bien.titre || 'Ce bien')}</strong> n'a pas encore de vue. Partagez-le !`;
  } else {
    perfMsg.innerHTML = `🎉 <strong>${escapeHtml(bien.titre || 'Ce bien')}</strong> a été vu <strong>${views} fois</strong> ! ${views > 10 ? 'Excellent début !' : 'Continuez à le promouvoir !'}`;
  }

  document.getElementById('statViews').innerText = views;
  document.getElementById('statWhatsapp').innerText = stats.whatsapp_clicks || 0;
  document.getElementById('statAppels').innerText = stats.appels || 0;

  const statusText = bien.status === 'approved' ? 'Approuvé' : (bien.status === 'pending' ? 'En attente' : 'Rejeté');
  const statusClass = bien.status;
  const datePub = bien.created_at ? new Date(bien.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Non spécifiée';

  const infoHtml = `
    <div class="info-cards">
      <div class="info-item"><div class="info-label">Type de bien</div><div class="info-value">${bien.type_bien || '-'}</div></div>
      <div class="info-item"><div class="info-label">Offre</div><div class="info-value">${bien.type_offre || '-'}</div></div>
      <div class="info-item"><div class="info-label">Prix</div><div class="info-value">${bien.prix} ${bien.devise}</div></div>
      <div class="info-item"><div class="info-label">Localisation</div><div class="info-value">${escapeHtml(bien.ville)} ${bien.commune ? ', '+bien.commune : ''} ${bien.quartier ? ', '+bien.quartier : ''}</div></div>
      <div class="info-item"><div class="info-label">Superficie</div><div class="info-value">${bien.superficie || '-'}</div></div>
      <div class="info-item"><div class="info-label">Chambres</div><div class="info-value">${bien.chambres || 0}</div></div>
      <div class="info-item"><div class="info-label">Salles de bain</div><div class="info-value">${bien.salles_bain || 0}</div></div>
      <div class="info-item"><div class="info-label">Statut</div><div class="info-value"><span class="status-badge ${statusClass}">${statusText}</span></div></div>
      <div class="info-item"><div class="info-label">Date publication</div><div class="info-value">${datePub}</div></div>
      <div class="info-item"><div class="info-label">Référence</div><div class="info-value">${escapeHtml(bien.reference) || '-'}</div></div>
      <div class="info-item" style="grid-column:1/-1;"><div class="info-label">Description</div><div class="info-value">${escapeHtml(bien.description) || 'Aucune description'}</div></div>
    </div>
  `;
  document.getElementById('infoGrid').innerHTML = infoHtml;

  const images = bien.images || [];
  const galleryBlock = document.getElementById('galleryBlock');
  const galleryContainer = document.getElementById('imagesGallery');
  if (images.length) {
    galleryContainer.innerHTML = images.map(img => `<img src="${img}" class="gallery-img" data-src="${img}">`).join('');
    galleryBlock.style.display = 'block';
    document.querySelectorAll('.gallery-img').forEach(img => {
      img.addEventListener('click', () => openLightbox(img.getAttribute('data-src')));
    });
  } else {
    galleryBlock.style.display = 'none';
  }
}

function openLightbox(src) {
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  lbImg.src = src;
  lb.style.display = 'flex';
}
function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
}
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

document.addEventListener('DOMContentLoaded', () => {
  if (!getToken()) {
    alert('Session expirée');
    window.location.href = '/login.html';
    return;
  }
  loadBienDetails();
  const lb = document.getElementById('lightbox');
  lb.addEventListener('click', (e) => {
    if (e.target === lb || e.target.classList.contains('lightbox-close')) closeLightbox();
  });
});