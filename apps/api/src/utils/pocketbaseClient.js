// Server-side database client (Supabase). Kept under the old name so routes work unchanged.
// Uses the SECRET key, which bypasses row-level security — only ever load it from .env on the server.
import { createClient } from '@supabase/supabase-js';
import { createPbAdapter } from './supabaseAdapter.js';
import { TABLES } from './dbSchema.js';
import logger from './logger.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  logger.error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set in apps/api/.env');
}

export const supabaseAdmin = createClient(SUPABASE_URL || 'http://localhost', SUPABASE_SECRET_KEY || 'missing', {
  auth: { persistSession: false, autoRefreshToken: false },
});

const pocketbaseClient = createPbAdapter(supabaseAdmin, { tables: TABLES, bucket: 'uploads' });

// Email: uses Resend (https://resend.com) when RESEND_API_KEY is set; otherwise logs and skips.
pocketbaseClient.sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn(`Email not sent (RESEND_API_KEY not set): "${subject}" → ${to}`);
    return { skipped: true };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Kudrat Humane Living Trust <noreply@kudrathumane.org>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Email failed: ${res.status} ${await res.text()}`);
  return res.json();
};

export default pocketbaseClient;
export { pocketbaseClient };
