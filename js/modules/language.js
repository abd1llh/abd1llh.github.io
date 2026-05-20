const PATH_LANG_RE = /^\/(en|ar)(\/|$)/;
const SITE_ORIGIN = 'https://abd1llh.online';

let currentLanguage = 'en';
let translationsCache = {};

export function getLangFromPath(pathname = window.location.pathname) {
  const match = pathname.match(PATH_LANG_RE);
  return match ? match[1] : null;
}

export function getLocalePath(pathname = window.location.pathname) {
  const stripped = pathname.replace(PATH_LANG_RE, '/');
  return stripped === '' ? '/' : stripped;
}

export function buildLocaleUrl(lang, path = getLocalePath(), hash = window.location.hash) {
  const safeLang = lang === 'ar' ? 'ar' : 'en';
  const cleanPath = path === '/' ? '' : path;
  return `/${safeLang}${cleanPath}${hash}`;
}

function getTranslationUrl(lang) {
  return `/lang/${lang}.json`;
}

function setRootLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.dataset.lang = lang;
}

function updateSeoUrls(lang) {
  const localePath = getLocalePath();
  const canonicalPath = localePath === '/' ? `/${lang}/` : `/${lang}${localePath}`;
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`;

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;

  document.querySelectorAll('link[data-hreflang]').forEach((link) => {
    const locale = link.getAttribute('data-hreflang');
    if (locale === 'x-default') {
      link.href = `${SITE_ORIGIN}/en/`;
      return;
    }
    link.href = `${SITE_ORIGIN}/${locale}${localePath === '/' ? '/' : localePath}`;
  });

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', canonicalUrl);
}

function syncLocaleLinks(lang) {
  document.querySelectorAll('[data-locale-href]').forEach((element) => {
    const path = element.getAttribute('data-locale-href') || '/';
    const normalized = path.startsWith('/') ? path : `/${path}`;
    element.setAttribute('href', buildLocaleUrl(lang, normalized));
  });
}

function applyTranslationMap(translations) {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    const value = translations[key];
    if (typeof value === 'string') {
      element.innerHTML = value;
    }
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
    const attr = element.getAttribute('data-i18n-attr');
    const key = element.getAttribute('data-i18n');
    const value = translations[key];
    if (attr && typeof value === 'string') {
      element.setAttribute(attr, value);
    }
  });

  const title = translations.site_title;
  if (title) document.title = title;

  const description = translations.site_description;
  if (description) {
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
  }

  const langBtn = document.getElementById('lang-switch');
  if (langBtn && translations.lang_btn) {
    langBtn.textContent = translations.lang_btn;
    langBtn.setAttribute('aria-label', translations.lang_btn);
  }

  const menuBottom = document.querySelector('.menu-bottom');
  if (menuBottom && translations.menu_system_active) {
    const suffix = menuBottom.dataset.baseCopy || '© 2026 abd1llh';
    menuBottom.innerHTML = `<span style="color: var(--green); font-weight: bold;">>_</span> ${translations.menu_system_active}<br><br>${suffix}`;
  }

  const termHintText = document.querySelector('#term-hint .text');
  if (termHintText && translations.terminal_help_hint) {
    termHintText.textContent = translations.terminal_help_hint;
  }

  const termInput = document.getElementById('term-input');
  if (termInput && translations.terminal_placeholder) {
    termInput.placeholder = translations.terminal_placeholder;
  }
}

export async function loadLanguage(lang) {
  const safeLang = lang === 'ar' ? 'ar' : 'en';
  const translations = translationsCache[safeLang] || await fetch(getTranslationUrl(safeLang)).then((res) => {
    if (!res.ok) throw new Error(`Failed to load ${safeLang}`);
    return res.json();
  });

  translationsCache[safeLang] = translations;
  currentLanguage = safeLang;
  localStorage.setItem('site_lang', safeLang);
  setRootLanguage(safeLang);
  applyTranslationMap(translations);
  syncLocaleLinks(safeLang);
  updateSeoUrls(safeLang);

  window.dispatchEvent(new CustomEvent('languagechange', {
    detail: { lang: safeLang, translations }
  }));

  return translations;
}

export async function initLanguage() {
  const pathLang = getLangFromPath();

  if (!pathLang) {
    const saved = localStorage.getItem('site_lang') === 'ar' ? 'ar' : 'en';
    window.location.replace(buildLocaleUrl(saved, window.location.pathname || '/'));
    return;
  }

  await loadLanguage(pathLang);

  const langBtn = document.getElementById('lang-switch');
  if (!langBtn) return;

  langBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const next = currentLanguage === 'en' ? 'ar' : 'en';
    window.location.href = buildLocaleUrl(next);
  });
}

export function getCurrentLanguage() {
  return currentLanguage === 'ar' ? 'ar' : 'en';
}

export function t(key, fallback = '') {
  return translationsCache[getCurrentLanguage()]?.[key] ?? fallback;
}
