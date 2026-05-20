import { apiFetch } from '../services/api.js';
import { getCurrentLanguage, t } from './language.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(iso, lang) {
  if (!iso) return t('writeup2_status', 'Draft');
  return new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

function renderCard(writeup) {
  const isDraft = writeup.status === 'draft';
  const article = document.createElement('article');
  article.className = isDraft ? 'writeup-card draft' : 'writeup-card';

  const meta = document.createElement('div');
  meta.className = 'writeup-meta';

  const dateSpan = document.createElement('span');
  dateSpan.textContent = formatDate(writeup.publishedAt, getCurrentLanguage());

  const catSpan = document.createElement('span');
  catSpan.className = isDraft ? 'cat cat--amber' : 'cat';
  catSpan.textContent = writeup.category;

  meta.append(dateSpan, catSpan);

  const title = document.createElement('h3');
  title.textContent = writeup.title;

  const excerpt = document.createElement('p');
  excerpt.textContent = writeup.excerpt;

  const link = document.createElement('a');
  link.className = 'read-more';
  link.href = writeup.externalUrl || '#';
  link.textContent = isDraft
    ? t('writeup2_link', '[ Coming Soon ]')
    : t('writeup1_link', 'Read Full Report →');

  article.append(meta, title, excerpt, link);
  return article;
}

export async function loadWriteupsPage() {
  const container = document.getElementById('writeups-list');
  if (!container) return;

  const lang = getCurrentLanguage();

  try {
    const data = await apiFetch(`/writeups?lang=${lang}`);
    container.replaceChildren();

    if (!data.writeups?.length) {
      const empty = document.createElement('p');
      empty.className = 'writeups-empty';
      empty.textContent = t('writeups_empty', 'No writeups published yet.');
      container.appendChild(empty);
      return;
    }

    data.writeups.forEach((writeup) => {
      container.appendChild(renderCard(writeup));
    });
  } catch (error) {
    console.warn('[writeups] API unavailable, keeping static HTML:', error.message);
  }
}
