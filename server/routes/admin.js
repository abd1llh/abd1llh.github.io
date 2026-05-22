import { Router } from 'express';
import {
    checkAdminCredentials,
    clearAdminCookie,
    requireAdmin,
    setAdminCookie,
    signAdminToken,
    verifyAdminToken,
} from '../lib/auth.js';
import { requireSupabase, supabase } from '../lib/supabase.js';

const router = Router();

/* ═══════════════════════════════════════════════════════
   AUTH ROUTES
═══════════════════════════════════════════════════════ */

router.post('/admin/login', (req, res) => {
    const { email, password } = req.body || {};

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        res.status(503).json({ ok: false, error: 'Admin login not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env' });
        return;
    }

    if (!checkAdminCredentials(String(email || ''), String(password || ''))) {
        res.status(401).json({ ok: false, error: 'Invalid credentials.' });
        return;
    }

    const token = signAdminToken();
    setAdminCookie(res, token);
    res.json({ ok: true });
});


router.post('/admin/logout', requireAdmin, (_req, res) => {
    clearAdminCookie(res);
    res.json({ ok: true });
});

router.get('/admin/me', (req, res) => {
    const token = req.cookies?.abd1llh_admin;
    res.json({ ok: true, authenticated: Boolean(token && verifyAdminToken(token)) });
});

/* ═══════════════════════════════════════════════════════
   STATS + VISITORS + CONTACTS
═══════════════════════════════════════════════════════ */

router.get('/admin/stats', requireAdmin, async (req, res) => {
    if (!requireSupabase(res)) return;

    const [visits, contacts, writeups, projects] = await Promise.all([
        supabase.from('live_targets').select('id', { count: 'exact', head: true }),
        supabase.from('contacts').select('id', { count: 'exact', head: true }),
        supabase.from('writeups').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
    ]);

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: visits24h } = await supabase
        .from('live_targets')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', dayAgo);

    res.json({
        ok: true,
        stats: {
            totalVisits: visits.count ?? 0,
            visitsLast24h: visits24h ?? 0,
            totalContacts: contacts.count ?? 0,
            totalWriteups: writeups.count ?? 0,
            totalProjects: projects.count ?? 0,
        },
    });
});

router.get('/admin/visitors', requireAdmin, async (req, res) => {
    if (!requireSupabase(res)) return;

    const { data, error } = await supabase
        .from('live_targets')
        .select('id, ip, os, browser, status, locale, page_path, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        res.status(500).json({ ok: false, error: 'Could not load visitors.' });
        return;
    }
    res.json({ ok: true, visitors: data || [] });
});

router.get('/admin/contacts', requireAdmin, async (req, res) => {
    if (!requireSupabase(res)) return;

    const { data, error } = await supabase
        .from('contacts')
        .select('id, name, email, message, locale, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        res.status(500).json({ ok: false, error: 'Could not load contacts.' });
        return;
    }
    res.json({ ok: true, contacts: data || [] });
});

/* ═══════════════════════════════════════════════════════
   WRITEUPS CRUD
═══════════════════════════════════════════════════════ */

// List all writeups (admin sees draft + published)
router.get('/admin/writeups', requireAdmin, async (req, res) => {
    if (!requireSupabase(res)) return;

    const { data, error } = await supabase
        .from('writeups')
        .select('id, slug, title_en, title_ar, category_en, category_ar, status, published_at, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        res.status(500).json({ ok: false, error: 'Could not load writeups.' });
        return;
    }
    res.json({ ok: true, writeups: data || [] });
});

// Get single writeup for editing
router.get('/admin/writeups/:id', requireAdmin, async (req, res) => {
    if (!requireSupabase(res)) return;

    const { data, error } = await supabase
        .from('writeups')
        .select('*')
        .eq('id', req.params.id)
        .single();

    if (error || !data) {
        res.status(404).json({ ok: false, error: 'Writeup not found.' });
        return;
    }
    res.json({ ok: true, writeup: data });
});

// Create new writeup
router.post('/admin/writeups', requireAdmin, async (req, res) => {
    if (!requireSupabase(res)) return;

    const {
        slug, title_en, title_ar, excerpt_en, excerpt_ar,
        body_en, body_ar, category_en, category_ar,
        status, image_url, external_url
    } = req.body || {};

    if (!slug || !title_en || !title_ar || !excerpt_en || !excerpt_ar || !category_en || !category_ar) {
        res.status(400).json({ ok: false, error: 'Required fields: slug, titles, excerpts, categories.' });
        return;
    }

    const published_at = status === 'published' ? new Date().toISOString() : null;

    const { data, error } = await supabase
        .from('writeups')
        .insert([{
            slug: String(slug).trim().toLowerCase(),
            title_en: String(title_en).trim(),
            title_ar: String(title_ar).trim(),
            excerpt_en: String(excerpt_en).trim(),
            excerpt_ar: String(excerpt_ar).trim(),
            body_en: body_en || null,
            body_ar: body_ar || null,
            category_en: String(category_en).trim(),
            category_ar: String(category_ar).trim(),
            status: status === 'published' ? 'published' : 'draft',
            image_url: image_url || null,
            external_url: external_url || null,
            published_at,
        }])
        .select()
        .single();

    if (error) {
        res.status(500).json({ ok: false, error: error.message || 'Could not create writeup.' });
        return;
    }
    res.status(201).json({ ok: true, writeup: data });
});

// Update writeup
router.put('/admin/writeups/:id', requireAdmin, async (req, res) => {
    if (!requireSupabase(res)) return;

    const updates = {};
    const fields = [
        'slug', 'title_en', 'title_ar', 'excerpt_en', 'excerpt_ar',
        'body_en', 'body_ar', 'category_en', 'category_ar',
        'status', 'image_url', 'external_url'
    ];
    fields.forEach(f => {
        if (req.body?.[f] !== undefined) updates[f] = req.body[f];
    });

    // Auto-set published_at when publishing for the first time
    if (updates.status === 'published') {
        const { data: existing } = await supabase
            .from('writeups').select('published_at').eq('id', req.params.id).single();
        if (!existing?.published_at) {
            updates.published_at = new Date().toISOString();
        }
    }

    const { data, error } = await supabase
        .from('writeups')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error || !data) {
        res.status(500).json({ ok: false, error: error?.message || 'Could not update writeup.' });
        return;
    }
    res.json({ ok: true, writeup: data });
});

// Delete writeup
router.delete('/admin/writeups/:id', requireAdmin, async (req, res) => {
    if (!requireSupabase(res)) return;

    const { error } = await supabase.from('writeups').delete().eq('id', req.params.id);

    if (error) {
        res.status(500).json({ ok: false, error: 'Could not delete writeup.' });
        return;
    }
    res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════
   PROJECTS CRUD
═══════════════════════════════════════════════════════ */

// List all projects
router.get('/admin/projects', requireAdmin, async (req, res) => {
    if (!requireSupabase(res)) return;

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) {
        res.status(500).json({ ok: false, error: 'Could not load projects.' });
        return;
    }
    res.json({ ok: true, projects: data || [] });
});

// Create project
router.post('/admin/projects', requireAdmin, async (req, res) => {
    if (!requireSupabase(res)) return;

    const { title, description, image_url, tech_stack, live_link, github_link, status, sort_order } = req.body || {};

    if (!title || !description) {
        res.status(400).json({ ok: false, error: 'Title and description are required.' });
        return;
    }

    const { data, error } = await supabase
        .from('projects')
        .insert([{
            title: String(title).trim(),
            description: String(description).trim(),
            image_url: image_url || null,
            tech_stack: Array.isArray(tech_stack) ? tech_stack : [],
            live_link: live_link || null,
            github_link: github_link || null,
            status: status === 'draft' ? 'draft' : 'published',
            sort_order: Number(sort_order) || 0,
        }])
        .select()
        .single();

    if (error) {
        res.status(500).json({ ok: false, error: error.message || 'Could not create project.' });
        return;
    }
    res.status(201).json({ ok: true, project: data });
});

// Update project
router.put('/admin/projects/:id', requireAdmin, async (req, res) => {
    if (!requireSupabase(res)) return;

    const fields = ['title', 'description', 'image_url', 'tech_stack', 'live_link', 'github_link', 'status', 'sort_order'];
    const updates = {};
    fields.forEach(f => {
        if (req.body?.[f] !== undefined) updates[f] = req.body[f];
    });

    const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error || !data) {
        res.status(500).json({ ok: false, error: error?.message || 'Could not update project.' });
        return;
    }
    res.json({ ok: true, project: data });
});

// Delete project
router.delete('/admin/projects/:id', requireAdmin, async (req, res) => {
    if (!requireSupabase(res)) return;

    const { error } = await supabase.from('projects').delete().eq('id', req.params.id);

    if (error) {
        res.status(500).json({ ok: false, error: 'Could not delete project.' });
        return;
    }
    res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════
   FILE UPLOAD — Supabase Storage
═══════════════════════════════════════════════════════ */

router.post('/admin/upload', requireAdmin, async (req, res) => {
    if (!requireSupabase(res)) return;

    // We use express's raw body parsing — client sends multipart/form-data
    // For simplicity we handle base64 upload: { filename, contentType, data (base64) }
    const { filename, contentType, data: base64Data } = req.body || {};

    if (!filename || !contentType || !base64Data) {
        res.status(400).json({ ok: false, error: 'filename, contentType, and data (base64) are required.' });
        return;
    }

    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!ALLOWED_TYPES.includes(contentType)) {
        res.status(400).json({ ok: false, error: 'Only image uploads are allowed.' });
        return;
    }

    // Decode base64
    let buffer;
    try {
        buffer = Buffer.from(base64Data, 'base64');
    } catch {
        res.status(400).json({ ok: false, error: 'Invalid base64 data.' });
        return;
    }

    if (buffer.length > 5 * 1024 * 1024) {
        res.status(400).json({ ok: false, error: 'File too large. Max 5MB.' });
        return;
    }

    // Sanitize filename and add timestamp to avoid collisions
    const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `uploads/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
        .from('portfolio-assets')
        .upload(path, buffer, {
            contentType,
            upsert: false,
        });

    if (uploadError) {
        res.status(500).json({ ok: false, error: uploadError.message || 'Upload failed.' });
        return;
    }

    const { data: urlData } = supabase.storage
        .from('portfolio-assets')
        .getPublicUrl(path);

    res.json({ ok: true, url: urlData.publicUrl, path });
});

export default router;
