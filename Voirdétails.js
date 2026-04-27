

// Configuration
const API_AGENT = 'https://shopnet-immo-backend.onrender.com/api/agent';

function getToken() {
  return localStorage.getItem('token');
}

async function fetchBienDetail(id) {
  try {
    const response = await fetch(`${API_AGENT}/my-biens`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Erreur chargement');
    const data = await response.json();
    if (data.success && data.biens) {
      const bien = data.biens.find(b => b.id == id);
      if (!bien) throw new Error('Bien non trouvé');
      return bien;
    } else {
      throw new Error('Aucun bien trouvé');
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function displayProperty() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    document.getElementById('detailsArea').innerHTML = '<div class="loader">❌ Aucun identifiant</div>';
    return;
  }

  try {
    const bien = await fetchBienDetail(id);
    renderProperty(bien);
  } catch (err) {
    document.getElementById('detailsArea').innerHTML = `<div class="loader">⚠️ ${err.message}</div>`;
  }
}

function renderProperty(bien) {
  // Titre
  document.getElementById('propertyTitle').innerText = bien.titre || 'Sans titre';

  // Préparation des données
  const lieu = [bien.ville, bien.commune, bien.quartier].filter(Boolean).join(', ') || 'Non renseigné';
  const typeOffre = bien.type_offre === 'Vente' ? 'Vente' : 'Location';
  const statusText = bien.status === 'approved' ? 'Approuvé' : (bien.status === 'pending' ? 'En attente' : 'Rejeté');
  const statusClass = bien.status;

  const fields = [
    { label: 'Type de bien', value: bien.type_bien || 'Non spécifié' },
    { label: 'Offre', value: typeOffre },
    { label: 'Prix', value: `${new Intl.NumberFormat().format(bien.prix)} ${bien.devise || 'USD'}` },
    { label: 'Localisation', value: lieu },
    { label: 'Superficie', value: bien.superficie ? `${bien.superficie} m²` : 'Non précisée' },
    { label: 'Chambres', value: bien.chambres || 0 },
    { label: 'Salles de bain', value: bien.salles_bain || 0 },
    { label: 'Date d\'ajout', value: bien.created_at ? new Date(bien.created_at).toLocaleDateString() : 'Inconnue' },
    { label: 'Statut', value: `<span class="status-badge ${statusClass}">${statusText}</span>` },
    { label: 'Référence', value: bien.reference || '---' },
    { label: 'Téléphone propriétaire', value: bien.telephone || 'Non communiqué' },
    { label: 'WhatsApp propriétaire', value: bien.whatsapp || 'Non communiqué' }
  ];

  let html = '<div class="info-grid">';
  fields.forEach(field => {
    html += `
      <div class="info-row">
        <div class="info-label">${field.label}</div>
        <div class="info-value">${field.value}</div>
      </div>
    `;
  });
  html += '</div>';
  document.getElementById('detailsArea').innerHTML = html;

  // Galerie
  const galleryDiv = document.getElementById('galleryArea');
  const galleryContainer = document.getElementById('gallery');
  if (bien.images && bien.images.length > 0) {
    galleryDiv.style.display = 'block';
    galleryContainer.innerHTML = bien.images.map(img => `<img src="${img}" alt="Photo">`).join('');
    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeBtn = document.querySelector('.close-lightbox');
    document.querySelectorAll('#gallery img').forEach(img => {
      img.addEventListener('click', () => {
        lightbox.style.display = 'flex';
        lightboxImg.src = img.src;
      });
    });
    closeBtn.addEventListener('click', () => lightbox.style.display = 'none');
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) lightbox.style.display = 'none';
    });
  } else {
    galleryDiv.style.display = 'none';
  }
}

// Vérification token
document.addEventListener('DOMContentLoaded', () => {
  if (!getToken()) {
    window.location.href = '/login.html';
    return;
  }
  displayProperty();
});