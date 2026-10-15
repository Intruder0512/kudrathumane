import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Download, Search, Trash } from 'lucide-react';
import { list, insert, update, remove, useAsync } from '@/lib/data';
import { downloadCSV } from '@/lib/csv';
import { fmtDate } from '@/lib/format';
import { Button, Field, Input, Select, Textarea, Checkbox, Modal, Confirm, Spinner, Empty, ErrorNote, useToast, cx } from './ui';
import DogSelect from './DogSelect';
import ImageUpload from './ImageUpload';

/**
 * Generic list + add/edit form for one table.
 * fields: [{ name, label, type, options, required, hint, span, show(form), default, folder, placeholder }]
 * types: text, email, tel, number, date, textarea, select, dog, checkbox, image, images, medications, custom (render)
 */
export default function ResourceManager({
  table,
  select = '*',
  order = ['created_at', false],
  noun = 'record',
  columns,
  fields,
  filters = [],
  search = [],
  dateField,
  fixed,
  defaults = {},
  beforeSave,
  afterSave,
  rowActions,
  canAdd = true,
  canEdit = true,
  canDelete = true,
  csvName,
  summary,
  emptyText,
  addLabel,
  rowClass,
}) {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(
    () => list(table, { select, order, eq: fixed }),
    [table, select, JSON.stringify(order), JSON.stringify(fixed)]
  );
  const [q, setQ] = useState('');
  const [f, setF] = useState({});
  const [range, setRange] = useState({ from: '', to: '' });
  const [editing, setEditing] = useState(null); // {} for new, row for edit
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    let r = data || [];
    for (const flt of filters) {
      const v = f[flt.name];
      if (v) r = r.filter((x) => (flt.test ? flt.test(x, v) : String(x[flt.name]) === v));
    }
    if (dateField && range.from) r = r.filter((x) => (x[dateField] || '') >= range.from);
    if (dateField && range.to) r = r.filter((x) => (x[dateField] || '').slice(0, 10) <= range.to);
    if (q.trim() && search.length) {
      const needle = q.trim().toLowerCase();
      r = r.filter((x) => search.some((k) => String(typeof k === 'function' ? k(x) : x[k] ?? '').toLowerCase().includes(needle)));
    }
    return r;
  }, [data, f, q, range, filters, search, dateField]);

  const exportCSV = () =>
    downloadCSV(
      `${csvName || table}-${new Date().toISOString().slice(0, 10)}`,
      rows,
      columns.filter((c) => c.csv !== false).map((c) => ({ label: c.label, value: c.csv || ((r) => (c.text ? c.text(r) : r[c.key])) }))
    );

  const save = async (form) => {
    setBusy(true);
    try {
      // Send only this form's fields (+ fixed/default values); joined data like dogs(name) is left out.
      const keys = new Set([...fields.filter((fl) => !fl.omit).map((fl) => fl.name), ...Object.keys(defaults), ...Object.keys(fixed || {})]);
      let row = {};
      for (const k of keys) if (k in form) row[k] = form[k];
      Object.assign(row, fixed || {});
      const helpers = {};
      for (const k of Object.keys(form)) if (k.startsWith('_')) helpers[k] = row[k] = form[k]; // helper values for before/afterSave
      if (beforeSave) row = (await beforeSave(row, editing)) || row;
      for (const k of Object.keys(row)) if (k.startsWith('_')) delete row[k];
      const saved = editing?.id ? await update(table, editing.id, row) : await insert(table, row);
      if (afterSave) await afterSave(saved, editing, { ...row, ...helpers });
      toast(editing?.id ? `${cap(noun)} updated` : `${cap(noun)} added`);
      setEditing(null);
      reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await remove(table, deleting.id);
      toast(`${cap(noun)} deleted`);
      setDeleting(null);
      reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const openNew = () => {
    const init = {};
    for (const fl of fields) init[fl.name] = typeof fl.default === 'function' ? fl.default() : fl.default ?? (fl.type === 'checkbox' ? false : fl.type === 'images' || fl.type === 'medications' ? [] : '');
    setEditing({ ...init, ...defaults });
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-wrap items-end gap-2">
          {search.length > 0 && (
            <label className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <span className="sr-only">Search</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input className="input pl-9" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
          )}
          {filters.map((flt) => (
            <label key={flt.name} className="min-w-[150px]">
              <span className="sr-only">{flt.label}</span>
              <Select value={f[flt.name] || ''} onChange={(e) => setF({ ...f, [flt.name]: e.target.value })} placeholder={`All ${flt.label.toLowerCase()}`} options={flt.options} />
            </label>
          ))}
          {dateField && (
            <div className="flex items-end gap-2">
              <Field label="From" className="text-xs"><Input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></Field>
              <Field label="To" className="text-xs"><Input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></Field>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="soft" onClick={exportCSV} disabled={!rows.length}><Download className="h-4 w-4" /> Export CSV</Button>
          {canAdd && <Button onClick={openNew}><Plus className="h-4 w-4" /> {addLabel || `Add ${noun}`}</Button>}
        </div>
      </div>

      {summary && data && <div className="mb-4">{summary(rows, data)}</div>}

      <ErrorNote error={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : !error && rows.length === 0 ? (
        <Empty title={data?.length ? 'Nothing matches these filters' : emptyText || `No ${noun}s yet`} action={canAdd && !data?.length ? <Button onClick={openNew}><Plus className="h-4 w-4" /> {addLabel || `Add ${noun}`}</Button> : null} />
      ) : (
        !error && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {columns.filter((c) => !c.hidden).map((c) => <th key={c.label}>{c.label}</th>)}
                  {(canEdit || canDelete || rowActions) && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={rowClass?.(r)}>
                    {columns.filter((c) => !c.hidden).map((c) => (
                      <td key={c.label} className={c.className}>{c.render ? c.render(r, reload) : c.type === 'date' ? fmtDate(r[c.key]) : r[c.key] ?? '—'}</td>
                    ))}
                    {(canEdit || canDelete || rowActions) && (
                      <td className="whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1">
                          {rowActions?.(r, reload)}
                          {canEdit && <button className="rounded-lg p-2 hover:bg-wall-2" onClick={() => setEditing(r)} aria-label={`Edit ${noun}`}><Pencil className="h-4 w-4" /></button>}
                          {canDelete && <button className="rounded-lg p-2 text-sindoor hover:bg-sindoor-50" onClick={() => setDeleting(r)} aria-label={`Delete ${noun}`}><Trash2 className="h-4 w-4" /></button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
      {rows.length > 0 && <p className="mt-2 text-sm text-ink-400">{rows.length} of {data?.length} shown</p>}

      <RecordForm open={!!editing} initial={editing} fields={fields} noun={noun} busy={busy} onClose={() => setEditing(null)} onSave={save} />
      <Confirm
        open={!!deleting}
        title={`Delete this ${noun}?`}
        message="This can’t be undone."
        loading={busy}
        onConfirm={doDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function RecordForm({ open, initial, fields, noun, busy, onClose, onSave, title, saveLabel }) {
  const [form, setForm] = useState({});
  const [key, setKey] = useState(null);
  if (open && initial !== key) {
    setKey(initial);
    setForm({ ...initial });
  }
  const set = (patch) => setForm((x) => ({ ...x, ...patch }));
  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      wide={fields.length > 6}
      title={title || (initial?.id ? `Edit ${noun}` : `Add ${noun}`)}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="record-form" loading={busy}>{saveLabel || (initial?.id ? 'Save changes' : `Add ${noun}`)}</Button>
        </>
      }
    >
      <form id="record-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {fields.filter((fl) => !fl.show || fl.show(form)).map((fl) => (
          <FieldInput key={fl.name} fl={fl} form={form} set={set} />
        ))}
      </form>
    </Modal>
  );
}

function FieldInput({ fl, form, set }) {
  const v = form[fl.name] ?? '';
  const span = fl.span === 2 || ['textarea', 'images', 'medications', 'custom'].includes(fl.type) ? 'sm:col-span-2' : '';
  const on = (e) => {
    const patch = { [fl.name]: e.target.value };
    if (fl.onChange) Object.assign(patch, fl.onChange(e.target.value, form) || {});
    set(patch);
  };
  if (fl.type === 'checkbox')
    return <Checkbox className={span || 'sm:col-span-2'} label={fl.label} hint={fl.hint} checked={!!v} onChange={(e) => set({ [fl.name]: e.target.checked })} />;
  let control;
  switch (fl.type) {
    case 'textarea':
      control = <Textarea value={v} onChange={on} required={fl.required} rows={fl.rows || 3} placeholder={fl.placeholder} />;
      break;
    case 'select':
      control = <Select value={v} onChange={on} required={fl.required} options={typeof fl.options === 'function' ? fl.options(form) : fl.options} placeholder={fl.required ? 'Choose…' : '—'} />;
      break;
    case 'dog':
      control = <DogSelect value={v} onChange={(id) => on({ target: { value: id } })} required={fl.required} />;
      break;
    case 'image':
      control = <ImageUpload value={v} onChange={(u) => set({ [fl.name]: u })} folder={fl.folder} />;
      break;
    case 'images':
      control = <ImageUpload multiple value={v || []} onChange={(u) => set({ [fl.name]: u })} folder={fl.folder} label="Add photos" />;
      break;
    case 'medications':
      control = <Medications value={Array.isArray(v) ? v : []} onChange={(m) => set({ [fl.name]: m })} />;
      break;
    case 'custom':
      control = fl.render(form, set);
      break;
    default:
      control = (
        <Input
          type={fl.type || 'text'}
          value={v}
          onChange={on}
          required={fl.required}
          step={fl.type === 'number' ? fl.step || 'any' : undefined}
          min={fl.min}
          placeholder={fl.placeholder}
        />
      );
  }
  return (
    <Field label={fl.label} hint={fl.hint} required={fl.required} className={span}>
      {control}
    </Field>
  );
}

function Medications({ value, onChange }) {
  const rows = value.length ? value : [];
  const upd = (i, patch) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <input className="input" placeholder="Medicine" value={r.name || ''} onChange={(e) => upd(i, { name: e.target.value })} />
          <input className="input max-w-[40%]" placeholder="Dose, e.g. 250 mg" value={r.dosage || ''} onChange={(e) => upd(i, { dosage: e.target.value })} />
          <button type="button" className="rounded-lg p-2 text-sindoor hover:bg-sindoor-50" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="Remove medicine">
            <Trash className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button type="button" className={cx('text-sm font-semibold underline')} onClick={() => onChange([...rows, { name: '', dosage: '' }])}>
        + Add medicine
      </button>
    </div>
  );
}
