
// Configuration PRODUCTION (Render)
// Configuration PRODUCTION (Render)
const API_BASE = 'https://shopnet-immo-backend.onrender.com/api/admin/biens';

// État global
let currentView = 'pending';     // 'pending' ou 'approved'
let allBiens = [];
let filteredBiens = [];
let currentPage = 1;
const itemsPerPage = 10;

// Helper: récupérer le token JWT (stocké après login)
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

// Charger les biens selon la vue courante
async function loadBiens() {
    try {
        let url;
        if (currentView === 'pending') {
            url = `${API_BASE}/pending`;
        } else {
            url = `${API_BASE}/approved`;
        }
        const data = await apiFetch(url);
        if (data.success) {
            allBiens = (data.biens || []).map(bien => {
                let images = [];
                try {
                    if (bien.images) {
                        images = typeof bien.images === 'string' ? JSON.parse(bien.images) : bien.images;
                    }
                } catch(e) { images = []; }
                return { ...bien, images };
            });
            updateStats();
            filterBiens();
        } else {
            showToast(data.message || 'Erreur de chargement', 'error');
            allBiens = [];
            filterBiens();
        }
    } catch (err) {
        console.error(err);
        showToast(err.message || 'Erreur réseau', 'error');
        allBiens = [];
        filterBiens();
        if (err.message.includes('401') || err.message.includes('Non authentifié')) {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        }
    }
}

// Mettre à jour les compteurs
async function updateStats() {
    if (currentView === 'pending') {
        document.getElementById('statPending').innerText = allBiens.length;
        document.getElementById('pendingBadge').innerText = allBiens.length;
        try {
            const data = await apiFetch(`${API_BASE}/approved`);
            if (data.success) {
                document.getElementById('statApproved').innerText = data.count || data.biens?.length || 0;
            }
        } catch(e) {}
    } else {
        document.getElementById('statApproved').innerText = allBiens.length;
        try {
            const data = await apiFetch(`${API_BASE}/pending`);
            if (data.success) {
                document.getElementById('statPending').innerText = data.count || data.biens?.length || 0;
                document.getElementById('pendingBadge').innerText = data.count || data.biens?.length || 0;
            }
        } catch(e) {}
    }
}

// Filtrer par recherche
function filterBiens() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredBiens = allBiens.filter(bien => {
        return (bien.titre && bien.titre.toLowerCase().includes(searchTerm)) ||
               (bien.ville && bien.ville.toLowerCase().includes(searchTerm)) ||
               (bien.prix && bien.prix.toString().includes(searchTerm)) ||
               (bien.type_bien && bien.type_bien.toLowerCase().includes(searchTerm));
    });
    currentPage = 1;
    renderTable();
}

// Affichage du tableau
function renderTable() {
    const tbody = document.getElementById('biensTableBody');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageBiens = filteredBiens.slice(start, end);

    if (pageBiens.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9">Aucun bien trouvé</td</tr>';
    } else {
        tbody.innerHTML = pageBiens.map(bien => renderBienRow(bien)).join('');
    }

    const totalPages = Math.max(1, Math.ceil(filteredBiens.length / itemsPerPage));
    document.getElementById('resultsCount').innerText = `${filteredBiens.length} bien(s)`;
    document.getElementById('pageInfo').innerText = `Page ${currentPage} / ${totalPages}`;
    document.getElementById('prevPageBtn').disabled = (currentPage === 1);
    document.getElementById('nextPageBtn').disabled = (currentPage === totalPages);
}

function renderBienRow(bien) {
    const firstImage = (bien.images && bien.images.length > 0) ? bien.images[0] : '';
    const thumbnail = firstImage 
        ? `<img src="${firstImage}" class="thumbnail" alt="image" onclick="openLightbox('${firstImage}')">`
        : '<i class="fas fa-image" style="font-size: 30px; color:#cbd5e1;"></i>';
    const statusClass = bien.status === 'pending' ? 'status-pending' : 'status-approved';
    const statusText = bien.status === 'pending' ? 'En attente' : 'Approuvé';

    let actions = '';
    if (currentView === 'pending') {
        actions = `
            <button class="action-btn btn-view" onclick="viewBien(${bien.id})"><i class="fas fa-eye"></i> Voir</button>
            <button class="action-btn btn-approve" onclick="approveBien(${bien.id})"><i class="fas fa-check"></i> Approuver</button>
            <button class="action-btn btn-reject" onclick="rejectBien(${bien.id})"><i class="fas fa-trash"></i> Rejeter</button>
        `;
    } else {
        actions = `
            <button class="action-btn btn-view" onclick="viewBien(${bien.id})"><i class="fas fa-eye"></i> Voir</button>
            <button class="action-btn btn-delete" onclick="rejectBien(${bien.id})"><i class="fas fa-trash-alt"></i> Supprimer</button>
        `;
    }

    return `
        <tr>
            <td>${bien.id}</td>
            <td>${thumbnail}</td>
            <td>${escapeHtml(bien.titre || 'Sans titre')}</td>
            <td>${bien.prix} ${bien.devise || 'USD'}</td>
            <td>${escapeHtml(bien.ville || '-')}</td>
            <td>${bien.type_bien || '-'}</td>
            <td>${bien.type_offre || '-'}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td class="actions-cell">${actions}</td>
        </tr>
    `;
}

// Utilitaires
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function changePage(delta) {
    const newPage = currentPage + delta;
    const maxPage = Math.ceil(filteredBiens.length / itemsPerPage);
    if (newPage >= 1 && newPage <= maxPage) {
        currentPage = newPage;
        renderTable();
    }
}

// Actions
async function approveBien(id) {
    if (!confirm('Confirmez-vous l\'approbation de ce bien ?')) return;
    try {
        const data = await apiFetch(`${API_BASE}/approve/${id}`, { method: 'PUT' });
        if (data.success) {
            showToast('Bien approuvé avec succès', 'success');
            loadBiens();
        } else {
            showToast(data.message || 'Erreur', 'error');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function rejectBien(id) {
    if (!confirm('Voulez-vous vraiment rejeter/supprimer ce bien ? Cette action est irréversible.')) return;
    try {
        const data = await apiFetch(`${API_BASE}/reject/${id}`, { method: 'DELETE' });
        if (data.success) {
            showToast('Bien supprimé avec succès', 'success');
            loadBiens();
        } else {
            showToast(data.message || 'Erreur', 'error');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Visualisation détaillée (avec affichage de whatsapp et telephone)
function viewBien(id) {
    const bien = allBiens.find(b => b.id === id);
    if (!bien) return;
    const modalBody = document.getElementById('modalBody');
    const imagesHtml = (bien.images && bien.images.length)
        ? `<div class="images-gallery">
            ${bien.images.map(img => `<img src="${img}" alt="photo" onclick="openLightbox('${img}')">`).join('')}
           </div>`
        : '<p>Aucune image</p>';
    
    // Construction des champs de contact
    let contactHtml = '';
    if (bien.whatsapp) {
        contactHtml += `<div class="info-item"><span class="info-label"><i class="fab fa-whatsapp"></i> WhatsApp</span><span class="info-value"><a href="https://wa.me/${bien.whatsapp.replace(/[^0-9]/g, '')}" target="_blank">${escapeHtml(bien.whatsapp)}</a></span></div>`;
    }
    if (bien.telephone) {
        contactHtml += `<div class="info-item"><span class="info-label"><i class="fas fa-phone-alt"></i> Téléphone</span><span class="info-value"><a href="tel:${bien.telephone.replace(/[^0-9+]/g, '')}">${escapeHtml(bien.telephone)}</a></span></div>`;
    }
    if (!bien.whatsapp && !bien.telephone) {
        contactHtml = `<div class="info-item"><span class="info-label">Contact</span><span class="info-value">Non renseigné</span></div>`;
    }

    modalBody.innerHTML = `
        <div class="info-grid">
            <div class="info-item"><span class="info-label">ID</span><span class="info-value">${bien.id}</span></div>
            <div class="info-item"><span class="info-label">Titre</span><span class="info-value">${escapeHtml(bien.titre)}</span></div>
            <div class="info-item"><span class="info-label">Type de bien</span><span class="info-value">${bien.type_bien || '-'}</span></div>
            <div class="info-item"><span class="info-label">Offre</span><span class="info-value">${bien.type_offre || '-'}</span></div>
            <div class="info-item"><span class="info-label">Prix</span><span class="info-value">${bien.prix} ${bien.devise}</span></div>
            <div class="info-item"><span class="info-label">Localisation</span><span class="info-value">${escapeHtml(bien.ville)} / ${escapeHtml(bien.commune)} / ${escapeHtml(bien.quartier)}</span></div>
            <div class="info-item"><span class="info-label">Superficie</span><span class="info-value">${bien.superficie || '-'}</span></div>
            <div class="info-item"><span class="info-label">Chambres</span><span class="info-value">${bien.chambres || 0}</span></div>
            <div class="info-item"><span class="info-label">Salles de bain</span><span class="info-value">${bien.salles_bain || 0}</span></div>
            <div class="info-item"><span class="info-label">Accessibilité</span><span class="info-value">${escapeHtml(bien.accessibilite) || '-'}</span></div>
            <div class="info-item"><span class="info-label">Titre foncier</span><span class="info-value">${bien.type_titre || '-'} ${bien.numero_document ? '(N° '+bien.numero_document+')' : ''}</span></div>
            <div class="info-item"><span class="info-label">Référence</span><span class="info-value">${escapeHtml(bien.reference) || '-'}</span></div>
            ${contactHtml}
            <div class="info-item"><span class="info-label">Description</span><span class="info-value">${escapeHtml(bien.description) || '-'}</span></div>
            <div class="info-item full-width" style="grid-column: 1/-1;"><span class="info-label">Photos</span><div>${imagesHtml}</div></div>
        </div>
    `;
    document.getElementById('bienModal').style.display = 'flex';
}

// Lightbox : ouverture en grand
function openLightbox(imageUrl) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    lightboxImg.src = imageUrl;
    lightbox.style.display = 'flex';
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
}

function closeModal() {
    document.getElementById('bienModal').style.display = 'none';
}

// Changer de vue
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
    document.querySelector(`.sidebar-nav li[data-view="${view}"]`).classList.add('active');
    document.getElementById('pageTitle').innerText = (view === 'pending') ? 'Biens en attente' : 'Biens approuvés';
    loadBiens();
}

function loadCurrentView() {
    loadBiens();
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
    loadBiens();
    document.getElementById('searchInput').addEventListener('input', filterBiens);

    // Fermer la lightbox
    const lightbox = document.getElementById('lightbox');
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
            closeLightbox();
        }
    });

    // Fermer le modal de détails en cliquant à l'extérieur
    window.onclick = function(event) {
        const modal = document.getElementById('bienModal');
        if (event.target === modal) closeModal();
    };
});