import { Router } from 'express';
import { supabaseConfigured } from '../lib/supabase.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'abd1llh-api',
    database: supabaseConfigured,
    time: new Date().toISOString(),
  });
});

router.get('/config', (_req, res) => {
  res.json({
    ok: true,
    features: {
      contact: supabaseConfigured,
      writeups: supabaseConfigured,
      analytics: supabaseConfigured,
    },
    supabaseUrl: process.env.SUPABASE_URL || null,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null,
  });
});

export default router;
