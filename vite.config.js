import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Supabase settings come from apps env vars or a local .env file.
// Only the URL and the PUBLISHABLE key may reach the browser.
export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '');
  const pick = (...names) => {
    for (const n of names) {
      const v = process.env[n] || fileEnv[n];
      if (v) return v.trim();
    }
    return '';
  };
  const url = pick('VITE_SUPABASE_URL', 'SUPABASE_URL');
  // The publishable key is public by design (it ships in the browser); access is controlled by row-level security.
  const key =
    pick('VITE_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY') ||
    'sb_publishable_ShXGxPW2nPbHj_gW9iUcAA_PCcQLC_0';

  const looksSecret = (k) => {
    if (!k) return false;
    if (k.startsWith('sb_secret_')) return true;
    try {
      return JSON.parse(Buffer.from(k.split('.')[1] || '', 'base64').toString()).role === 'service_role';
    } catch {
      return false;
    }
  };
  if (looksSecret(key)) {
    throw new Error('The Supabase key for the website is the SECRET key. Use the publishable key (sb_publishable_…).');
  }
  if (mode === 'production' && !key) {
    console.warn('\n⚠  No Supabase publishable key set — the site will build, but data and logins will not work.\n');
  }

  return {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(url || 'https://hpodtwxixhchdveuygsk.supabase.co'),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(key),
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            pdf: ['jspdf', 'qrcode'],
            map: ['leaflet', 'react-leaflet'],
          },
        },
      },
    },
  };
});
