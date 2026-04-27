

document.addEventListener('DOMContentLoaded', () => {
  // Animation douce à l'apparition pour les cartes
  const fadeElements = document.querySelectorAll('.role-card, .stat-item, .gallery-text, .gallery-images img');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

  fadeElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

  // Animation des chiffres dans la section stats (si besoin d'animations dynamiques)
  const statNumbers = document.querySelectorAll('.stat-number');
  const numberObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const raw = el.innerText;
        const numeric = parseInt(raw.replace(/[^0-9]/g, ''));
        if (isNaN(numeric)) return;
        let current = 0;
        const step = Math.ceil(numeric / 60);
        const update = () => {
          current += step;
          if (current >= numeric) {
            el.innerText = raw;
            return;
          }
          el.innerText = current + (raw.includes('+') ? '+' : '');
          requestAnimationFrame(update);
        };
        update();
        numberObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  
  statNumbers.forEach(num => numberObserver.observe(num));

  // Petite interac supplémentaire sur les boutons de rôle (optionnel)
  const roleBtns = document.querySelectorAll('.btn-role, .btn-role-small');
  roleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // juste un effet visuel, sans bloquer la navigation
      btn.style.transform = 'scale(0.97)';
      setTimeout(() => { btn.style.transform = ''; }, 120);
    });
  });

  // Message console amical (facultatif)
  console.log('🏠 SHOPNET IMMO - Portail central prêt');
});