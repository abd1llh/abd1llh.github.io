let currentLanguage = localStorage.getItem('site_lang') || 'en';
let translationsCache = {};

function getTranslationUrl(lang) {
  return new URL(`../../lang/${lang}.json`, import.meta.url);
}

function setRootLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.dataset.lang = lang;
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
    menuBottom.innerHTML = `<span style="color: #00ff64; font-weight: bold;">>_</span> ${translations.menu_system_active}<br><br>${suffix}`;
  }

  const termHintText = document.querySelector('#term-hint .text');
  if (termHintText && translations.terminal_help_hint) {
    termHintText.textContent = translations.terminal_help_hint;
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

  window.dispatchEvent(new CustomEvent('languagechange', {
    detail: { lang: safeLang, translations }
  }));

  return translations;
}

export async function initLanguage() {
  const langBtn = document.getElementById('lang-switch');
  if (!langBtn) return;

  await loadLanguage(currentLanguage);

  langBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const next = currentLanguage === 'en' ? 'ar' : 'en';
    await loadLanguage(next);

    const menu = document.getElementById('menu');
    const hamburger = document.querySelector('.hamburger');
    if (menu && hamburger) {
      menu.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });
}

export function getCurrentLanguage() {
  return currentLanguage === 'ar' ? 'ar' : 'en';
}

export function t(key, fallback = '') {
  return translationsCache[getCurrentLanguage()]?.[key] ?? fallback;
}
