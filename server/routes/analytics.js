import { Router } from 'express';
import { requireSupabase, supabase } from '../lib/supabase.js';

const router = Router();

router.post('/visits', async (req, res) => {
  if (!requireSupabase(res)) return;

  const os = String(req.body?.os || 'Unknown').slice(0, 80);
  const browser = String(req.body?.browser || 'Unknown').slice(0, 80);
  const locale = req.body?.locale === 'ar' ? 'ar' : 'en';
  const path = String(req.body?.path || '/').slice(0, 300);

  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.socket?.remoteAddress || 'unknown';

  const { error } = await supabase.from('live_targets').insert([{
    ip: ip.slice(0, 45),
    os,
    browser,
    status: 'online',
    locale,
    page_path: path,
  }]);

  if (error) {
    console.error('visit insert:', error.message);
    res.status(500).json({ ok: false, error: 'Could not record visit.' });
    return;
  }

  res.status(201).json({ ok: true });
});

export default router;
