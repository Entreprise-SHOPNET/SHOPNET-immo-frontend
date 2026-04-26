

document.addEventListener('DOMContentLoaded', () => {
  // Références des étapes
  const step1Form = document.getElementById('step1Form');
  const step2Form = document.getElementById('step2Form');
  const step3Form = document.getElementById('step3Form');
  const nextStep1 = document.getElementById('nextStep1');
  const nextStep2 = document.getElementById('nextStep2');
  const prevStep2 = document.getElementById('prevStep2');
  const prevStep3 = document.getElementById('prevStep3');
  const submitBtn = document.getElementById('submitBtn');
  const steps = document.querySelectorAll('.step');
  const messageBox = document.getElementById('messageBox');

  // Récupération des champs
  // Étape 1
  const nomInput = document.getElementById('nom_complet');
  const sexeSelect = document.getElementById('sexe');
  const dateInput = document.getElementById('date_naissance');
  const numeroCarteInput = document.getElementById('numero_carte');
  // Étape 2
  const telephoneInput = document.getElementById('telephone');
  const whatsappInput = document.getElementById('whatsapp');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const agenceInput = document.getElementById('agence');
  const villeInput = document.getElementById('ville');
  const communeInput = document.getElementById('commune');
  const quartierInput = document.getElementById('quartier');
  const avenueInput = document.getElementById('avenue');
  const numeroMaisonInput = document.getElementById('numero_maison');
  // Étape 3
  const specialisationInput = document.getElementById('specialisation');
  const zoneActiviteInput = document.getElementById('zone_activite');
  const experienceInput = document.getElementById('experience');
  // Fichiers
  const rectoInput = document.getElementById('carte_recto');
  const versoInput = document.getElementById('carte_verso');
  const photoInput = document.getElementById('photo_profil');

  // Helper affichage erreur
  function showError(fieldId, message) {
    const errDiv = document.getElementById(`error_${fieldId}`);
    if (errDiv) {
      errDiv.textContent = message;
      errDiv.style.display = 'block';
    }
  }
  function hideError(fieldId) {
    const errDiv = document.getElementById(`error_${fieldId}`);
    if (errDiv) {
      errDiv.style.display = 'none';
      errDiv.textContent = '';
    }
  }
  function clearStep1Errors() {
    ['nom', 'sexe', 'date', 'numero_carte'].forEach(hideError);
  }
  function clearStep2Errors() {
    ['telephone', 'email', 'password', 'ville', 'commune', 'quartier', 'avenue', 'numero_maison', 'whatsapp'].forEach(hideError);
  }
  function clearStep3Errors() {
    ['specialisation', 'zone_activite', 'experience', 'recto', 'verso'].forEach(hideError);
  }

  // Validation étape 1
  function validateStep1() {
    clearStep1Errors();
    let isValid = true;
    const nom = nomInput.value.trim();
    if (!nom) { showError('nom', 'Nom complet obligatoire'); isValid = false; }

    const sexe = sexeSelect.value;
    if (!sexe) { showError('sexe', 'Sélectionnez votre sexe'); isValid = false; }

    const dateNaiss = dateInput.value;
    if (!dateNaiss) { showError('date', 'Date de naissance obligatoire'); isValid = false; }
    else {
      const birth = new Date(dateNaiss);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      if (age < 18) { showError('date', 'Vous devez avoir au moins 18 ans'); isValid = false; }
    }

    const numCarte = numeroCarteInput.value.trim();
    if (!numCarte) { showError('numero_carte', 'Numéro de carte d\'électeur obligatoire'); isValid = false; }

    return isValid;
  }

  // Validation étape 2 (téléphone sans restriction de format)
  function validateStep2() {
    clearStep2Errors();
    let isValid = true;

    // Téléphone : seulement vérifier qu'il n'est pas vide
    const tel = telephoneInput.value.trim();
    if (!tel) {
      showError('telephone', 'Téléphone obligatoire');
      isValid = false;
    }
    // Plus aucune validation de format

    // WhatsApp optionnel : aucune validation de format
    const wa = whatsappInput.value.trim();
    // (aucune erreur même si rempli, on laisse passer)

    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!email) { showError('email', 'Email obligatoire'); isValid = false; }
    else if (!emailRegex.test(email)) { showError('email', 'Email invalide'); isValid = false; }

    const pwd = passwordInput.value;
    if (!pwd) { showError('password', 'Mot de passe obligatoire'); isValid = false; }
    else if (pwd.length < 6) { showError('password', 'Minimum 6 caractères'); isValid = false; }

    const ville = villeInput.value.trim();
    if (!ville) { showError('ville', 'Ville obligatoire'); isValid = false; }

    const commune = communeInput.value.trim();
    if (!commune) { showError('commune', 'Commune obligatoire'); isValid = false; }

    const quartier = quartierInput.value.trim();
    if (!quartier) { showError('quartier', 'Quartier obligatoire'); isValid = false; }

    const avenue = avenueInput.value.trim();
    if (!avenue) { showError('avenue', 'Avenue obligatoire'); isValid = false; }

    const numMaison = numeroMaisonInput.value.trim();
    if (!numMaison) { showError('numero_maison', 'Numéro maison obligatoire'); isValid = false; }

    return isValid;
  }

  // Validation étape 3 (inchangée)
  function validateStep3() {
    clearStep3Errors();
    let isValid = true;

    const spec = specialisationInput.value.trim();
    if (!spec) { showError('specialisation', 'Spécialisation obligatoire'); isValid = false; }

    const zone = zoneActiviteInput.value.trim();
    if (!zone) { showError('zone_activite', 'Zone d\'activité obligatoire'); isValid = false; }

    const exp = experienceInput.value.trim();
    if (exp === '') { showError('experience', 'Expérience requise'); isValid = false; }
    else if (isNaN(parseInt(exp))) { showError('experience', 'Valeur numérique'); isValid = false; }

    // Fichiers recto/verso obligatoires
    if (!rectoInput.files.length) { showError('recto', 'Recto de la carte électeur obligatoire'); isValid = false; }
    else {
      const file = rectoInput.files[0];
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) { showError('recto', 'Fichier > 5 Mo'); isValid = false; }
      const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowed.includes(file.type)) { showError('recto', 'Format JPEG/PNG uniquement'); isValid = false; }
    }

    if (!versoInput.files.length) { showError('verso', 'Verso de la carte électeur obligatoire'); isValid = false; }
    else {
      const file = versoInput.files[0];
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) { showError('verso', 'Fichier > 5 Mo'); isValid = false; }
      const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowed.includes(file.type)) { showError('verso', 'Format JPEG/PNG uniquement'); isValid = false; }
    }

    // Photo optionnelle
    if (photoInput.files.length) {
      const file = photoInput.files[0];
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) { showError('photo', 'Photo > 5 Mo'); isValid = false; }
      const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowed.includes(file.type)) { showError('photo', 'Format JPEG/PNG uniquement'); isValid = false; }
    }

    return isValid;
  }

  // Navigation
  nextStep1.addEventListener('click', () => {
    if (validateStep1()) {
      step1Form.style.display = 'none';
      step2Form.style.display = 'block';
      steps[0].classList.remove('active');
      steps[1].classList.add('active');
      messageBox.style.display = 'none';
    } else {
      const firstError = document.querySelector('#step1Form .error-message[style*="display: block"]');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  nextStep2.addEventListener('click', () => {
    if (validateStep2()) {
      step2Form.style.display = 'none';
      step3Form.style.display = 'block';
      steps[1].classList.remove('active');
      steps[2].classList.add('active');
      messageBox.style.display = 'none';
    } else {
      const firstError = document.querySelector('#step2Form .error-message[style*="display: block"]');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  prevStep2.addEventListener('click', () => {
    step2Form.style.display = 'none';
    step1Form.style.display = 'block';
    steps[1].classList.remove('active');
    steps[0].classList.add('active');
    messageBox.style.display = 'none';
  });

  prevStep3.addEventListener('click', () => {
    step3Form.style.display = 'none';
    step2Form.style.display = 'block';
    steps[2].classList.remove('active');
    steps[1].classList.add('active');
    messageBox.style.display = 'none';
  });

  // Gestion des zones de dépôt de fichiers
  document.querySelectorAll('.file-zone').forEach(zone => {
    const input = zone.querySelector('input[type="file"]');
    const preview = zone.parentElement.querySelector('.file-preview');
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.style.borderColor = '#7fbbd3';
      zone.style.background = 'rgba(0,0,0,0.7)';
    });
    zone.addEventListener('dragleave', () => {
      zone.style.borderColor = 'rgba(255,255,255,0.3)';
      zone.style.background = 'rgba(0,0,0,0.5)';
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.style.borderColor = 'rgba(255,255,255,0.3)';
      zone.style.background = 'rgba(0,0,0,0.5)';
      if (e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        if (preview) preview.innerHTML = `📎 ${input.files[0].name} (${(input.files[0].size / 1024).toFixed(1)} Ko)`;
      }
    });
    input.addEventListener('change', () => {
      if (input.files.length && preview) {
        preview.innerHTML = `📎 ${input.files[0].name} (${(input.files[0].size / 1024).toFixed(1)} Ko)`;
      } else if (preview) preview.innerHTML = '';
    });
  });

  // Soumission finale
  step3Form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep3()) {
      const firstError = document.querySelector('#step3Form .error-message[style*="display: block"]');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const formData = new FormData();
    // Étape 1
    formData.append('nom_complet', nomInput.value.trim());
    formData.append('sexe', sexeSelect.value);
    formData.append('date_naissance', dateInput.value);
    formData.append('numero_carte', numeroCarteInput.value.trim());
    // Étape 2
    formData.append('telephone', telephoneInput.value.trim());
    if (whatsappInput.value.trim()) formData.append('whatsapp', whatsappInput.value.trim());
    formData.append('email', emailInput.value.trim());
    formData.append('password', passwordInput.value);
    if (agenceInput.value.trim()) formData.append('agence', agenceInput.value.trim());
    formData.append('ville', villeInput.value.trim());
    formData.append('commune', communeInput.value.trim());
    formData.append('quartier', quartierInput.value.trim());
    formData.append('avenue', avenueInput.value.trim());
    formData.append('numero_maison', numeroMaisonInput.value.trim());
    // Étape 3
    formData.append('specialisation', specialisationInput.value.trim());
    formData.append('zone_activite', zoneActiviteInput.value.trim());
    formData.append('experience', experienceInput.value.trim());
    // Fichiers
    formData.append('carte_recto', rectoInput.files[0]);
    formData.append('carte_verso', versoInput.files[0]);
    if (photoInput.files.length) formData.append('photo_profil', photoInput.files[0]);

    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours...';

    try {
      const response = await fetch('https://shopnet-immo-backend.onrender.com/api/commissionnaires/register', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        showMessage('✅ Votre compte a été créé avec succès.<br>Il est en attente de validation par l’administration.', 'success');
        // Réinitialiser
        step1Form.reset();
        step2Form.reset();
        step3Form.reset();
        document.querySelectorAll('.file-preview').forEach(el => el.innerHTML = '');
        step3Form.style.display = 'none';
        step1Form.style.display = 'block';
        steps[2].classList.remove('active');
        steps[0].classList.add('active');
        steps[1].classList.remove('active');
        clearStep1Errors(); clearStep2Errors(); clearStep3Errors();
      } else {
        let errorMsg = data.message || 'Erreur lors de l’inscription.';
        if (errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('numéro')) {
          showMessage(errorMsg, 'error');
          step1Form.style.display = 'none';
          step2Form.style.display = 'block';
          step3Form.style.display = 'none';
          steps[0].classList.remove('active');
          steps[1].classList.add('active');
          steps[2].classList.remove('active');
        } else if (errorMsg.toLowerCase().includes('carte')) {
          showMessage(errorMsg, 'error');
          step1Form.style.display = 'none';
          step2Form.style.display = 'none';
          step3Form.style.display = 'block';
          steps[0].classList.remove('active');
          steps[1].classList.remove('active');
          steps[2].classList.add('active');
        } else {
          showMessage(errorMsg, 'error');
        }
      }
    } catch (err) {
      console.error(err);
      showMessage('Erreur de connexion au serveur. Vérifiez votre réseau.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '✅ Créer mon compte';
    }
  });

  function showMessage(msg, type) {
    messageBox.innerHTML = msg;
    messageBox.className = `message-box ${type}`;
    messageBox.style.display = 'block';
    messageBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});