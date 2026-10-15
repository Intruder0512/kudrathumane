import { supabase } from '@/lib/supabaseClient';

// Where the Node API (Stripe, certificates, emails) is hosted, e.g. https://api.kudrathumane.org
export const API_SERVER_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const apiServerClient = {
  fetch: async (url, options = {}) => {
    const { data } = await supabase.auth.getSession();
    const headers = new Headers(options.headers || {});
    if (data?.session?.access_token) {
      headers.set('Authorization', `Bearer ${data.session.access_token}`);
    }
    return window.fetch(API_SERVER_URL + url, { ...options, headers });
  },
};

export default apiServerClient;

export { apiServerClient };
