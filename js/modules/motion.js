/**
 * Motion Module — GSAP + Lenis enhancements (progressive enhancement).
 *
 * Adds, on top of the existing CSS reveal system:
 *  - Lenis smooth scrolling (integrated with ScrollTrigger)
 *  - SplitText word-by-word entrance for the hero title
 *    (words, not chars — char-splitting would break Arabic letter joining)
 *  - An animated hero background (drifting glow orbs + grid, parallax on scroll)
 *
 * Safety: if the CDN libraries failed to load, or the user prefers
 * reduced motion, this module does nothing and the site keeps its
 * existing reveal.js behaviour untouched.
 */

const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initMotion() {
  const gsap = window.gsap;
  if (prefersReducedMotion || !gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(window.ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);

  initSmoothScroll(gsap);
  initHeroTitle(gsap);
  initHeroBackground(gsap);
}

/* ─── Lenis smooth scroll ─── */
function initSmoothScroll(gsap) {
  if (!window.Lenis) return;

  const lenis = new window.Lenis({
    lerp: 0.1,
    anchors: true, // smooth-scroll in-page #links through Lenis
  });

  lenis.on('scroll', window.ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ─── Hero title: SplitText by words ─── */
function initHeroTitle(gsap) {
  const h1 = document.getElementById('hero-heading');
  if (!h1 || !window.SplitText) return;

  // The heading also carries .reveal — settle the container instantly so
  // only the words move (no double animation with the CSS transition).
  h1.style.transition = 'none';
  h1.classList.add('is-visible');

  const animateWords = (duration) => {
    const split = new window.SplitText(h1, {
      type: 'words',
      wordsClass: 'hero-word',
    });
    gsap.from(split.words, {
      yPercent: 70,
      opacity: 0,
      duration,
      ease: 'power3.out',
      stagger: 0.07,
      delay: 0.1,
      clearProps: 'transform,opacity',
    });
  };

  animateWords(0.9);

  // Language switch replaces the heading's innerHTML (wiping the split
  // spans) — re-split the new text and replay a shorter entrance.
  window.addEventListener('languagechange', () => {
    requestAnimationFrame(() => animateWords(0.6));
  });
}

/* ─── Hero background: glow orbs + grid with scroll parallax ─── */
function initHeroBackground(gsap) {
  const hero = document.querySelector('.hero');
  if (!hero || hero.querySelector('.hero-bg')) return;

  const bg = document.createElement('div');
  bg.className = 'hero-bg';
  bg.setAttribute('aria-hidden', 'true');
  bg.innerHTML =
    '<div class="hero-grid"></div>' +
    '<div class="hero-orb hero-orb--a"></div>' +
    '<div class="hero-orb hero-orb--b"></div>';
  hero.prepend(bg);

  // Slow, calm drift for the two glow orbs
  const driftA = gsap.to('.hero-orb--a', {
    x: 60, y: 40, duration: 11,
    ease: 'sine.inOut', repeat: -1, yoyo: true,
  });
  const driftB = gsap.to('.hero-orb--b', {
    x: -50, y: -35, duration: 14,
    ease: 'sine.inOut', repeat: -1, yoyo: true,
  });

  // Parallax: background drifts slower than the page while scrolling away,
  // and the drift pauses whenever the hero is off-screen.
  gsap.to(bg, {
    yPercent: 14,
    ease: 'none',
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onToggle: (self) => {
        driftA.paused(!self.isActive);
        driftB.paused(!self.isActive);
      },
    },
  });
}
