import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import ResourceManager from '@/components/ResourceManager';
import { PageTitle } from '@/layouts/AdminLayout';
import { RELEASE_TYPE, label } from '@/lib/constants';
import { addDays, daysUntil, fmtDate } from '@/lib/format';
import { update } from '@/lib/data';
import { Badge } from '@/components/ui';

const CHECKS = [
  ['vaccinations_complete', 'All scheduled vaccinations complete'],
  ['treatment_complete', 'Treatment marked complete by the vet'],
  ['spay_neuter_done', 'Spayed / neutered'],
  ['behaviour_passed', 'Behaviour assessment passed'],
  ['microchipped', 'Microchipped (optional)'],
];

export const RELEASE_FIELDS = (withDog = true) => [
  ...(withDog ? [{ name: 'dog_id', label: 'Dog', type: 'dog', required: true }] : []),
  ...CHECKS.map(([name, l]) => ({ name, label: l, type: 'checkbox' })),
  { name: 'spay_neuter_waiver_reason', label: 'Reason spay / neuter is waived', show: (f) => !f.spay_neuter_done, hint: 'Required to release without spay / neuter' },
  { name: 'follow_up_plan', label: 'Post-release follow-up plan', type: 'textarea' },
  { name: 'release_type', label: 'Release type', type: 'select', options: RELEASE_TYPE },
  { name: 'release_date', label: 'Release date', type: 'date', hint: 'Leave empty until the dog actually leaves' },
  { name: 'released_to', label: 'Released to (person / family / place)' },
  { name: 'contact', label: 'Their contact details' },
  { name: 'photos', label: 'Post-release photos', type: 'images', folder: 'releases' },
  { name: 'follow_up_7_done', label: '7-day check-in done', type: 'checkbox' },
  { name: 'follow_up_30_done', label: '30-day check-in done', type: 'checkbox' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

const score = (r) => ['vaccinations_complete', 'treatment_complete', 'behaviour_passed'].filter((k) => r[k]).length + (r.spay_neuter_done || r.spay_neuter_waiver_reason ? 1 : 0);

export const releaseColumns = (withDog = true) => [
  ...(withDog ? [{ label: 'Dog', text: (r) => r.dogs?.name, render: (r) => <Link to={`/admin/dogs/${r.dog_id}`} className="font-semibold underline">{r.dogs?.name}</Link> }] : []),
  { label: 'Checklist', text: (r) => `${score(r)}/4`, render: (r) => <Badge tone={score(r) === 4 ? 'green' : 'amber'}>{score(r) === 4 ? <><Check className="h-3 w-3" /> Cleared</> : `${score(r)} of 4 cleared`}</Badge> },
  { label: 'Type', text: (r) => label(RELEASE_TYPE, r.release_type), render: (r) => r.release_type ? label(RELEASE_TYPE, r.release_type) : '—' },
  { label: 'Released', key: 'release_date', type: 'date', csv: (r) => r.release_date },
  { label: 'To', key: 'released_to' },
  {
    label: 'Follow-ups', csv: false,
    render: (r, reload) => r.release_date ? (
      <div className="flex flex-col gap-1">
        <FollowUp r={r} k="follow_up_7_done" days={7} reload={reload} />
        <FollowUp r={r} k="follow_up_30_done" days={30} reload={reload} />
      </div>
    ) : '—',
  },
];

function FollowUp({ r, k, days, reload }) {
  const due = addDays(r.release_date, days);
  if (r[k]) return <span className="text-xs font-semibold text-neem">{days}-day ✓</span>;
  const overdue = daysUntil(due) <= 0;
  return (
    <button className={`text-left text-xs font-semibold underline ${overdue ? 'text-sindoor' : 'text-ink-400'}`} onClick={() => update('releases', r.id, { [k]: true }).then(reload)}>
      {days}-day call {overdue ? 'due' : `on ${fmtDate(due)}`} — mark done
    </button>
  );
}

// A dog can only leave once the checklist is cleared
export async function checkRelease(row) {
  if (row.release_date) {
    const missing = [];
    if (!row.vaccinations_complete) missing.push('vaccinations');
    if (!row.treatment_complete) missing.push('treatment');
    if (!row.spay_neuter_done && !row.spay_neuter_waiver_reason) missing.push('spay / neuter (or a waiver reason)');
    if (!row.behaviour_passed) missing.push('behaviour assessment');
    if (missing.length) throw new Error(`Can’t set a release date yet — still to clear: ${missing.join(', ')}.`);
  }
  return row;
}

const STATUS_FOR = { physical_foster: 'fostered', permanent_adoption: 'adopted', return_to_street: 'released', transfer: 'released' };
export async function onReleaseSaved(saved) {
  if (saved.release_date && STATUS_FOR[saved.release_type]) await update('dogs', saved.dog_id, { status: STATUS_FOR[saved.release_type] });
  else if (score(saved) === 4 && !saved.release_date) await update('dogs', saved.dog_id, { status: 'ready' }).catch(() => {});
}

export default function Releases() {
  return (
    <div>
      <PageTitle title="Release & discharge">A dog can be released only when vaccinations, treatment, spay / neuter (or a waiver) and the behaviour check are all cleared. Saving a cleared checklist marks the dog “Ready”; adding a release date updates their status.</PageTitle>
      <ResourceManager table="releases" select="*, dogs(name)" noun="release record" fields={RELEASE_FIELDS()} columns={releaseColumns()}
        search={[(r) => r.dogs?.name, 'released_to']} filters={[{ name: 'release_type', label: 'Types', options: RELEASE_TYPE }]}
        dateField="release_date" beforeSave={checkRelease} afterSave={onReleaseSaved} csvName="releases" />
    </div>
  );
}
