import { useState } from 'react';
import ResourceManager from '@/components/ResourceManager';
import { PageTitle } from '@/layouts/AdminLayout';
import { list, update, useAsync } from '@/lib/data';
import { LF_KIND, LF_STATUS, label } from '@/lib/constants';
import { fmtDate, inr, today } from '@/lib/format';
import { onImgError, PLACEHOLDER } from '@/lib/images';
import { Badge, Button, Modal, Select, useToast } from '@/components/ui';

export default function LostFoundAdmin() {
  const toast = useToast();
  const [matching, setMatching] = useState(null);
  const approve = async (r, reload, approved) => {
    await update('lost_found_reports', r.id, { approved }).catch((e) => toast(e.message, 'error'));
    reload();
  };
  return (
    <div>
      <PageTitle title="Lost & found">Public reports wait here until you approve them. Match a lost dog with a found one, then mark them reunited.</PageTitle>
      <ResourceManager
        table="lost_found_reports" noun="report" order={['created_at', false]} addLabel="Post a report"
        fields={[
          { name: 'kind', label: 'Lost or found', type: 'select', options: LF_KIND, required: true, default: 'found' },
          { name: 'seen_on', label: 'Date', type: 'date', default: today, required: true },
          { name: 'dog_description', label: 'Description', type: 'textarea', required: true },
          { name: 'colour', label: 'Colour' }, { name: 'area', label: 'Area', required: true }, { name: 'city', label: 'City' },
          { name: 'photo_url', label: 'Photo', type: 'image', folder: 'lost-found' },
          { name: 'reporter_name', label: 'Reporter name', required: true }, { name: 'reporter_phone', label: 'Reporter phone', required: true },
          { name: 'reporter_email', label: 'Reporter email', type: 'email' }, { name: 'reward', label: 'Reward (₹)', type: 'number' },
          { name: 'status', label: 'Status', type: 'select', options: LF_STATUS, default: 'open', required: true },
          { name: 'approved', label: 'Show on the website', type: 'checkbox', default: true },
        ]}
        columns={[
          { label: 'Photo', csv: false, render: (r) => <img src={r.photo_url || PLACEHOLDER} onError={onImgError} alt="" className="h-12 w-12 rounded-lg object-cover" /> },
          { label: 'Type', text: (r) => r.kind, render: (r) => <Badge tone={r.kind === 'lost' ? 'red' : 'green'}>{label(LF_KIND, r.kind)}</Badge> },
          { label: 'Date', key: 'seen_on', render: (r) => fmtDate(r.seen_on), csv: (r) => r.seen_on },
          { label: 'Where', text: (r) => `${r.area} ${r.city || ''}`, render: (r) => `${r.area}${r.city ? `, ${r.city}` : ''}` },
          { label: 'Description', key: 'dog_description', className: 'max-w-xs text-ink-500' },
          { label: 'Reporter', text: (r) => `${r.reporter_name} ${r.reporter_phone}`, render: (r) => <span>{r.reporter_name}<a href={`tel:${r.reporter_phone}`} className="block text-xs underline">{r.reporter_phone}</a></span> },
          { label: 'Reward', key: 'reward', render: (r) => (r.reward ? inr(r.reward) : '—') },
          { label: 'Status', text: (r) => `${r.status}${r.approved ? '' : ' (not approved)'}`, render: (r) => <span className="flex flex-col gap-1"><Badge tone="ink">{label(LF_STATUS, r.status)}</Badge>{!r.approved && <Badge tone="amber">Awaiting approval</Badge>}</span> },
        ]}
        search={['area', 'city', 'dog_description', 'reporter_name', 'reporter_phone', 'colour']}
        filters={[
          { name: 'kind', label: 'Types', options: LF_KIND },
          { name: 'status', label: 'Statuses', options: LF_STATUS },
          { name: 'approved', label: 'Approval', options: [['true', 'Approved'], ['false', 'Awaiting approval']], test: (r, v) => String(r.approved) === v },
        ]}
        dateField="seen_on"
        csvName="lost-and-found"
        rowActions={(r, reload) => (
          <>
            {!r.approved ? <Button size="sm" onClick={() => approve(r, reload, true)}>Approve</Button> : <Button size="sm" variant="ghost" onClick={() => approve(r, reload, false)}>Hide</Button>}
            {r.status === 'open' && <Button size="sm" variant="ghost" onClick={() => setMatching({ r, reload })}>Match</Button>}
          </>
        )}
      />
      {matching && <MatchDialog report={matching.r} onClose={() => { setMatching(null); matching.reload(); }} />}
    </div>
  );
}

function MatchDialog({ report, onClose }) {
  const toast = useToast();
  const other = report.kind === 'lost' ? 'found' : 'lost';
  const { data } = useAsync(() => list('lost_found_reports', { eq: { kind: other, status: 'open' }, order: ['seen_on', false] }), [other]);
  const [pick, setPick] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await update('lost_found_reports', report.id, { status: 'matched', matched_report_id: pick });
      await update('lost_found_reports', pick, { status: 'matched', matched_report_id: report.id });
      toast('Matched — call both people to confirm, then mark the reports “Reunited”');
      onClose();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const chosen = (data || []).find((x) => x.id === pick);
  return (
    <Modal open onClose={onClose} title={`Match this ${report.kind} dog`} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={!pick} loading={busy} onClick={save}>Save match</Button></>}>
      <p className="text-sm text-ink-500">{report.dog_description} — {report.area}, {fmtDate(report.seen_on)}</p>
      <Select className="mt-4" value={pick} onChange={(e) => setPick(e.target.value)} placeholder={`Choose a ${other} report`}
        options={(data || []).map((x) => [x.id, `${fmtDate(x.seen_on)} · ${x.area} · ${x.dog_description.slice(0, 50)}`])} />
      {chosen && <p className="mt-3 rounded-lg bg-white p-3 text-sm">{chosen.dog_description}<br />Contact: {chosen.reporter_name}, {chosen.reporter_phone}</p>}
    </Modal>
  );
}
