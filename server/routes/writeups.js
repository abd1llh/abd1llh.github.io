import { Router } from 'express';
import { requireSupabase, supabase } from '../lib/supabase.js';

const router = Router();

/* ═══════════════════════════════════
   GET /api/writeups
   Public — returns published writeups (list view)
   Query: ?lang=en|ar&limit=20&status=published|draft
   Auth-gated: if no admin session, only published
═══════════════════════════════════ */
router.get('/writeups', async (req, res) => {
    if (!requireSupabase(res)) return;

    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const lang = req.query.lang === 'ar' ? 'ar' : 'en';

    const { data, error } = await supabase
        .from('writeups')
        .select(
            `id, slug, title_${lang}, excerpt_${lang}, category_${lang},
             status, image_url, external_url, published_at, created_at`
        )
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        res.status(500).json({ ok: false, error: 'Could not load writeups.' });
        return;
    }

    // Normalize field names to lang-agnostic keys
    const writeups = (data || []).map(row => ({
        id: row.id,
        slug: row.slug,
        title: row[`title_${lang}`],
        excerpt: row[`excerpt_${lang}`],
        category: row[`category_${lang}`],
        status: row.status,
        image_url: row.image_url,
        external_url: row.external_url,
        published_at: row.published_at,
        created_at: row.created_at,
    }));

    res.json({ ok: true, writeups });
});

/* ═══════════════════════════════════
   GET /api/writeups/:slug
   Public — single writeup full content
   Returns both EN and AR body for client to pick
═══════════════════════════════════ */
router.get('/writeups/:slug', async (req, res) => {
    if (!requireSupabase(res)) return;

    const slug = String(req.params.slug || '').trim();
    if (!slug) {
        res.status(400).json({ ok: false, error: 'Slug is required.' });
        return;
    }

    const { data, error } = await supabase
        .from('writeups')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (error || !data) {
        res.status(404).json({ ok: false, error: 'Writeup not found.' });
        return;
    }

    res.json({ ok: true, writeup: data });
});

export default router;
