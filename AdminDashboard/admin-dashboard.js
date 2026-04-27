

// Configuration API
// Configuration
// Configuration API
const API_BASE = 'https://shopnet-immo-backend.onrender.com/api/admin';

// État global
let allUsers = [];
let filteredUsers = [];
let currentStatus = 'all';
let currentPage = 1;
const itemsPerPage = 10;

// Helper: récupérer le token JWT
function getToken() {
    return localStorage.getItem('token');
}

// Helper: requête fetch authentifiée
async function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, {
        ...options,
        headers
    });
    if (!response.ok) {
        let errMsg = `Erreur HTTP ${response.status}`;
        try {
            const err = await response.json();
            errMsg = err.message || errMsg;
        } catch(e) {}
        throw new Error(errMsg);
    }
    return response.json();
}

// Charger la liste complète des commissionnaires + stats
async function loadAllUsers() {
    try {
        const data = await apiFetch(`${API_BASE}/commissionnaires`);
        if (data.success) {
            allUsers = data.users || [];
            // Mise à jour des stats
            const stats = data.stats || { pending: 0, active: 0, rejected: 0 };
            document.getElementById('stat-pending').innerText = stats.pending;
            document.getElementById('stat-active').innerText = stats.active;
            document.getElementById('stat-rejected').innerText = stats.rejected;
            document.getElementById('pending-count').innerText = stats.pending;
            
            applyFiltersAndRender();
        } else {
            showToast(data.message || 'Erreur de chargement', 'error');
            allUsers = [];
            applyFiltersAndRender();
        }
    } catch (err) {
        console.error(err);
        showToast(err.message || 'Erreur réseau', 'error');
        if (err.message.includes('401') || err.message.includes('Non authentifié')) {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        }
        allUsers = [];
        applyFiltersAndRender();
    }
}

// Appliquer les filtres (statut, recherche, période) et rafraîchir l'affichage
function applyFiltersAndRender() {
    // 1. Filtre par statut
    let filtered = [...allUsers];
    if (currentStatus !== 'all') {
        filtered = filtered.filter(u => u.status === currentStatus);
    }
    
    // 2. Recherche textuelle (nom_complet, telephone, email)
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(u => 
            (u.nom_complet && u.nom_complet.toLowerCase().includes(searchTerm)) ||
            (u.telephone && u.telephone.includes(searchTerm)) ||
            (u.email && u.email.toLowerCase().includes(searchTerm))
        );
    }
    
    // 3. Filtre par période (created_at)
    const period = document.getElementById('periodFilter').value;
    if (period !== 'all') {
        const now = new Date();
        let startDate;
        if (period === 'today') {
            startDate = new Date(now.setHours(0,0,0,0));
        } else if (period === 'week') {
            startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (period === 'month') {
            startDate = new Date(now.setMonth(now.getMonth() - 1));
        }
        filtered = filtered.filter(u => {
            if (!u.created_at) return false;
            const created = new Date(u.created_at);
            return created >= startDate;
        });
    }
    
    filteredUsers = filtered;
    currentPage = 1;
    renderTable();
}

// Affichage du tableau avec pagination
function renderTable() {
    const tbody = document.getElementById('usersTableBody');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageUsers = filteredUsers.slice(start, end);
    
    if (pageUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Aucun commissionnaire trouvé</td></tr>';
    } else {
        tbody.innerHTML = pageUsers.map(user => renderUserRow(user)).join('');
    }
    
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
    document.getElementById('resultsCount').innerText = `${filteredUsers.length} commissionnaire(s)`;
    document.getElementById('pageInfo').innerText = `Page ${currentPage} / ${totalPages}`;
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    if (prevBtn) prevBtn.disabled = (currentPage === 1);
    if (nextBtn) nextBtn.disabled = (currentPage === totalPages);
}

// Générer une ligne du tableau
function renderUserRow(user) {
    const fullName = user.nom_complet || 'N/A';
    const phone = user.telephone || '-';
    const email = user.email || '-';
    const status = user.status || 'PENDING';
    const statusClass = `status-${status}`;
    const statusText = status === 'PENDING' ? 'En attente' : (status === 'ACTIVE' ? 'Actif' : 'Rejeté');
    const date = user.created_at ? new Date(user.created_at).toLocaleDateString() : '-';
    
    let actions = '';
    if (status === 'PENDING') {
        actions = `
            <button class="action-btn btn-view" onclick="viewUser(${user.id})"><i class="fas fa-eye"></i> Voir</button>
            <button class="action-btn btn-validate" onclick="approveUser(${user.id})"><i class="fas fa-check"></i> Approuver</button>
            <button class="action-btn btn-reject" onclick="rejectUser(${user.id})"><i class="fas fa-times"></i> Rejeter</button>
        `;
    } else if (status === 'ACTIVE') {
        actions = `
            <button class="action-btn btn-view" onclick="viewUser(${user.id})"><i class="fas fa-eye"></i> Voir</button>
            <button class="action-btn btn-reject" onclick="rejectUser(${user.id})"><i class="fas fa-trash"></i> Désactiver</button>
            <button class="action-btn btn-delete" onclick="deleteUser(${user.id})"><i class="fas fa-trash-alt"></i> Supprimer</button>
        `;
    } else { // REJECTED
        actions = `
            <button class="action-btn btn-view" onclick="viewUser(${user.id})"><i class="fas fa-eye"></i> Voir</button>
            <button class="action-btn btn-validate" onclick="approveUser(${user.id})"><i class="fas fa-undo"></i> Réactiver</button>
            <button class="action-btn btn-delete" onclick="deleteUser(${user.id})"><i class="fas fa-trash-alt"></i> Supprimer</button>
        `;
    }
    
    return `
        <tr>
            <td>${user.id}</td>
            <td>${escapeHtml(fullName)}</td>
            <td>${escapeHtml(phone)}</td>
            <td>${escapeHtml(email)}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${date}</td>
            <td class="actions-cell">${actions}</td>
        </tr>
    `;
}

// Échapper les caractères HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Pagination
function changePage(delta) {
    const newPage = currentPage + delta;
    const maxPage = Math.ceil(filteredUsers.length / itemsPerPage);
    if (newPage >= 1 && newPage <= maxPage) {
        currentPage = newPage;
        renderTable();
    }
}

// Actions : Approuver (ACTIVE)
async function approveUser(id) {
    if (!confirm('Valider ce commissionnaire ? Il pourra publier des biens.')) return;
    try {
        const data = await apiFetch(`${API_BASE}/commissionnaires/${id}/approve`, { method: 'PUT' });
        if (data.success) {
            showToast('Compte activé avec succès', 'success');
            loadAllUsers();  // recharge la liste
        } else {
            showToast(data.message || 'Erreur', 'error');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Actions : Rejeter (REJECTED)
async function rejectUser(id) {
    if (!confirm('Rejeter ce commissionnaire ? Il ne pourra pas publier.')) return;
    try {
        const data = await apiFetch(`${API_BASE}/commissionnaires/${id}/reject`, { method: 'PUT' });
        if (data.success) {
            showToast('Compte rejeté', 'success');
            loadAllUsers();
        } else {
            showToast(data.message || 'Erreur', 'error');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Actions : Supprimer définitivement
async function deleteUser(id) {
    if (!confirm('Supprimer définitivement ce commissionnaire ? Action irréversible.')) return;
    try {
        const data = await apiFetch(`${API_BASE}/commissionnaires/${id}`, { method: 'DELETE' });
        if (data.success) {
            showToast('Utilisateur supprimé', 'success');
            loadAllUsers();
        } else {
            showToast(data.message || 'Erreur', 'error');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Visualisation détaillée (appel à l'API dédiée)
async function viewUser(id) {
    try {
        const data = await apiFetch(`${API_BASE}/commissionnaires/${id}`);
        if (data.success) {
            const user = data.user;
            displayUserModal(user);
        } else {
            showToast(data.message || 'Erreur chargement', 'error');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function displayUserModal(user) {
    const modalBody = document.getElementById('modalBody');
    const statusText = user.status === 'PENDING' ? 'En attente' : (user.status === 'ACTIVE' ? 'Actif' : 'Rejeté');
    const statusClass = `status-${user.status}`;
    
    // Construction des champs optionnels
    const fields = [
        { label: 'ID', value: user.id },
        { label: 'Nom complet', value: user.nom_complet },
        { label: 'Sexe', value: user.sexe },
        { label: 'Date de naissance', value: user.date_naissance ? new Date(user.date_naissance).toLocaleDateString() : '-' },
        { label: 'Téléphone', value: user.telephone },
        { label: 'WhatsApp', value: user.whatsapp },
        { label: 'Email', value: user.email },
        { label: 'Adresse', value: `${user.commune || ''} ${user.quartier || ''} ${user.avenue || ''} ${user.numero_maison || ''}`.trim() || '-' },
        { label: 'Ville', value: user.ville },
        { label: 'Numéro carte d\'identité', value: user.numero_carte },
        { label: 'Spécialisation', value: user.specialisation },
        { label: 'Zone d\'activité', value: user.zone_activite },
        { label: 'Expérience (années)', value: user.experience },
        { label: 'Agence / Structure', value: user.agence },
        { label: 'Statut', value: `<span class="status-badge ${statusClass}">${statusText}</span>` },
        { label: 'Date d\'inscription', value: user.created_at ? new Date(user.created_at).toLocaleString() : '-' }
    ];
    
    let html = '<div class="info-grid">';
    fields.forEach(field => {
        if (field.value && field.value !== '-') {
            html += `
                <div class="info-item">
                    <span class="info-label">${field.label}</span>
                    <span class="info-value">${field.value}</span>
                </div>
            `;
        }
    });
    
    // Cartes d'identité (recto/verso)
    if (user.carte_recto) {
        html += `<div class="info-item"><span class="info-label">Carte recto</span><span class="info-value"><a href="${user.carte_recto}" target="_blank">Voir le document</a></span></div>`;
    }
    if (user.carte_verso) {
        html += `<div class="info-item"><span class="info-label">Carte verso</span><span class="info-value"><a href="${user.carte_verso}" target="_blank">Voir le document</a></span></div>`;
    }
    if (user.photo_profil) {
        html += `<div class="info-item full-width"><span class="info-label">Photo de profil</span><div><img src="${user.photo_profil}" alt="photo" style="max-width:150px; border-radius:8px;"></div></div>`;
    }
    html += '</div>';
    
    // Boutons d'action dans la modale
    let actionButtons = '';
    if (user.status === 'PENDING') {
        actionButtons = `
            <button class="action-btn btn-validate" onclick="approveUser(${user.id}); closeModal();">Approuver</button>
            <button class="action-btn btn-reject" onclick="rejectUser(${user.id}); closeModal();">Rejeter</button>
        `;
    } else if (user.status === 'ACTIVE') {
        actionButtons = `
            <button class="action-btn btn-reject" onclick="rejectUser(${user.id}); closeModal();">Désactiver</button>
            <button class="action-btn btn-delete" onclick="deleteUser(${user.id}); closeModal();">Supprimer</button>
        `;
    } else {
        actionButtons = `
            <button class="action-btn btn-validate" onclick="approveUser(${user.id}); closeModal();">Réactiver</button>
            <button class="action-btn btn-delete" onclick="deleteUser(${user.id}); closeModal();">Supprimer</button>
        `;
    }
    
    modalBody.innerHTML = html + `<div class="modal-actions">${actionButtons}<button class="action-btn" onclick="closeModal()">Fermer</button></div>`;
    document.getElementById('userModal').style.display = 'flex';
}

// Filtres UI
function filterByStatus(status) {
    currentStatus = status;
    // Mettre à jour la classe active dans la sidebar
    document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
    document.querySelector(`.sidebar-nav li[data-status="${status}"]`).classList.add('active');
    applyFiltersAndRender();
}

function searchUsers() {
    applyFiltersAndRender();
}

function filterByPeriod() {
    applyFiltersAndRender();
}

function loadAllData() {
    loadAllUsers();
}

// Fermeture modale
function closeModal() {
    document.getElementById('userModal').style.display = 'none';
}

// Déconnexion
function logout() {
    if (confirm('Déconnexion ?')) {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    }
}

// Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) {
        window.location.href = '/login.html';
        return;
    }
    loadAllUsers();
    
    // Écouteur sur la recherche (touche Entrée)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') searchUsers();
        });
    }
    
    // Fermer le modal en cliquant à l'extérieur
    window.onclick = function(event) {
        const modal = document.getElementById('userModal');
        if (event.target === modal) closeModal();
    };
});