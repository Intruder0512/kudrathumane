import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

// Run an async loader and keep { data, loading, error, reload } in state.
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const alive = useRef(true);
  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loader();
      if (alive.current) setState({ data, loading: false, error: null });
    } catch (error) {
      console.error(error);
      if (alive.current) setState({ data: null, loading: false, error });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    alive.current = true;
    run();
    return () => {
      alive.current = false;
    };
  }, [run]);
  return { ...state, reload: run };
}

const check = ({ data, error, count }) => {
  if (error) throw new Error(friendlyError(error));
  return count !== undefined && count !== null ? { data, count } : data;
};

export const friendlyError = (error) => {
  const msg = error?.message || String(error);
  if (/row-level security|permission denied/i.test(msg)) return 'You don’t have permission to do that. Log in with an admin account.';
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Can’t reach the server. Check your internet connection and try again.';
  if (/duplicate key/i.test(msg)) return 'That already exists — the value must be unique.';
  if (/Invalid login credentials/i.test(msg)) return 'Email or password is incorrect.';
  if (/Email not confirmed/i.test(msg)) return 'Please confirm your email first — check your inbox for the link.';
  if (/not-configured|Invalid API key|No API key/i.test(msg)) return 'The website isn’t connected to the database yet (missing Supabase publishable key).';
  return msg;
};

// list('dogs', { order: ['name', true], eq: { status: 'ready' }, select: '*, dogs(name)' })
export async function list(table, { select = '*', order, eq, inValues, gte, lte, limit } = {}) {
  let q = supabase.from(table).select(select);
  if (eq) for (const [k, v] of Object.entries(eq)) if (v !== undefined && v !== '') q = q.eq(k, v);
  if (inValues) for (const [k, v] of Object.entries(inValues)) q = q.in(k, v);
  if (gte) for (const [k, v] of Object.entries(gte)) q = q.gte(k, v);
  if (lte) for (const [k, v] of Object.entries(lte)) q = q.lte(k, v);
  if (order) {
    const orders = Array.isArray(order[0]) ? order : [order];
    for (const [col, asc = true] of orders) q = q.order(col, { ascending: asc, nullsFirst: false });
  }
  if (limit) q = q.limit(limit);
  return check(await q) || [];
}

export async function getOne(table, id, select = '*') {
  return check(await supabase.from(table).select(select).eq('id', id).maybeSingle());
}

export async function insert(table, row) {
  return check(await supabase.from(table).insert(clean(row)).select().single());
}
// For tables where the person may write but not read back (public forms)
export async function insertQuiet(table, row) {
  return check(await supabase.from(table).insert(clean(row)));
}
export async function update(table, id, row) {
  return check(await supabase.from(table).update(clean(row)).eq('id', id).select().single());
}
export async function remove(table, id) {
  return check(await supabase.from(table).delete().eq('id', id));
}
export async function rpc(fn, args) {
  return check(await supabase.rpc(fn, args));
}

// Empty strings become null so dates and numbers save cleanly.
function clean(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (k.startsWith('_')) continue;
    out[k] = v === '' ? null : v;
  }
  return out;
}

// Upload a photo to the public "media" bucket; returns its public URL.
export async function uploadFile(file, folder = 'misc') {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const small = await shrinkImage(file);
  const { error } = await supabase.storage.from('media').upload(path, small, { contentType: small.type || file.type });
  if (error) throw new Error(friendlyError(error));
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
}

// Resize big phone photos before upload (max 1600px, JPEG).
async function shrinkImage(file, max = 1600) {
  if (!file.type?.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 900_000) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

// ── Shared cached lookups ──────────────────────────────────────────
let settingsCache = null;
export async function getSettings(force = false) {
  if (settingsCache && !force) return settingsCache;
  try {
    settingsCache = (await getOne('settings', 1)) || {};
  } catch {
    settingsCache = {};
  }
  return settingsCache;
}
export const clearSettingsCache = () => {
  settingsCache = null;
};
export function useSettings() {
  const { data } = useAsync(() => getSettings(), []);
  return data || {};
}

export function useDogs(opts = {}) {
  return useAsync(() => list('dogs', { order: ['name', true], ...opts }), [JSON.stringify(opts)]);
}
