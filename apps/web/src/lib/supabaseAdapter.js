// A small PocketBase-style wrapper around Supabase.
// The site was generated against the PocketBase SDK (pb.collection(...).getFullList(), etc.).
// This adapter keeps that API so pages work unchanged, while data lives in Supabase
// (Postgres tables + the public "uploads" storage bucket).
//
// Supported: getFullList({ sort, filter, expand }), getOne(id, { expand }),
// create(data|FormData), update(id, data|FormData), delete(id), files.getUrl(record, path).

const EXPAND_TARGETS = {
  dog_id: 'dogs',
  foster_id: 'foster_families',
  placement_id: 'foster_placements',
  adoption_id: 'virtual_adoptions',
  item_id: 'inventory',
  user_id: 'profiles',
};

export class ClientResponseError extends Error {
  constructor(message, status = 400, data = {}) {
    super(message);
    this.status = status;
    this.data = data;
    this.response = { message, data };
  }
}

const isFile = (v) =>
  (typeof File !== 'undefined' && v instanceof File) ||
  (typeof Blob !== 'undefined' && v instanceof Blob);

const toError = (error, fallbackStatus = 400) => {
  if (!error) return null;
  const status = error.code === 'PGRST116' ? 404 : Number(error.status) || fallbackStatus;
  return new ClientResponseError(error.message || 'Request failed', status, error);
};

// ── filter: 'status="Available"', 'a >= "x" && a <= "y"', 'status="Lost" || status="Found"'
const OPS = { '!=': 'neq', '>=': 'gte', '<=': 'lte', '=': 'eq', '>': 'gt', '<': 'lt', '~': 'ilike' };
const parseCondition = (cond) => {
  const m = cond.trim().match(/^([a-zA-Z0-9_.]+)\s*(!=|>=|<=|=|>|<|~)\s*(.+)$/);
  if (!m) throw new ClientResponseError(`Unsupported filter: ${cond}`);
  let [, field, op, raw] = m;
  raw = raw.trim();
  let value;
  if (/^(".*"|'.*')$/.test(raw)) value = raw.slice(1, -1);
  else if (raw === 'true' || raw === 'false') value = raw === 'true';
  else if (raw === 'null' || raw === '""') value = null;
  else if (!Number.isNaN(Number(raw))) value = Number(raw);
  else value = raw;
  if (op === '~') value = `%${value}%`;
  return { field, op: OPS[op], value };
};

const applyFilter = (query, filter) => {
  if (!filter || !filter.trim()) return query;
  if (filter.includes('||')) {
    const parts = filter.split('||').map(parseCondition);
    const orExpr = parts
      .map(({ field, op, value }) => `${field}.${value === null ? 'is' : op}.${value === null ? 'null' : `"${String(value).replace(/"/g, '\\"')}"`}`)
      .join(',');
    return query.or(orExpr);
  }
  for (const { field, op, value } of filter.split('&&').map(parseCondition)) {
    if (value === null) query = op === 'neq' ? query.not(field, 'is', null) : query.is(field, null);
    else query = query[op](field, value);
  }
  return query;
};

const applySort = (query, sort) => {
  if (!sort) return query;
  for (let key of sort.split(',').map((s) => s.trim()).filter(Boolean)) {
    const desc = key.startsWith('-');
    key = key.replace(/^[-+]/, '');
    query = query.order(key, { ascending: !desc, nullsFirst: false });
  }
  return query;
};

export function createPbAdapter(supabase, { tables, bucket = 'uploads' } = {}) {
  const storage = () => supabase.storage.from(bucket);

  const uploadFile = async (table, id, file) => {
    const safe = (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    const path = `${table}/${id}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${safe}`;
    const { error } = await storage().upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw toError(error);
    return path;
  };

  // FormData / object → plain row, uploading any files on the way.
  const prepareRow = async (table, input, id) => {
    const meta = tables[table] || { columns: null, files: {} };
    const fileFields = meta.files || {};
    const raw = {};
    const entries = typeof FormData !== 'undefined' && input instanceof FormData
      ? Array.from(input.entries())
      : Object.entries(input || {});

    for (let [key, value] of entries) {
      key = key.replace(/[+-]$/, '');
      if (fileFields[key] === 'multi') {
        raw[key] = raw[key] || [];
        const values = Array.isArray(value) ? value : [value];
        raw[key].push(...values);
      } else {
        raw[key] = value;
      }
    }

    const row = {};
    for (const [key, value] of Object.entries(raw)) {
      if (meta.columns && !meta.columns.includes(key)) continue; // ignore unknown fields like PocketBase did
      if (key === 'created' || key === 'updated') continue;
      if (fileFields[key] === 'multi') {
        const out = [];
        for (const v of value) {
          if (isFile(v)) out.push(await uploadFile(table, id, v));
          else if (typeof v === 'string' && v) out.push(v);
        }
        row[key] = out;
      } else if (fileFields[key] === 'single') {
        if (isFile(value)) row[key] = await uploadFile(table, id, value);
        else row[key] = value || null;
      } else if (value === '' || value === undefined) {
        row[key] = null;
      } else {
        row[key] = value;
      }
    }
    return row;
  };

  const expandRecords = async (records, expand) => {
    if (!expand || !records.length) return records;
    for (const field of expand.split(',').map((s) => s.trim()).filter(Boolean)) {
      const target = EXPAND_TARGETS[field];
      if (!target) continue;
      const ids = [...new Set(records.map((r) => r[field]).filter(Boolean))];
      if (!ids.length) continue;
      const { data } = await supabase.from(target).select('*').in('id', ids);
      const byId = Object.fromEntries((data || []).map((d) => [String(d.id), d]));
      for (const r of records) {
        r.expand = r.expand || {};
        if (byId[r[field]]) r.expand[field] = byId[r[field]];
      }
    }
    return records;
  };

  const collection = (name) => {
    const table = name === 'users' ? 'profiles' : name;
    return {
      async getFullList(opts = {}) {
        if (typeof opts === 'number') opts = arguments[1] || {};
        let q = supabase.from(table).select('*');
        q = applyFilter(q, opts.filter);
        q = applySort(q, opts.sort);
        const { data, error } = await q;
        if (error) throw toError(error);
        return expandRecords(data || [], opts.expand);
      },
      async getList(page = 1, perPage = 30, opts = {}) {
        const from = (page - 1) * perPage;
        let q = supabase.from(table).select('*', { count: 'exact' });
        q = applyFilter(q, opts.filter);
        q = applySort(q, opts.sort).range(from, from + perPage - 1);
        const { data, error, count } = await q;
        if (error) throw toError(error);
        const items = await expandRecords(data || [], opts.expand);
        return { page, perPage, totalItems: count ?? items.length, totalPages: Math.ceil((count ?? items.length) / perPage), items };
      },
      async getFirstListItem(filter, opts = {}) {
        const items = await this.getFullList({ ...opts, filter });
        if (!items.length) throw new ClientResponseError('Not found', 404);
        return items[0];
      },
      async getOne(id, opts = {}) {
        const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
        if (error) throw toError(error, 404);
        const [rec] = await expandRecords([data], opts.expand);
        return rec;
      },
      async create(input) {
        const fromInput = typeof FormData !== 'undefined' && input instanceof FormData ? input.get('id') : input?.id;
        const id = fromInput || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random().toString(36).slice(2)}`);
        const row = await prepareRow(table, input, id);
        row.id = id;
        // Insert without RETURNING: some tables let people add rows they can't read back
        // (e.g. public lost & found reports, foster updates), which would fail with .select().
        const { error } = await supabase.from(table).insert(row);
        if (error) throw toError(error);
        const { data } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
        return data || { ...row, created: new Date().toISOString() };
      },
      async update(id, input) {
        const row = await prepareRow(table, input, id);
        delete row.id;
        const { data, error } = await supabase.from(table).update(row).eq('id', id).select().single();
        if (error) throw toError(error);
        return data;
      },
      async delete(id) {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw toError(error);
        return true;
      },
    };
  };

  const files = {
    getUrl(_record, path) {
      if (!path) return '';
      if (/^(https?:|data:|blob:|\/)/.test(path)) return path;
      return storage().getPublicUrl(path).data.publicUrl;
    },
  };

  return { collection, files, supabase, autoCancellation() {} };
}
