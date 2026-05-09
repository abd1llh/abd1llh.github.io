export function initMenu() {
  const hamburger = document.querySelector('.hamburger');
  const links = document.querySelectorAll('.nav-link');
  const overlay = document.getElementById('menu');

  if (!hamburger || !overlay) return;

  hamburger.addEventListener('click', toggleMenu);
  links.forEach((link) => link.addEventListener('click', closeMenu));

  // Close on Escape
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('open')) {
      closeMenu();
      hamburger.focus();
    }
  });

  // Close when clicking outside the nav overlay links
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeMenu();
  });
}

function toggleMenu() {
  const overlay = document.getElementById('menu');
  const hamburger = document.querySelector('.hamburger');
  const isOpen = overlay?.classList.toggle('open');
  hamburger?.classList.toggle('open');
  
  // Update aria attributes
  if (hamburger) hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  if (overlay) overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  
  // Prevent body scroll when menu open
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeMenu() {
  const overlay = document.getElementById('menu');
  const hamburger = document.querySelector('.hamburger');
  overlay?.classList.remove('open');
  hamburger?.classList.remove('open');
  if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
  if (overlay) overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
