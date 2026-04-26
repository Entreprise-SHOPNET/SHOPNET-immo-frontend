document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.card, .trust-content, .trust-image, .cta-inner');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

  cards.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

  const statNumbers = document.querySelectorAll('.trust-stats span');
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        statNumbers.forEach(span => {
          const final = span.innerText;
          if (final.includes('%') || final.includes('/')) return;
          let current = 0;
          const target = parseInt(final);
          if (isNaN(target)) return;
          const step = Math.ceil(target / 50);
          const update = () => {
            current += step;
            if (current >= target) {
              span.innerText = final;
              return;
            }
            span.innerText = current;
            requestAnimationFrame(update);
          };
          update();
        });
        statObserver.disconnect();
      }
    });
  }, { threshold: 0.5 });
  const statsContainer = document.querySelector('.trust-stats');
  if (statsContainer) statObserver.observe(statsContainer);
});