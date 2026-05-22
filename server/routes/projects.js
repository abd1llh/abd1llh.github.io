import { Router } from 'express';
import { requireSupabase, supabase } from '../lib/supabase.js';

const router = Router();

/* ═══════════════════════════════════
   GET /api/projects
   Public — returns published projects ordered by sort_order
═══════════════════════════════════ */
router.get('/projects', async (req, res) => {
    if (!requireSupabase(res)) return;

    const { data, error } = await supabase
        .from('projects')
        .select('id, title, description, image_url, tech_stack, live_link, github_link, sort_order, created_at')
        .eq('status', 'published')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) {
        res.status(500).json({ ok: false, error: 'Could not load projects.' });
        return;
    }

    res.json({ ok: true, projects: data || [] });
});

export default router;
