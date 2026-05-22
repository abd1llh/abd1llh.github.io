import { Router } from 'express';
import { requireSupabase, supabase } from '../lib/supabase.js';
import { sendContactNotification } from '../lib/email.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/contact', async (req, res) => {
  if (!requireSupabase(res)) return;

  const name    = String(req.body?.name    || '').trim().slice(0, 120);
  const email   = String(req.body?.email   || '').trim().slice(0, 200);
  const message = String(req.body?.message || '').trim().slice(0, 5000);
  const locale  = req.body?.locale === 'ar' ? 'ar' : 'en';

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

  // Respond immediately — fire email notification asynchronously
  // so slow email delivery never delays the visitor's response
  res.status(201).json({ ok: true, message: 'Message received.' });

  // Non-blocking email notification
  sendContactNotification({ name, email, message, locale }).catch(err => {
    console.error('[contact] email notification failed:', err.message);
  });
});

export default router;

