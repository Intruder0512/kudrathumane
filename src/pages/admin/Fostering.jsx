import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ResourceManager from '@/components/ResourceManager';
import { PageTitle } from '@/layouts/AdminLayout';
import { list, update, useAsync } from '@/lib/data';
import { APPLICATION_STATUS, PLACEMENT_STATUS, MOOD, label } from '@/lib/constants';
import { fmtDate, today } from '@/lib/format';
import { Badge, Button, Select, Spinner, Tabs, Textarea, useToast } from '@/components/ui';

export default function Fostering() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'applications';
  return (
    <div>
      <PageTitle title="Fostering">Review applications, place dogs with foster families, and read their daily updates.</PageTitle>
      <Tabs value={tab} onChange={(t) => setParams({ tab: t })} tabs={[['applications', 'Applications'], ['placements', 'Placements'], ['updates', 'Daily updates']]} />
      <div className="mt-5">
        {tab === 'applications' && <Applications />}
        {tab === 'placements' && <Placements />}
        {tab === 'updates' && <Updates />}
      </div>
    </div>
  );
}

function Applications() {
  const toast = useToast();
  const decide = async (r, status, reload) => {
    try {
      await update('foster_applications', r.id, { status });
      if (status === 'approved' && r.user_id) await update('profiles', r.user_id, { role: 'foster' }).catch(() => {});
      toast(status === 'approved' ? `${r.name} approved${r.user_id ? ' — their login now opens the foster portal' : ''}` : 'Application rejected');
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  return (
    <ResourceManager
      table="foster_applications" noun="application" canAdd={false}
      columns={[
        { label: 'Applied', key: 'created_at', render: (r) => fmtDate(r.created_at), csv: (r) => r.created_at },
        { label: 'Name', key: 'name', render: (r) => <span className="font-semibold">{r.name}</span> },
        { label: 'Contact', text: (r) => `${r.phone} ${r.email}`, render: (r) => <span>{r.phone}<span className="block text-xs text-ink-400">{r.email}</span></span> },
        { label: 'Home', text: (r) => `${r.home_type || ''} ${r.city || ''}`, render: (r) => <span>{r.home_type || '—'}<span className="block text-xs text-ink-400">{r.city}{r.has_other_pets ? ' · has pets' : ''}</span></span> },
        { label: 'Experience', key: 'experience', className: 'max-w-xs text-ink-500' },
        { label: 'Status', text: (r) => r.status, render: (r) => <Badge tone={r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'grey' : 'amber'}>{label(APPLICATION_STATUS, r.status)}</Badge> },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true }, { name: 'phone', label: 'Phone' }, { name: 'email', label: 'Email', type: 'email' },
        { name: 'address', label: 'Address', span: 2 }, { name: 'city', label: 'City' }, { name: 'home_type', label: 'Home' },
        { name: 'experience', label: 'Experience', type: 'textarea' }, { name: 'message', label: 'Message', type: 'textarea' },
        { name: 'status', label: 'Status', type: 'select', options: APPLICATION_STATUS },
      ]}
      search={['name', 'email', 'phone', 'city']}
      filters={[{ name: 'status', label: 'Statuses', options: APPLICATION_STATUS }]}
      csvName="foster-applications"
      rowActions={(r, reload) => r.status === 'pending' && (
        <>
          <Button size="sm" onClick={() => decide(r, 'approved', reload)}>Approve</Button>
          <Button size="sm" variant="ghost" onClick={() => decide(r, 'rejected', reload)}>Reject</Button>
        </>
      )}
    />
  );
}

function FosterLoginPicker({ form, set }) {
  const { data } = useAsync(() => list('profiles', { order: ['full_name', true] }).catch(() => []), []);
  return (
    <div>
      <Select value={form.foster_user_id || ''} placeholder="No login (foster can’t post updates)"
        options={(data || []).map((p) => [p.id, `${p.full_name || p.email} — ${p.email}${p.role === 'foster' ? '' : ` (${p.role})`}`])}
        onChange={(e) => {
          const p = (data || []).find((x) => x.id === e.target.value);
          set({ foster_user_id: e.target.value, ...(p ? { foster_name: form.foster_name || p.full_name, foster_email: p.email, foster_phone: form.foster_phone || p.phone } : {}) });
        }} />
      <p className="hint">Linking a login lets the family post daily updates from their account. They need to sign up on the website first.</p>
    </div>
  );
}

function Placements() {
  return (
    <ResourceManager
      table="foster_placements" select="*, dogs(name)" noun="placement" order={['start_date', false]} addLabel="Place a dog in foster"
      fields={[
        { name: 'dog_id', label: 'Dog', type: 'dog', required: true },
        { name: 'foster_user_id', label: 'Foster family’s login', type: 'custom', render: (f, set) => <FosterLoginPicker form={f} set={set} /> },
        { name: 'foster_name', label: 'Foster family name', required: true },
        { name: 'foster_phone', label: 'Phone' },
        { name: 'foster_email', label: 'Email', type: 'email' },
        { name: 'status', label: 'Status', type: 'select', options: PLACEMENT_STATUS, default: 'active', required: true },
        { name: 'start_date', label: 'Start date', type: 'date', default: today, required: true },
        { name: 'expected_end_date', label: 'Expected return / end', type: 'date' },
        { name: 'end_date', label: 'Actual end date', type: 'date', show: (f) => f.status !== 'active' },
        { name: 'care_instructions', label: 'Care instructions for the family', type: 'textarea', rows: 4 },
      ]}
      columns={[
        { label: 'Dog', text: (r) => r.dogs?.name, render: (r) => <Link className="font-semibold underline" to={`/admin/dogs/${r.dog_id}`}>{r.dogs?.name}</Link> },
        { label: 'Foster family', text: (r) => r.foster_name, render: (r) => <span>{r.foster_name}<span className="block text-xs text-ink-400">{r.foster_phone}{r.foster_user_id ? ' · has portal login' : ''}</span></span> },
        { label: 'From', key: 'start_date', type: 'date', csv: (r) => r.start_date },
        { label: 'Until', key: 'expected_end_date', type: 'date', csv: (r) => r.expected_end_date },
        { label: 'Status', text: (r) => r.status, render: (r) => <Badge tone={r.status === 'active' ? 'green' : 'grey'}>{label(PLACEMENT_STATUS, r.status)}</Badge> },
      ]}
      search={['foster_name', 'foster_phone', (r) => r.dogs?.name]}
      filters={[{ name: 'status', label: 'Statuses', options: PLACEMENT_STATUS }]}
      csvName="foster-placements"
      afterSave={async (saved) => {
        await update('dogs', saved.dog_id, { status: saved.status === 'active' ? 'fostered' : 'ready' }).catch(() => {});
      }}
    />
  );
}

function Updates() {
  const toast = useToast();
  const { data, loading, reload } = useAsync(() => list('foster_updates', { select: '*, foster_placements(foster_name, dog_id, dogs(name))', order: ['update_date', false], limit: 200 }), []);
  const [drafts, setDrafts] = useState({});
  const save = async (u) => {
    try {
      await update('foster_updates', u.id, { admin_comment: drafts[u.id] });
      toast('Comment saved — the foster family will see it');
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  if (loading) return <Spinner />;
  if (!data?.length) return <p className="text-ink-400">No updates yet. Foster families post them from their account once you link their login to a placement.</p>;
  return (
    <ul className="space-y-4">
      {data.map((u) => (
        <li key={u.id} className="rounded-2xl bg-white p-5 ring-1 ring-wall-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-lg font-bold">{u.foster_placements?.dogs?.name} <span className="font-sans text-sm font-normal text-ink-400">with {u.foster_placements?.foster_name} · {fmtDate(u.update_date)}</span></p>
            <Badge tone={u.mood === 'unwell' ? 'red' : 'green'}>{label(MOOD, u.mood)}{u.weight_kg ? ` · ${u.weight_kg} kg` : ''}</Badge>
          </div>
          <div className="mt-2 grid gap-1 text-sm text-ink-500">
            {u.eating && <p>Eating: {u.eating}</p>}
            {u.health_notes && <p>Health: {u.health_notes}</p>}
            {u.behaviour_notes && <p>Behaviour: {u.behaviour_notes}</p>}
          </div>
          {u.photos?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{u.photos.map((p) => <a key={p} href={p} target="_blank" rel="noreferrer"><img src={p} alt="" className="h-20 w-20 rounded-lg object-cover" /></a>)}</div>}
          <div className="mt-3 flex gap-2">
            <Textarea rows={1} className="flex-1" placeholder="Reply to the foster family" value={drafts[u.id] ?? u.admin_comment ?? ''} onChange={(e) => setDrafts({ ...drafts, [u.id]: e.target.value })} />
            <Button size="sm" variant="soft" onClick={() => save(u)}>Save</Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
