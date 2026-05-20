import { Router } from 'express';
import { requireSupabase, supabase } from '../lib/supabase.js';

const router = Router();

function mapWriteup(row, lang) {
  const isAr = lang === 'ar';
  return {
    slug: row.slug,
    title: isAr ? row.title_ar : row.title_en,
    excerpt: isAr ? row.excerpt_ar : row.excerpt_en,
    category: isAr ? row.category_ar : row.category_en,
    status: row.status,
    publishedAt: row.published_at,
    externalUrl: row.external_url,
  };
}

router.get('/writeups', async (req, res) => {
  if (!requireSupabase(res)) return;

  const lang = req.query.lang === 'ar' ? 'ar' : 'en';

  const { data, error } = await supabase
    .from('writeups')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('writeups list:', error.message);
    res.status(500).json({ ok: false, error: 'Could not load writeups.' });
    return;
  }

  res.json({
    ok: true,
    writeups: (data || []).map((row) => mapWriteup(row, lang)),
  });
});

router.get('/writeups/:slug', async (req, res) => {
  if (!requireSupabase(res)) return;

  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  const slug = String(req.params.slug || '').trim();

  const { data, error } = await supabase
    .from('writeups')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    res.status(500).json({ ok: false, error: 'Could not load writeup.' });
    return;
  }

  if (!data) {
    res.status(404).json({ ok: false, error: 'Writeup not found.' });
    return;
  }

  res.json({
    ok: true,
    writeup: {
      ...mapWriteup(data, lang),
      body: lang === 'ar' ? data.body_ar : data.body_en,
    },
  });
});

export default router;
