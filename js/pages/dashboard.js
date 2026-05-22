/**
 * dashboard.js — Full admin dashboard logic
 * Auth, navigation, CRUD for writeups/projects, image upload, messages, visitors
 */

import { apiFetch } from '../services/api.js';

/* ═══════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════ */
function esc(v) {
    return String(v ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

function fmtDate(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
}

function fmtTime(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleString('en-GB'); }
    catch { return d; }
}

/* ── Toast notifications ── */
function toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.3s ease';
        setTimeout(() => el.remove(), 300);
    }, 3500);
}

/* ── Modal helpers ── */
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function setLoading(btnId, textId, loading, label = 'Save') {
    const btn = document.getElementById(btnId);
    const txt = document.getElementById(textId);
    if (!btn || !txt) return;
    btn.disabled = loading;
    txt.textContent = loading ? 'Saving…' : label;
}

/* ═══════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════ */
async function checkSession() {
    try {
        const data = await apiFetch('/admin/me');
        return data.authenticated;
    } catch { return false; }
}

async function login(email, password) {
    await apiFetch('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

async function logout() {
    try { await apiFetch('/admin/logout', { method: 'POST' }); } catch {}
}

/* ═══════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════ */
const PAGE_TITLES = {
    overview: 'Overview',
    messages: 'Contact Messages',
    writeups: 'Writeups',
    projects: 'Projects',
    visitors: 'Visitor Log',
};

let currentPage = 'overview';

function switchPage(name) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item[data-page]').forEach(i => i.classList.remove('active'));

    const page = document.getElementById(`page-${name}`);
    const navItem = document.querySelector(`.nav-item[data-page="${name}"]`);
    if (page) page.classList.add('active');
    if (navItem) navItem.classList.add('active');

    const title = document.getElementById('topbar-title');
    if (title) title.textContent = PAGE_TITLES[name] || name;

    currentPage = name;

    // Lazy-load page data
    if (name === 'messages')  loadMessages();
    if (name === 'writeups')  loadWriteups();
    if (name === 'projects')  loadProjects();
    if (name === 'visitors')  loadVisitors();

    // Close mobile sidebar
    closeMobileSidebar();
}

/* Make switchPage accessible from inline onclick */
window.switchPage = switchPage;

/* ═══════════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════════ */
async function loadStats() {
    try {
        const { stats } = await apiFetch('/admin/stats');
        document.getElementById('st-visits').textContent   = stats.totalVisits ?? 0;
        document.getElementById('st-24h').textContent      = stats.visitsLast24h ?? 0;
        document.getElementById('st-contacts').textContent = stats.totalContacts ?? 0;
        document.getElementById('st-writeups').textContent = stats.totalWriteups ?? 0;
        document.getElementById('st-projects').textContent = stats.totalProjects ?? 0;

        // Badge on messages nav item
        const count = stats.totalContacts ?? 0;
        const badge = document.getElementById('badge-messages');
        if (badge && count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        }
    } catch (err) {
        console.error('Stats error:', err);
    }
}

/* ═══════════════════════════════════════════════════
   MESSAGES
═══════════════════════════════════════════════════ */
async function loadMessages(preview = false) {
    const listId = preview ? 'overview-messages' : 'messages-list';
    const list = document.getElementById(listId);
    if (!list) return;

    list.innerHTML = '<div class="empty-state"><div class="icon">⏳</div>Loading…</div>';

    try {
        const { contacts } = await apiFetch('/admin/contacts');
        const items = preview ? contacts.slice(0, 5) : contacts;

        if (!items.length) {
            list.innerHTML = '<div class="empty-state"><div class="icon">📭</div>No messages yet.</div>';
            return;
        }

        list.innerHTML = items.map(m => `
            <div class="msg-card">
                <div class="msg-head">
                    <div>
                        <div class="msg-sender">${esc(m.name)}</div>
                        <div class="msg-email">
                            <a href="mailto:${esc(m.email)}" style="color:var(--green);">${esc(m.email)}</a>
                        </div>
                    </div>
                    <div class="msg-time">${fmtTime(m.created_at)}</div>
                </div>
                <div class="msg-body">${esc(m.message)}</div>
            </div>
        `).join('');

    } catch (err) {
        list.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div>Failed to load: ${esc(err.message)}</div>`;
    }
}

/* ═══════════════════════════════════════════════════
   WRITEUPS CRUD
═══════════════════════════════════════════════════ */
let writeupsData = [];

async function loadWriteups() {
    const tbody = document.getElementById('writeups-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Loading…</td></tr>';

    try {
        const { writeups } = await apiFetch('/admin/writeups');
        writeupsData = writeups || [];

        if (!writeupsData.length) {
            tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="icon">📭</div>No writeups yet.</div></td></tr>';
            return;
        }

        tbody.innerHTML = writeupsData.map(w => `
            <tr>
                <td>
                    <div style="font-weight:600;color:var(--text);">${esc(w.title_en)}</div>
                    <div style="font-size:11px;color:var(--text-3);font-family:var(--mono);margin-top:3px;">${esc(w.slug)}</div>
                </td>
                <td><span class="pill pill--blue">${esc(w.category_en)}</span></td>
                <td><span class="pill ${w.status === 'published' ? 'pill--green' : 'pill--amber'}">${esc(w.status)}</span></td>
                <td class="time-cell">${fmtDate(w.published_at)}</td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-outline btn-sm" onclick="editWriteup('${esc(w.id)}')">Edit</button>
                        <button class="btn btn-red btn-sm" onclick="deleteWriteup('${esc(w.id)}', '${esc(w.title_en)}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">⚠️ ${esc(err.message)}</td></tr>`;
    }
}

function openWriteupModal(data = null) {
    const isEdit = Boolean(data);
    document.getElementById('writeup-modal-title').textContent = isEdit ? 'Edit Writeup' : 'New Writeup';
    document.getElementById('writeup-save-text').textContent = isEdit ? 'Update Writeup' : 'Save Writeup';

    // Reset form
    document.getElementById('writeup-form').reset();
    document.getElementById('wf-id').value = data?.id || '';
    document.getElementById('wf-slug').value = data?.slug || '';
    document.getElementById('wf-status').value = data?.status || 'draft';
    document.getElementById('wf-title-en').value = data?.title_en || '';
    document.getElementById('wf-title-ar').value = data?.title_ar || '';
    document.getElementById('wf-cat-en').value = data?.category_en || '';
    document.getElementById('wf-cat-ar').value = data?.category_ar || '';
    document.getElementById('wf-excerpt-en').value = data?.excerpt_en || '';
    document.getElementById('wf-excerpt-ar').value = data?.excerpt_ar || '';
    document.getElementById('wf-body-en').value = data?.body_en || '';
    document.getElementById('wf-body-ar').value = data?.body_ar || '';
    document.getElementById('wf-image-url').value = data?.image_url || '';
    document.getElementById('wf-external-url').value = data?.external_url || '';

    openModal('writeup-modal');
}

async function editWriteup(id) {
    try {
        const { writeup } = await apiFetch(`/admin/writeups/${id}`);
        openWriteupModal(writeup);
    } catch (err) {
        toast(`Failed to load writeup: ${err.message}`, 'error');
    }
}

async function deleteWriteup(id, title) {
    if (!confirm(`Delete writeup "${title}"?\n\nThis cannot be undone.`)) return;
    try {
        await apiFetch(`/admin/writeups/${id}`, { method: 'DELETE' });
        toast('Writeup deleted.', 'success');
        loadWriteups();
    } catch (err) {
        toast(`Delete failed: ${err.message}`, 'error');
    }
}

async function saveWriteup() {
    const id = document.getElementById('wf-id').value;
    const isEdit = Boolean(id);

    const payload = {
        slug:        document.getElementById('wf-slug').value.trim(),
        title_en:    document.getElementById('wf-title-en').value.trim(),
        title_ar:    document.getElementById('wf-title-ar').value.trim(),
        category_en: document.getElementById('wf-cat-en').value.trim(),
        category_ar: document.getElementById('wf-cat-ar').value.trim(),
        excerpt_en:  document.getElementById('wf-excerpt-en').value.trim(),
        excerpt_ar:  document.getElementById('wf-excerpt-ar').value.trim(),
        body_en:     document.getElementById('wf-body-en').value.trim() || null,
        body_ar:     document.getElementById('wf-body-ar').value.trim() || null,
        status:      document.getElementById('wf-status').value,
        image_url:   document.getElementById('wf-image-url').value.trim() || null,
        external_url: document.getElementById('wf-external-url').value.trim() || null,
    };

    if (!payload.slug || !payload.title_en || !payload.title_ar ||
        !payload.excerpt_en || !payload.excerpt_ar ||
        !payload.category_en || !payload.category_ar) {
        toast('Please fill all required fields.', 'error');
        return;
    }

    setLoading('writeup-modal-save', 'writeup-save-text', true);
    try {
        if (isEdit) {
            await apiFetch(`/admin/writeups/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            toast('Writeup updated ✓', 'success');
        } else {
            await apiFetch('/admin/writeups', { method: 'POST', body: JSON.stringify(payload) });
            toast('Writeup created ✓', 'success');
        }
        closeModal('writeup-modal');
        loadWriteups();
        loadStats();
    } catch (err) {
        toast(`Save failed: ${err.message}`, 'error');
    } finally {
        setLoading('writeup-modal-save', 'writeup-save-text', false, isEdit ? 'Update Writeup' : 'Save Writeup');
    }
}

/* Make edit/delete available from inline onclick */
window.editWriteup = editWriteup;
window.deleteWriteup = deleteWriteup;

/* ═══════════════════════════════════════════════════
   PROJECTS CRUD
═══════════════════════════════════════════════════ */
let uploadedImageUrl = null;

async function loadProjects() {
    const tbody = document.getElementById('projects-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Loading…</td></tr>';

    try {
        const { projects } = await apiFetch('/admin/projects');

        if (!projects.length) {
            tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="icon">📭</div>No projects yet.</div></td></tr>';
            return;
        }

        tbody.innerHTML = projects.map(p => `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                        ${p.image_url ? `<img src="${esc(p.image_url)}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;border:1px solid var(--border);" alt="">` : '<div style="width:40px;height:40px;border-radius:6px;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:18px;">🗂</div>'}
                        <div>
                            <div style="font-weight:600;color:var(--text);">${esc(p.title)}</div>
                            <div style="font-size:11px;color:var(--text-3);margin-top:2px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.description)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display:flex;flex-wrap:wrap;gap:4px;">
                        ${(p.tech_stack || []).map(t => `<span class="pill pill--blue">${esc(t)}</span>`).join('')}
                    </div>
                </td>
                <td><span class="pill ${p.status === 'published' ? 'pill--green' : 'pill--amber'}">${esc(p.status)}</span></td>
                <td><span class="pill pill--blue">#${p.sort_order}</span></td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-outline btn-sm" onclick="editProject('${esc(p.id)}')">Edit</button>
                        <button class="btn btn-red btn-sm" onclick="deleteProject('${esc(p.id)}', '${esc(p.title)}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">⚠️ ${esc(err.message)}</td></tr>`;
    }
}

function openProjectModal(data = null) {
    const isEdit = Boolean(data);
    document.getElementById('project-modal-title').textContent = isEdit ? 'Edit Project' : 'New Project';
    document.getElementById('project-save-text').textContent = isEdit ? 'Update Project' : 'Save Project';

    document.getElementById('project-form').reset();
    document.getElementById('pf-id').value = data?.id || '';
    document.getElementById('pf-title').value = data?.title || '';
    document.getElementById('pf-desc').value = data?.description || '';
    document.getElementById('pf-tech').value = (data?.tech_stack || []).join(', ');
    document.getElementById('pf-status').value = data?.status || 'published';
    document.getElementById('pf-live').value = data?.live_link || '';
    document.getElementById('pf-github').value = data?.github_link || '';
    document.getElementById('pf-order').value = data?.sort_order || 0;
    document.getElementById('pf-image-url').value = data?.image_url || '';

    // Reset upload area
    uploadedImageUrl = data?.image_url || null;
    const preview = document.getElementById('upload-preview');
    const placeholder = document.getElementById('upload-placeholder');
    if (data?.image_url) {
        preview.src = data.image_url;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
    } else {
        preview.style.display = 'none';
        placeholder.style.display = 'block';
    }
    document.getElementById('upload-status').textContent = '';
    document.getElementById('upload-status').className = 'upload-status';

    openModal('project-modal');
}

async function editProject(id) {
    try {
        const { projects } = await apiFetch('/admin/projects');
        const project = projects?.find(p => p.id === id);
        if (!project) throw new Error('Project not found');
        openProjectModal(project);
    } catch (err) {
        toast(`Failed to load project: ${err.message}`, 'error');
    }
}

async function deleteProject(id, title) {
    if (!confirm(`Delete project "${title}"?\n\nThis cannot be undone.`)) return;
    try {
        await apiFetch(`/admin/projects/${id}`, { method: 'DELETE' });
        toast('Project deleted.', 'success');
        loadProjects();
        loadStats();
    } catch (err) {
        toast(`Delete failed: ${err.message}`, 'error');
    }
}

async function saveProject() {
    const id = document.getElementById('pf-id').value;
    const isEdit = Boolean(id);

    const techRaw = document.getElementById('pf-tech').value.trim();
    const tech_stack = techRaw ? techRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    // Use uploaded URL first, then manual URL field
    const image_url = uploadedImageUrl || document.getElementById('pf-image-url').value.trim() || null;

    const payload = {
        title:       document.getElementById('pf-title').value.trim(),
        description: document.getElementById('pf-desc').value.trim(),
        tech_stack,
        status:      document.getElementById('pf-status').value,
        live_link:   document.getElementById('pf-live').value.trim() || null,
        github_link: document.getElementById('pf-github').value.trim() || null,
        sort_order:  Number(document.getElementById('pf-order').value) || 0,
        image_url,
    };

    if (!payload.title || !payload.description) {
        toast('Title and description are required.', 'error');
        return;
    }

    setLoading('project-modal-save', 'project-save-text', true);
    try {
        if (isEdit) {
            await apiFetch(`/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            toast('Project updated ✓', 'success');
        } else {
            await apiFetch('/admin/projects', { method: 'POST', body: JSON.stringify(payload) });
            toast('Project created ✓', 'success');
        }
        closeModal('project-modal');
        loadProjects();
        loadStats();
    } catch (err) {
        toast(`Save failed: ${err.message}`, 'error');
    } finally {
        setLoading('project-modal-save', 'project-save-text', false, isEdit ? 'Update Project' : 'Save Project');
    }
}

window.editProject = editProject;
window.deleteProject = deleteProject;

/* ═══════════════════════════════════════════════════
   IMAGE UPLOAD
═══════════════════════════════════════════════════ */
function initUpload() {
    const area = document.getElementById('upload-area');
    const fileInput = document.getElementById('pf-image-file');
    const preview = document.getElementById('upload-preview');
    const placeholder = document.getElementById('upload-placeholder');
    const status = document.getElementById('upload-status');

    if (!area) return;

    area.addEventListener('click', () => fileInput.click());

    area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('drag-over'); });
    area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) handleUpload(fileInput.files[0]);
    });

    async function handleUpload(file) {
        const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!ALLOWED.includes(file.type)) {
            status.textContent = '⚠ Only JPG, PNG, WebP, GIF allowed';
            status.className = 'upload-status error';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            status.textContent = '⚠ File too large (max 5MB)';
            status.className = 'upload-status error';
            return;
        }

        // Show preview immediately from FileReader
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);

        status.textContent = 'Uploading…';
        status.className = 'upload-status uploading';

        try {
            // Convert to base64 for upload
            const base64 = await fileToBase64(file);
            const { url } = await apiFetch('/admin/upload', {
                method: 'POST',
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    data: base64,
                }),
            });

            uploadedImageUrl = url;
            document.getElementById('pf-image-url').value = url;
            status.textContent = '✓ Uploaded successfully';
            status.className = 'upload-status done';

        } catch (err) {
            status.textContent = `⚠ Upload failed: ${err.message}`;
            status.className = 'upload-status error';
            uploadedImageUrl = null;
        }
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Strip data URL prefix: "data:image/jpeg;base64,..."
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

/* ═══════════════════════════════════════════════════
   VISITORS
═══════════════════════════════════════════════════ */
async function loadVisitors() {
    const tbody = document.getElementById('visitors-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading…</td></tr>';

    try {
        const { visitors } = await apiFetch('/admin/visitors');

        if (!visitors.length) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="icon">👁</div>No visitors yet.</div></td></tr>';
            return;
        }

        tbody.innerHTML = visitors.map(v => `
            <tr>
                <td class="ip-cell">${esc(v.ip || '—')}</td>
                <td style="color:var(--text-2);font-size:13px;">${esc(v.os || '—')}</td>
                <td style="color:var(--text-2);font-size:13px;">${esc(v.browser || '—')}</td>
                <td class="path-cell">${esc(v.page_path || '/')}</td>
                <td><span class="pill pill--blue">${esc(v.locale || 'en')}</span></td>
                <td class="time-cell">${fmtTime(v.created_at)}</td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">⚠️ ${esc(err.message)}</td></tr>`;
    }
}

/* ═══════════════════════════════════════════════════
   MOBILE SIDEBAR
═══════════════════════════════════════════════════ */
function initMobileSidebar() {
    const btn = document.getElementById('mobile-menu-btn');
    const overlay = document.getElementById('mobile-overlay');
    const sidebar = document.getElementById('sidebar');

    btn?.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
    });
    overlay?.addEventListener('click', closeMobileSidebar);
}

function closeMobileSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('mobile-overlay')?.classList.remove('open');
}

/* ═══════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════ */
export async function initDashboard() {
    const gate    = document.getElementById('auth-gate');
    const app     = document.getElementById('app');
    const emailEl = document.getElementById('auth-email');
    const passEl  = document.getElementById('auth-password');
    const authBtn = document.getElementById('auth-btn');
    const errEl   = document.getElementById('auth-error');

    function showApp() {
        gate.style.display = 'none';
        app.style.display  = 'block';
        loadStats();
        loadMessages(true); // overview preview
        initMobileSidebar();
        initUpload();
    }

    function showGate() {
        gate.style.display = 'flex';
        app.style.display  = 'none';
    }

    // Check existing session
    if (await checkSession()) {
        showApp();
    } else {
        showGate();
    }

    // Login
    authBtn?.addEventListener('click', async () => {
        errEl.style.display = 'none';
        const email    = emailEl?.value?.trim() || '';
        const password = passEl?.value || '';

        if (!email || !password) {
            errEl.textContent = '⚠ Email and password are required.';
            errEl.style.display = 'block';
            return;
        }

        authBtn.disabled = true;
        document.getElementById('auth-btn-text').textContent = 'Authenticating…';

        try {
            await login(email, password);
            showApp();
        } catch {
            errEl.textContent = '⚠ Access Denied — invalid credentials.';
            errEl.style.display = 'block';
        } finally {
            authBtn.disabled = false;
            document.getElementById('auth-btn-text').textContent = 'Authenticate';
        }
    });

    passEl?.addEventListener('keydown', e => { if (e.key === 'Enter') authBtn?.click(); });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        await logout();
        showGate();
        passEl && (passEl.value = '');
        emailEl && (emailEl.value = '');
    });

    // Nav
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', () => switchPage(item.dataset.page));
    });

    // Refresh buttons
    document.getElementById('refresh-messages')?.addEventListener('click', () => loadMessages());
    document.getElementById('refresh-visitors')?.addEventListener('click', () => loadVisitors());

    // Writeup modal
    document.getElementById('btn-new-writeup')?.addEventListener('click', () => openWriteupModal());
    document.getElementById('writeup-modal-save')?.addEventListener('click', saveWriteup);
    document.getElementById('writeup-modal-close')?.addEventListener('click', () => closeModal('writeup-modal'));
    document.getElementById('writeup-modal-cancel')?.addEventListener('click', () => closeModal('writeup-modal'));
    document.getElementById('writeup-modal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal('writeup-modal');
    });

    // Project modal
    document.getElementById('btn-new-project')?.addEventListener('click', () => openProjectModal());
    document.getElementById('project-modal-save')?.addEventListener('click', saveProject);
    document.getElementById('project-modal-close')?.addEventListener('click', () => closeModal('project-modal'));
    document.getElementById('project-modal-cancel')?.addEventListener('click', () => closeModal('project-modal'));
    document.getElementById('project-modal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal('project-modal');
    });
}

// Auto-init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => initDashboard());