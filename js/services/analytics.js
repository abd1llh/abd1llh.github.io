import { apiFetch } from './api.js';
import { getCurrentLanguage } from '../modules/language.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function detectOs(userAgent) {
  if (userAgent.includes('iPhone')) return 'iPhone (iOS)';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Mac OS')) return 'Macbook (macOS)';
  return 'Unknown OS';
}

function detectBrowser(userAgent) {
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  return 'Unknown Browser';
}

export async function initTracker() {
  const userAgent = navigator.userAgent;
  const os = detectOs(userAgent);
  const browser = detectBrowser(userAgent);

  try {
    if (!sessionStorage.getItem('target_recorded')) {
      await apiFetch('/visits', {
        method: 'POST',
        body: JSON.stringify({
          os,
          browser,
          locale: getCurrentLanguage(),
          path: window.location.pathname,
        }),
      });
      sessionStorage.setItem('target_recorded', 'true');
    }
  } catch (error) {
    console.warn('[analytics] visit not recorded:', error.message);
  }

  if (document.getElementById('live-visitors-table')) {
    loadActiveTargets();
  }
}

async function loadActiveTargets() {
  const tableBody = document.getElementById('live-visitors-table');
  if (!tableBody) return;

  try {
    const data = await apiFetch('/admin/visitors');
    tableBody.replaceChildren();
    (data.visitors || []).forEach((target) => {
      tableBody.appendChild(createRow(target));
    });
  } catch {
    tableBody.innerHTML = '<tr><td colspan="5">Login required or API unavailable.</td></tr>';
  }
}

function createRow(target) {
  const tr = document.createElement('tr');
  tr.className = 'table-row';

  const time = target.created_at
    ? new Date(target.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  tr.innerHTML = `
    <td>${escapeHtml(target.ip || '-')}</td>
    <td>${escapeHtml(target.os || '-')}</td>
    <td>${escapeHtml(target.browser || '-')}</td>
    <td>Since ${escapeHtml(time)}</td>
    <td><span class="status-pill">${escapeHtml(target.status || 'online')}</span></td>
  `;

  return tr;
}
