import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileDown, Pencil, Plus } from 'lucide-react';
import { getOne, insert, list, update, useAsync, useSettings } from '@/lib/data';
import { DOG_STATUS, SPAY, MICROCHIP_BRANDS, RESCUE_TYPE, CONDITION, label } from '@/lib/constants';
import { ageLabel, fmtDate } from '@/lib/format';
import { dogPhoto, onImgError } from '@/lib/images';
import { healthRecord, vaccinationCertificate } from '@/lib/pdf';
import ResourceManager, { RecordForm } from '@/components/ResourceManager';
import DogTag from '@/components/DogTag';
import { Button, Field, Input, Select, Spinner, Tabs, Empty, Textarea, useToast } from '@/components/ui';
import { DOG_FIELDS, VACC_FIELDS, vaccColumns, TREAT_FIELDS, treatColumns, DEWORM_FIELDS, dewormColumns, RESCUE_FIELDS } from './fields';
import { RELEASE_FIELDS, releaseColumns, onReleaseSaved, checkRelease } from './Releases';

export default function DogFile() {
  const { id } = useParams();
  const toast = useToast();
  const settings = useSettings();
  const { data: dog, loading, reload } = useAsync(() => getOne('dogs', id), [id]);
  const [tab, setTab] = useState('vaccinations');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;
  if (!dog) return <Empty title="Dog not found" action={<Link to="/admin/dogs" className="underline">Back to dogs</Link>} />;

  const save = async (patch) => {
    setBusy(true);
    try {
      const { id: _i, created_at, updated_at, ...rest } = patch;
      await update('dogs', dog.id, rest);
      toast('Saved');
      setEditing(false);
      reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const pdf = async (kind) => {
    const [vaccinations, treatments, dewormings, rescues] = await Promise.all([
      list('vaccinations', { eq: { dog_id: id }, order: ['date_administered', false] }),
      list('treatments', { eq: { dog_id: id }, order: ['start_date', false] }),
      list('dewormings', { eq: { dog_id: id }, order: ['date_given', false] }),
      list('rescues', { eq: { dog_id: id }, order: ['rescue_date', true] }),
    ]);
    if (kind === 'vacc') vaccinationCertificate({ dog, vaccinations, settings });
    else healthRecord({ dog, vaccinations, treatments, dewormings, rescues, settings });
  };

  return (
    <div>
      <Link to="/admin/dogs" className="text-sm font-semibold text-ink-400 hover:text-ink">← All dogs</Link>
      <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-start">
        <img src={dogPhoto(dog, 400)} onError={onImgError} alt="" className="h-36 w-36 flex-none rounded-2xl object-cover" />
        <div className="flex-1">
          <DogTag name={dog.name} size="lg" />
          <p className="mt-3 text-ink-500 capitalize">{dog.sex || 'Sex unknown'} · {ageLabel(dog.age_years)} · {dog.breed || 'Indie'}{dog.colour ? ` · ${dog.colour}` : ''} · in since {fmtDate(dog.intake_date)}</p>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <Field label="Health status" className="w-60">
              <Select value={dog.status} options={DOG_STATUS} onChange={(e) => save({ status: e.target.value })} />
            </Field>
            <Button variant="soft" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Edit profile</Button>
            <Button variant="soft" onClick={() => pdf('health')}><FileDown className="h-4 w-4" /> Health record</Button>
            <Button variant="soft" onClick={() => pdf('vacc')}><FileDown className="h-4 w-4" /> Vaccination certificate</Button>
            <Link to={`/dogs/${dog.id}`} className="self-center text-sm font-semibold underline">Public profile</Link>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Tabs value={tab} onChange={setTab} tabs={[
          ['vaccinations', 'Vaccinations'], ['treatments', 'Treatments'], ['deworming', 'Deworming'],
          ['spay', 'Spay / neuter & chip'], ['rescue', 'Rescue'], ['release', 'Release'], ['history', 'Status history'],
        ]} />
        <div className="mt-5">
          {tab === 'vaccinations' && <ResourceManager table="vaccinations" noun="vaccination" fixed={{ dog_id: id }} order={['date_administered', false]} fields={VACC_FIELDS(false)} columns={vaccColumns(false)} csvName={`${dog.name}-vaccinations`} />}
          {tab === 'treatments' && <Treatments dogId={id} dogName={dog.name} />}
          {tab === 'deworming' && <ResourceManager table="dewormings" noun="deworming record" fixed={{ dog_id: id }} order={['date_given', false]} fields={DEWORM_FIELDS(false)} columns={dewormColumns(false)} csvName={`${dog.name}-deworming`} addLabel="Add deworming / tick treatment" />}
          {tab === 'spay' && <SpayChip dog={dog} onSave={save} busy={busy} />}
          {tab === 'rescue' && (
            <ResourceManager table="rescues" noun="rescue record" fixed={{ dog_id: id }} order={['rescue_date', false]} fields={RESCUE_FIELDS(false)}
              columns={[
                { label: 'Date', key: 'rescue_date', type: 'date' },
                { label: 'Where', text: (r) => r.location_text || r.area, render: (r) => `${r.location_text || ''} ${r.area ? `(${r.area})` : ''}` },
                { label: 'What happened', render: (r) => label(RESCUE_TYPE, r.rescue_type), text: (r) => label(RESCUE_TYPE, r.rescue_type) },
                { label: 'Condition', render: (r) => label(CONDITION, r.intake_condition), text: (r) => label(CONDITION, r.intake_condition) },
                { label: 'Rescued by', key: 'rescued_by' },
              ]} />
          )}
          {tab === 'release' && <ResourceManager table="releases" noun="release record" fixed={{ dog_id: id }} order={['created_at', false]} fields={RELEASE_FIELDS(false)} columns={releaseColumns(false)} beforeSave={checkRelease} afterSave={(saved) => onReleaseSaved(saved).then(reload)} />}
          {tab === 'history' && <History dogId={id} />}
        </div>
      </div>

      <RecordForm open={editing} initial={editing ? dog : null} fields={DOG_FIELDS} noun="dog" busy={busy} onClose={() => setEditing(false)}
        onSave={(f) => save(Object.fromEntries(DOG_FIELDS.map((fl) => [fl.name, f[fl.name]])))} />
    </div>
  );
}

function Treatments({ dogId, dogName }) {
  const [notesFor, setNotesFor] = useState(null);
  return (
    <>
      <ResourceManager table="treatments" noun="treatment" fixed={{ dog_id: dogId }} order={['start_date', false]} fields={TREAT_FIELDS(false)} columns={treatColumns(false)} csvName={`${dogName}-treatments`}
        rowActions={(r) => <Button size="sm" variant="ghost" onClick={() => setNotesFor(r)}>Progress notes</Button>} />
      {notesFor && <ProgressNotes treatment={notesFor} onClose={() => setNotesFor(null)} />}
    </>
  );
}

export function ProgressNotes({ treatment, onClose }) {
  const toast = useToast();
  const { data, reload } = useAsync(() => list('treatment_notes', { eq: { treatment_id: treatment.id }, order: ['created_at', false] }), [treatment.id]);
  const [note, setNote] = useState('');
  const add = async (e) => {
    e.preventDefault();
    try {
      await insert('treatment_notes', { treatment_id: treatment.id, note });
      setNote('');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-t-2xl bg-wall p-5 sm:rounded-2xl" role="dialog" aria-label="Progress notes">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Progress notes — {treatment.condition}</h2><button onClick={onClose} className="underline">Close</button></div>
        <form onSubmit={add} className="mt-4 flex gap-2">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Wound drying, appetite back" required />
          <Button type="submit"><Plus className="h-4 w-4" /> Add</Button>
        </form>
        <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
          {(data || []).map((n) => <li key={n.id} className="rounded-lg bg-white px-3 py-2 text-sm"><span className="text-ink-400">{fmtDate(n.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span> — {n.note}</li>)}
          {data?.length === 0 && <li className="text-sm text-ink-400">No notes yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function SpayChip({ dog, onSave, busy }) {
  const [f, setF] = useState({
    spay_neuter: dog.spay_neuter, spay_neuter_date: dog.spay_neuter_date || '', spay_neuter_vet: dog.spay_neuter_vet || '',
    microchip_number: dog.microchip_number || '', microchip_brand: dog.microchip_brand || '', microchip_date: dog.microchip_date || '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(f); }} className="grid max-w-2xl gap-4 sm:grid-cols-3">
      <Field label="Spay / neuter"><Select value={f.spay_neuter} onChange={set('spay_neuter')} options={SPAY} /></Field>
      <Field label="Procedure date"><Input type="date" value={f.spay_neuter_date} onChange={set('spay_neuter_date')} /></Field>
      <Field label="Operating vet"><Input value={f.spay_neuter_vet} onChange={set('spay_neuter_vet')} /></Field>
      <Field label="Microchip number"><Input value={f.microchip_number} onChange={set('microchip_number')} /></Field>
      <Field label="Chip brand"><Select value={f.microchip_brand} onChange={set('microchip_brand')} options={MICROCHIP_BRANDS} /></Field>
      <Field label="Implant date"><Input type="date" value={f.microchip_date} onChange={set('microchip_date')} /></Field>
      <Button type="submit" loading={busy} className="sm:col-span-3 sm:justify-self-start">Save</Button>
    </form>
  );
}

function History({ dogId }) {
  const { data } = useAsync(() => list('dog_status_history', { eq: { dog_id: dogId }, order: ['changed_at', false] }), [dogId]);
  if (!data) return <Spinner />;
  return (
    <ol className="max-w-xl space-y-3 border-l-2 border-wall-3 pl-5">
      {data.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute left-[-27px] top-1.5 h-3 w-3 rounded-full bg-marigold ring-4 ring-wall" />
          <p className="font-semibold">{h.from_status ? `${label(DOG_STATUS, h.from_status)} → ` : ''}{label(DOG_STATUS, h.to_status)}</p>
          <p className="text-sm text-ink-400">{fmtDate(h.changed_at, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </li>
      ))}
    </ol>
  );
}
