

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
    let errMsg = `Erreur ${res.status}`;
    try { const err = await res.json(); errMsg = err.message || errMsg; } catch(e) {}
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
  initMobileUI();
});

async function loadUserProfile() {
  try {
    const data = await apiFetch('/me');
    if (data.success) {
      const user = data.user;
      const name = user.nom_complet || 'Agent';
      document.getElementById('welcomeName').innerText = name;
      document.getElementById('drawerName').innerText = name;
      const avatarUrl = user.photo_profil || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f3b5f&color=fff&size=100`;
      document.getElementById('mobileAvatar').src = avatarUrl;
      document.getElementById('drawerAvatar').src = avatarUrl;
      const statusSpan = document.getElementById('drawerStatus');
      if (user.status === 'ACTIVE') {
        statusSpan.innerText = 'ACTIF';
        statusSpan.className = 'status-badge active';
      } else {
        statusSpan.innerText = user.status;
      }
      updateStarsRating(4.5, 'drawerStars');
    }
  } catch (err) {
    console.error(err);
    if (err.message.includes('401')) logout();
  }
}

async function loadAgentBiens() {
  try {
    const response = await apiFetch('/my-biens');
    if (response.success) {
      allBiens = response.biens.map(b => ({
        ...b,
        coverImage: b.images?.[0] || null
      }));
      updateStats();
      displayRecentProperties();
      displayAllProperties();
    }
  } catch (err) {
    console.error(err);
    showToast(err.message, 'error');
  }
}

function updateStats() {
  const total = allBiens.length;
  const approved = allBiens.filter(b => b.status === 'approved').length;
  const pending = allBiens.filter(b => b.status === 'pending').length;
  const rejected = allBiens.filter(b => b.status === 'rejected').length;
  document.getElementById('statTotalMob').innerText = total;
  document.getElementById('statApprovedMob').innerText = approved;
  document.getElementById('statPendingMob').innerText = pending;
  document.getElementById('statRejectedMob').innerText = rejected;
}

function displayRecentProperties() {
  const container = document.getElementById('recentListMobile');
  const recent = allBiens.slice(0, 3);
  if (!recent.length) {
    container.innerHTML = '<div class="empty-state">Aucune annonce récente</div>';
    return;
  }
  container.innerHTML = recent.map(b => createCard(b)).join('');
  attachViewListeners();
}

function displayAllProperties() {
  const container = document.getElementById('allPropertiesList');
  let filtered = allBiens;
  if (currentFilter !== 'all') filtered = allBiens.filter(b => b.status === currentFilter);
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state">Aucun bien trouvé</div>';
    return;
  }
  container.innerHTML = filtered.map(b => createCard(b)).join('');
  attachViewListeners();
}

function createCard(bien) {
  const statusClass = bien.status;
  const statusText = bien.status === 'approved' ? 'Approuvé' : (bien.status === 'pending' ? 'En attente' : 'Rejeté');
  const price = `${parseFloat(bien.prix).toLocaleString()} ${bien.devise || 'USD'}`;
  const imageUrl = bien.coverImage || 'https://placehold.co/400x300?text=SHOPNET';
  return `
    <div class="property-card-mobile" data-id="${bien.id}">
      <div class="property-img" style="background-image: url('${imageUrl}')">
        <span class="property-status ${statusClass}">${statusText}</span>
      </div>
      <div class="property-info">
        <h4>${escapeHtml(bien.titre || 'Sans titre')}</h4>
        <div class="property-price">${price}</div>
        <div class="property-location">${escapeHtml(bien.ville || '')}</div>
        <button class="btn-view" data-id="${bien.id}">Voir détails</button>
      </div>
    </div>
  `;
}

function attachViewListeners() {
  document.querySelectorAll('.btn-view').forEach(btn => {
    btn.removeEventListener('click', handleView);
    btn.addEventListener('click', handleView);
  });
}

function handleView(e) {
  const id = e.currentTarget.getAttribute('data-id');
  window.location.href = `Voirdétails.html?id=${id}`;
}

function initMobileUI() {
  // Navigation bottom
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById(`${tab}View`).classList.add('active');
      if (tab === 'properties') displayAllProperties();
      if (tab === 'dashboard') displayRecentProperties();
    });
  });
  // Filtres biens
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      displayAllProperties();
    });
  });
  // Tiroir profil
  const profileBtn = document.getElementById('profileMenuBtn');
  const drawer = document.getElementById('profileDrawer');
  profileBtn.addEventListener('click', () => drawer.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!drawer.contains(e.target) && !profileBtn.contains(e.target) && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
    }
  });
  document.getElementById('drawerHomeBtn')?.addEventListener('click', (e) => {
    e.preventDefault(); window.location.href = '/';
  });
  document.getElementById('drawerSupportBtn')?.addEventListener('click', (e) => {
    e.preventDefault(); window.open('https://wa.me/243123456789', '_blank');
  });
  document.getElementById('drawerLogoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault(); logout();
  });
  document.getElementById('mobileBoostBtn')?.addEventListener('click', () => {
    showToast('Booster bientôt disponible', 'info');
  });
}

function logout() {
  if (confirm('Déconnexion ?')) {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
  }
}

function updateStarsRating(rating, targetId) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = '';
  for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
  if (half) html += '<i class="fas fa-star-half-alt"></i>';
  for (let i = 0; i < 5 - Math.ceil(rating); i++) html += '<i class="far fa-star"></i>';
  document.getElementById(targetId).innerHTML = html;
}

function showToast(msg, type) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = msg;
  toast.style.position = 'fixed';
  toast.style.bottom = '70px';
  toast.style.left = '16px';
  toast.style.right = '16px';
  toast.style.backgroundColor = type === 'error' ? '#ef4444' : '#0f3b5f';
  toast.style.color = 'white';
  toast.style.padding = '12px';
  toast.style.borderRadius = '40px';
  toast.style.textAlign = 'center';
  toast.style.zIndex = '200';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}