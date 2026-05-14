import { initMenu }     from '../modules/menu.js';
import { initLanguage } from '../modules/language.js';
import { initTerminal } from '../modules/terminal.js';
import { initReveal }   from '../modules/reveal.js';

/* ══════════════════════════════════════════════════════════
   VIEWPORT SYNC
   Uses visualViewport API for accurate height on mobile
   (keyboard-safe: no layout jump when keyboard opens)
   ══════════════════════════════════════════════════════════ */
function syncViewport() {
  const vv = window.visualViewport;
  // Use svh (small viewport height) as base — never larger than visible area
  const h = vv ? Math.round(vv.height) : window.innerHeight;
  document.documentElement.style.setProperty('--app-height', `${h}px`);
  document.documentElement.style.setProperty('--safe-top',   `${Math.round(vv?.offsetTop ?? 0)}px`);
}

// Terminal keyboard-lift: move terminal up when keyboard opens
function syncTerminalForKeyboard() {
  const terminal = document.getElementById('terminal');
  if (!terminal || !terminal.classList.contains('is-open')) return;
  const vv = window.visualViewport;
  if (!vv) return;
  const keyboardHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  terminal.style.bottom = keyboardHeight > 0 ? `${keyboardHeight + 8}px` : '';
}

function setupViewport() {
  syncViewport();
  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', () => {
      syncViewport();
      syncTerminalForKeyboard();
    });
    vv.addEventListener('scroll', syncViewport);
  }
  window.addEventListener('resize', syncViewport);
  window.addEventListener('orientationchange', () => {
    setTimeout(syncViewport, 150); // Give layout time to settle
  });
}

/* ══════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════ */
function initTheme() {
  const saved = localStorage.getItem('site_theme') || 'dark';
  applyTheme(saved);

  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('site_theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent  = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

/* ══════════════════════════════════════════════════════════
   NAVBAR HIDE ON SCROLL DOWN / SHOW ON SCROLL UP
   ══════════════════════════════════════════════════════════ */
function initNavScroll() {
  const nav = document.querySelector('nav');
  if (!nav) return;

  let lastY = window.scrollY;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastY;

        if (currentY < 60) {
          // Always show near the top
          nav.classList.remove('nav--hidden');
        } else if (delta > 4) {
          // Scrolling down — hide
          nav.classList.add('nav--hidden');
        } else if (delta < -4) {
          // Scrolling up — show
          nav.classList.remove('nav--hidden');
        }

        lastY = currentY;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ══════════════════════════════════════════════════════════
   ACTIVE NAV HIGHLIGHT
   Scroll-spy: highlights nav section as user scrolls
   ══════════════════════════════════════════════════════════ */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id], main[id]');
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');
        // Update active state on nav links (menu overlay)
        document.querySelectorAll('.nav-link').forEach(link => {
          const href = link.getAttribute('href');
          link.classList.toggle('nav-link--active', href === `#${id}`);
        });
      });
    },
    { threshold: 0.3 }
  );
  sections.forEach(s => observer.observe(s));
}

/* ══════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  setupViewport();
  initTheme();
  initNavScroll();
  initMenu();
  initTerminal();
  initReveal();
  await initLanguage();

  document.body.classList.add('loaded');
  initScrollSpy();

  console.log(
    '%c[System Online] %cv2.1 ready.',
    'color: #00d95f; font-weight: bold; font-family: monospace;',
    'color: #888; font-family: monospace;'
  );
});
