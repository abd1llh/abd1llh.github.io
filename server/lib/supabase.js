import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigured = Boolean(url && serviceKey);

export const supabase = supabaseConfigured
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null;

export function requireSupabase(res) {
  if (!supabase) {
    res.status(503).json({
      ok: false,
      error: 'Database not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    });
    return false;
  }
  return true;
}
