import { Router } from 'express';
import {
  checkAdminPassword,
  clearAdminCookie,
  requireAdmin,
  setAdminCookie,
  signAdminToken,
  verifyAdminToken,
} from '../lib/auth.js';
import { requireSupabase, supabase } from '../lib/supabase.js';

const router = Router();

router.post('/admin/login', (req, res) => {
  const password = String(req.body?.password || '');

  if (!process.env.ADMIN_PASSWORD) {
    res.status(503).json({ ok: false, error: 'Admin login not configured.' });
    return;
  }

  if (!checkAdminPassword(password)) {
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

router.get('/admin/stats', requireAdmin, async (req, res) => {
  if (!requireSupabase(res)) return;

  const [visits, contacts, writeups] = await Promise.all([
    supabase.from('live_targets').select('id', { count: 'exact', head: true }),
    supabase.from('contacts').select('id', { count: 'exact', head: true }),
    supabase.from('writeups').select('id', { count: 'exact', head: true }),
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
    .limit(50);

  if (error) {
    res.status(500).json({ ok: false, error: 'Could not load contacts.' });
    return;
  }

  res.json({ ok: true, contacts: data || [] });
});

export default router;
