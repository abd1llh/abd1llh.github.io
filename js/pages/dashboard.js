import {
    apiFetch
} from '../services/api.js';

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function show(el, visible) {
    if (el) el.style.display = visible ? '' : 'none';
}

async function checkSession() {
    const data = await apiFetch('/admin/me');
    return data.authenticated;
}

async function login(password) {
    await apiFetch('/admin/login', {
        method: 'POST',
        body: JSON.stringify({
            password
        }),
    });
}

async function logout() {
    await apiFetch('/admin/logout', {
        method: 'POST'
    });
}

function renderStats(stats) {
    document.getElementById('stat-visits').textContent = stats.totalVisits;
    document.getElementById('stat-visits-24h').textContent = stats.visitsLast24h;
    document.getElementById('stat-contacts').textContent = stats.totalContacts;
    document.getElementById('stat-writeups').textContent = stats.totalWriteups;
}

function renderVisitors(visitors) {
    const tbody = document.getElementById('live-visitors-table');
    if (!tbody) return;
    tbody.replaceChildren();

    if (!visitors.length) {
        tbody.innerHTML = '<tr><td colspan="5">No visitors yet.</td></tr>';
        return;
    }

    visitors.forEach((row) => {
        const tr = document.createElement('tr');
        tr.className = 'table-row';
        const time = row.created_at ?
            new Date(row.created_at).toLocaleString() :
            '--';

        tr.innerHTML = `
      <td>${escapeHtml(row.ip || '-')}</td>
      <td>${escapeHtml(row.os || '-')}</td>
      <td>${escapeHtml(row.browser || '-')}</td>
      <td>${escapeHtml(row.locale || 'en')} · ${escapeHtml(row.page_path || '/')}</td>
      <td>${escapeHtml(time)}</td>
    `;
        tbody.appendChild(tr);
    });
}

function renderContacts(contacts) {
    const list = document.getElementById('contacts-list');
    if (!list) return;
    list.replaceChildren();

    if (!contacts.length) {
        list.innerHTML = '<p class="log-action">No messages yet.</p>';
        return;
    }

    contacts.forEach((msg) => {
        const item = document.createElement('div');
        item.className = 'log-item';
        const time = msg.created_at ? new Date(msg.created_at).toLocaleString() : '';
        item.innerHTML = `
      <span class="log-time">[ ${escapeHtml(time)} ]</span>
      <span class="log-action"><strong>${escapeHtml(msg.name)}</strong> &lt;${escapeHtml(msg.email)}&gt;<br>${escapeHtml(msg.message)}</span>
    `;
        list.appendChild(item);
    });
}

async function loadDashboard() {
    const results = await Promise.allSettled([
        apiFetch('/admin/stats'),
        apiFetch('/admin/visitors'),
        apiFetch('/admin/contacts'),
    ]);

    const [stats, visitors, contacts] = results;

    if (stats.status === 'fulfilled') {
        renderStats(stats.value.stats);
    } else {
        console.error('Stats error:', stats.reason);
    }

    if (visitors.status === 'fulfilled') {
        renderVisitors(visitors.value.visitors || []);
    } else {
        console.error('Visitors error:', visitors.reason);
    }

    if (contacts.status === 'fulfilled') {
        renderContacts(contacts.value.contacts || []);
    } else {
        console.error('Contacts error:', contacts.reason);
    }
}

export async function initDashboard() {
    const gate = document.getElementById('auth-gate');
    const content = document.getElementById('dashboard-content');
    const errorMsg = document.getElementById('auth-error');
    const passInput = document.getElementById('passcode');
    const authBtn = document.getElementById('auth-btn');
    const logoutBtn = document.getElementById('logout-btn');

    async function showDashboard() {
        show(gate, false);
        show(content, true);

        try {
            await loadDashboard();
        } catch (err) {
            console.error('Dashboard load error:', err);

            content.innerHTML = `
          <div style="
            color:#fff;
            padding:40px;
            font-family:monospace;
          ">
            <h2 style="color:#ff4444;">Dashboard Error</h2>
            <p>Failed to load dashboard data.</p>
            <pre style="margin-top:20px;color:#00ff64;">
  ${escapeHtml(err?.message || 'Unknown error')}
            </pre>
          </div>
        `;
        }
    }

    async function showLogin() {
        show(gate, true);
        show(content, false);
    }

    try {
        if (await checkSession()) {
            await showDashboard();
        } else {
            await showLogin();
        }
    } catch {
        await showLogin();
    }

    authBtn ?.addEventListener('click', async() => {
        if (errorMsg) errorMsg.style.display = 'none';

        try {
            await login(passInput ?.value || '');
            await showDashboard();
        } catch {
            if (errorMsg) errorMsg.style.display = 'block';
        }
    });

    passInput ?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            authBtn ?.click();
        }
    });

    logoutBtn ?.addEventListener('click', async() => {
        try {
            await logout();
        } catch {
            /* ignore */
        }

        await showLogin();

        if (passInput) {
            passInput.value = '';
        }
    })
}