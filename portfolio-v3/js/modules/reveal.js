/**
 * Reveal Module
 * Uses IntersectionObserver to trigger entrance animations
 * as sections scroll into view. Respects prefers-reduced-motion.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Observe elements with class .reveal or .reveal-stagger
 * Adds .is-visible when they enter the viewport.
 */
export function initReveal() {
  if (prefersReducedMotion) {
    // Skip observer — just show everything immediately
    document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
      el.classList.add('is-visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Unobserve after triggering — one-shot animation
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,      // Trigger when 12% of element is visible
      rootMargin: '0px 0px -40px 0px'  // Slightly below viewport bottom
    }
  );

  document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
    observer.observe(el);
  });
}
