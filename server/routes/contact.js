import { Router } from 'express';
import { requireSupabase, supabase } from '../lib/supabase.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/contact', async (req, res) => {
  if (!requireSupabase(res)) return;

  const name = String(req.body?.name || '').trim().slice(0, 120);
  const email = String(req.body?.email || '').trim().slice(0, 200);
  const message = String(req.body?.message || '').trim().slice(0, 5000);
  const locale = req.body?.locale === 'ar' ? 'ar' : 'en';

  if (!name || !email || !message) {
    res.status(400).json({ ok: false, error: 'Name, email, and message are required.' });
    return;
  }

  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ ok: false, error: 'Invalid email address.' });
    return;
  }

  const { error } = await supabase.from('contacts').insert([{
    name,
    email,
    message,
    locale,
    ip_hash: null,
    user_agent: String(req.headers['user-agent'] || '').slice(0, 500),
  }]);

  if (error) {
    console.error('contact insert:', error.message);
    res.status(500).json({ ok: false, error: 'Could not save message.' });
    return;
  }

  res.status(201).json({ ok: true, message: 'Message received.' });
});

export default router;
