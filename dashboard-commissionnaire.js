

// Configuration// Configuration
const API_BASE = 'https://shopnet-immo-backend.onrender.com/api/agent';

function getToken() {
  return localStorage.getItem('token');
}

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
    let errMsg = `Erreur HTTP ${res.status}`;
    try {
      const err = await res.json();
      errMsg = err.message || errMsg;
    } catch(e) {}
    throw new Error(errMsg);
  }
  return res.json();
}

let allBiens = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  if (!getToken()) {
    window.location.href = '/login.html';
    return;
  }
  await loadUserProfile();
  await loadAgentBiens();
  initEventListeners();
});

async function loadAgentBiens() {
  try {
    const response = await apiFetch('/my-biens');
    if (response.success) {
      allBiens = response.biens.map(bien => ({
        ...bien,
        coverImage: bien.images && bien.images.length > 0 ? bien.images[0] : null,
        images: bien.images || []
      }));
      updateStatsCounters();
      displayRecentProperties();
      displayPropertiesGrid();
    } else {
      showToast('Erreur chargement biens', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast(err.message, 'error');
    if (err.message.includes('401')) {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    }
  }
}

function updateStatsCounters() {
  const total = allBiens.length;
  const approved = allBiens.filter(b => b.status === 'approved').length;
  const pending = allBiens.filter(b => b.status === 'pending').length;
  const rejected = allBiens.filter(b => b.status === 'rejected').length;
  document.getElementById('statTotal').innerText = total;
  document.getElementById('statApproved').innerText = approved;
  document.getElementById('statPending').innerText = pending;
  document.getElementById('statRejected').innerText = rejected;
}

function displayRecentProperties() {
  const container = document.getElementById('recentPropertiesGrid');
  if (!container) return;
  const recent = allBiens.slice(0, 3);
  if (recent.length === 0) {
    container.innerHTML = `<p class="empty-message">Aucune annonce. <a href="publier-bien.html">Cliquez ici pour ajouter votre premier bien</a>.</p>`;
    return;
  }
  container.innerHTML = recent.map(bien => createPropertyCard(bien)).join('');
  attachViewEvents();
}

function displayPropertiesGrid() {
  const container = document.getElementById('propertiesGrid');
  if (!container) return;
  let filtered = allBiens;
  if (currentFilter !== 'all') {
    filtered = allBiens.filter(b => b.status === currentFilter);
  }
  if (filtered.length === 0) {
    container.innerHTML = `<p class="empty-message">Aucun bien ${currentFilter !== 'all' ? currentFilter : ''}.</p>`;
    return;
  }
  container.innerHTML = filtered.map(bien => createPropertyCard(bien)).join('');
  attachViewEvents();
}

function createPropertyCard(bien) {
  const statusClass = bien.status;
  const statusText = bien.status === 'approved' ? 'Approuvé' : (bien.status === 'pending' ? 'En attente' : 'Rejeté');
  const price = `${parseFloat(bien.prix).toLocaleString()} ${bien.devise || 'USD'}`;
  const imageUrl = bien.coverImage || 'https://placehold.co/400x300?text=SHOPNET-IMMO';
  return `
    <div class="property-card" data-id="${bien.id}">
      <div class="property-image" style="background-image: url('${imageUrl}')">
        <span class="property-status ${statusClass}">${statusText}</span>
      </div>
      <div class="property-info">
        <h3>${escapeHtml(bien.titre || 'Sans titre')}</h3>
        <div class="property-price">${price}</div>
        <div class="property-location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(bien.ville || '')} ${bien.commune ? ', '+bien.commune : ''}</div>
        <div class="property-meta">
          <span><i class="fas fa-bed"></i> ${bien.chambres || 0} ch.</span>
          <span><i class="fas fa-bath"></i> ${bien.salles_bain || 0} sdb</span>
          <span><i class="fas fa-arrows-alt"></i> ${bien.superficie || '-'}</span>
        </div>
        <button class="btn-view-property" data-id="${bien.id}">Voir détails</button>
      </div>
    </div>
  `;
}

function attachViewEvents() {
  document.querySelectorAll('.btn-view-property').forEach(btn => {
    btn.removeEventListener('click', handleViewClick);
    btn.addEventListener('click', handleViewClick);
  });
}

// Modification : rediriger vers Voirdétails.html avec l'ID
function handleViewClick(e) {
  const id = e.currentTarget.getAttribute('data-id');
  window.location.href = `Voirdétails.html?id=${id}`;
}

// Suppression de l'ancienne fonction openPropertyDetail, closeModal, etc. (plus nécessaires)
// On garde uniquement les fonctions de navigation et les helpers

function setActiveSection(section) {
  document.querySelectorAll('.dashboard-section').forEach(sec => sec.classList.remove('active'));
  const target = document.getElementById(`${section}Section`);
  if (target) target.classList.add('active');
  document.querySelectorAll('.sidebar-nav li a').forEach(link => link.classList.remove('active'));
  const activeLink = Array.from(document.querySelectorAll('.sidebar-nav li a')).find(link => link.getAttribute('data-section') === section);
  if (activeLink) activeLink.classList.add('active');
  const titles = {
    dashboard: 'Tableau de bord',
    orders: 'Commandes',
    clients: 'Clients',
    revenue: 'Revenus',
    properties: 'Mes biens',
    messages: 'Messages',
    notifications: 'Notifications',
    settings: 'Paramètres'
  };
  document.getElementById('pageTitle').innerText = titles[section] || 'Tableau de bord';
}

function initEventListeners() {
  document.querySelectorAll('.sidebar-nav li a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.getAttribute('data-section');
      if (section) setActiveSection(section);
      if (section === 'properties') displayPropertiesGrid();
    });
  });
  document.querySelectorAll('.filter-property-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-property-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      displayPropertiesGrid();
    });
  });
  document.getElementById('boostNowBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Booster bientôt disponible', 'info');
  });
  document.getElementById('supportWhatsappBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.open('https://wa.me/243123456789', '_blank');
  });
  document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Déconnexion ?')) {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    }
  });
}

async function loadUserProfile() {
  try {
    const data = await apiFetch('/me');
    if (data.success) {
      const user = data.user;
      document.getElementById('agentName').innerText = user.nom_complet || 'Commissionnaire';
      document.getElementById('agentAvatar').src = user.photo_profil || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nom_complet || 'Agent')}&background=0f3b5f&color=fff&size=100`;
      const statusSpan = document.getElementById('agentStatus');
      if (user.status === 'ACTIVE') {
        statusSpan.innerText = 'ACTIF';
        statusSpan.className = 'status-badge active';
      } else {
        statusSpan.innerText = user.status;
        statusSpan.className = 'status-badge pending';
      }
      updateStarsRating(4.5);
    }
  } catch (err) {
    console.error(err);
    if (err.message.includes('401')) {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    }
  }
}

function updateStarsRating(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = '';
  for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
  if (half) html += '<i class="fas fa-star-half-alt"></i>';
  for (let i = 0; i < 5 - Math.ceil(rating); i++) html += '<i class="far fa-star"></i>';
  document.getElementById('ratingStars').innerHTML = html;
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

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}