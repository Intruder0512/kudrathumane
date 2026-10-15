// Kept under the old name so existing imports keep working.
// Data now lives in Supabase — see supabaseAdapter.js.
import { supabase } from '@/lib/supabaseClient';
import { createPbAdapter } from '@/lib/supabaseAdapter';
import { TABLES } from '@/lib/dbSchema';

const pocketbaseClient = createPbAdapter(supabase, { tables: TABLES, bucket: 'uploads' });

export default pocketbaseClient;
export { pocketbaseClient };
