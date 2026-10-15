// Shared form fields and table columns for dogs and medical records.
import { Link } from 'react-router-dom';
import {
  DOG_STATUS, SEX, SPAY, VACCINES, FREQUENCY, OUTCOME, DEWORM_KIND, RESCUE_TYPE, CONDITION, MICROCHIP_BRANDS, label,
} from '@/lib/constants';
import { addMonths, ageLabel, fmtDate, today } from '@/lib/format';
import { dogPhoto, onImgError } from '@/lib/images';
import { DogStatus, DueBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui';
import { MapPicker } from '@/components/Maps';

export const vaccineMonths = (name) => VACCINES.find(([v]) => v === name)?.[1] ?? 12;

export const DOG_FIELDS = [
  { name: 'name', label: 'Name', required: true },
  { name: 'status', label: 'Health status', type: 'select', options: DOG_STATUS, required: true, default: 'rescued' },
  { name: 'sex', label: 'Sex', type: 'select', options: SEX },
  { name: 'age_years', label: 'Age (years)', type: 'number', step: '0.5', hint: 'Use 0.5 for six months' },
  { name: 'breed', label: 'Breed', default: 'Indie' },
  { name: 'colour', label: 'Colour' },
  { name: 'rescued_from_area', label: 'Rescued from (area)', placeholder: 'e.g. Sector 14, Gurugram' },
  { name: 'intake_date', label: 'Intake date', type: 'date', default: today },
  { name: 'photo_url', label: 'Main photo', type: 'image', folder: 'dogs', span: 2 },
  { name: 'gallery', label: 'More photos', type: 'images', folder: 'dogs' },
  { name: 'personality', label: 'Personality (one line)', span: 2, placeholder: 'Gentle, loves ear scratches' },
  { name: 'story', label: 'Story', type: 'textarea', rows: 4 },
  { name: 'open_for_virtual_adoption', label: 'Open for virtual adoption', type: 'checkbox', default: true },
];

export const dogColumns = [
  {
    label: 'Dog',
    text: (r) => r.name,
    render: (r) => (
      <Link to={`/admin/dogs/${r.id}`} className="flex items-center gap-3">
        <img src={dogPhoto(r, 120)} onError={onImgError} alt="" className="h-11 w-11 flex-none rounded-lg object-cover" />
        <span className="font-semibold underline-offset-2 hover:underline">{r.name}</span>
      </Link>
    ),
  },
  { label: 'Status', text: (r) => label(DOG_STATUS, r.status), render: (r) => <DogStatus status={r.status} /> },
  { label: 'Sex / age', text: (r) => `${r.sex || ''} ${r.age_years ?? ''}`, render: (r) => <span className="capitalize">{r.sex || '—'} · {ageLabel(r.age_years)}</span> },
  { label: 'Rescued from', key: 'rescued_from_area' },
  { label: 'Spay / neuter', text: (r) => label(SPAY, r.spay_neuter), render: (r) => <Badge tone={r.spay_neuter === 'done' ? 'green' : r.spay_neuter === 'scheduled' ? 'amber' : 'grey'}>{label(SPAY, r.spay_neuter)}</Badge> },
  { label: 'Microchip', key: 'microchip_number' },
  { label: 'Intake', key: 'intake_date', type: 'date', csv: (r) => r.intake_date },
];

const dogName = { label: 'Dog', text: (r) => r.dogs?.name, render: (r) => r.dogs ? <Link to={`/admin/dogs/${r.dog_id}`} className="font-semibold underline">{r.dogs.name}</Link> : '—' };

export const VACC_FIELDS = (withDog = true) => [
  ...(withDog ? [{ name: 'dog_id', label: 'Dog', type: 'dog', required: true }] : []),
  {
    name: 'vaccine', label: 'Vaccine', type: 'select', required: true,
    options: [...VACCINES.map(([v]) => [v, v]), ['Other', 'Other']],
    onChange: (v, f) => ({ next_due_date: f.date_administered ? addMonths(f.date_administered, vaccineMonths(v)) : f.next_due_date }),
  },
  {
    name: 'date_administered', label: 'Date given', type: 'date', required: true, default: today,
    onChange: (v, f) => ({ next_due_date: v ? addMonths(v, vaccineMonths(f.vaccine)) : '' }),
  },
  { name: 'next_due_date', label: 'Next due', type: 'date', hint: 'Filled in automatically — change if the vet advised otherwise' },
  { name: 'administered_by', label: 'Vet' },
  { name: 'batch_number', label: 'Batch / lot no.' },
];
export const vaccColumns = (withDog = true) => [
  ...(withDog ? [dogName] : []),
  { label: 'Vaccine', key: 'vaccine' },
  { label: 'Given', key: 'date_administered', type: 'date', csv: (r) => r.date_administered },
  { label: 'Next due', key: 'next_due_date', csv: (r) => r.next_due_date, render: (r) => <span className="flex flex-wrap items-center gap-2">{fmtDate(r.next_due_date)} <DueBadge date={r.next_due_date} /></span> },
  { label: 'Vet', key: 'administered_by' },
  { label: 'Batch', key: 'batch_number' },
];

export const TREAT_FIELDS = (withDog = true) => [
  ...(withDog ? [{ name: 'dog_id', label: 'Dog', type: 'dog', required: true }] : []),
  { name: 'condition', label: 'Condition / diagnosis', required: true, placeholder: 'e.g. Mange, fracture, parvovirus' },
  { name: 'start_date', label: 'Start date', type: 'date', required: true, default: today },
  { name: 'vet', label: 'Attending vet' },
  { name: 'frequency', label: 'How often', type: 'select', options: FREQUENCY },
  { name: 'medications', label: 'Medicines & dosage', type: 'medications', default: () => [{ name: '', dosage: '' }] },
  { name: 'plan', label: 'Treatment plan', type: 'textarea' },
  { name: 'outcome', label: 'Outcome', type: 'select', options: OUTCOME, default: 'ongoing', required: true },
  { name: 'end_date', label: 'End date', type: 'date', show: (f) => f.outcome !== 'ongoing' },
];
export const treatColumns = (withDog = true) => [
  ...(withDog ? [dogName] : []),
  { label: 'Condition', key: 'condition' },
  { label: 'Started', key: 'start_date', type: 'date', csv: (r) => r.start_date },
  { label: 'Medicines', text: (r) => (r.medications || []).map((m) => `${m.name} ${m.dosage}`).join(', '), render: (r) => <span className="text-ink-500">{(r.medications || []).filter((m) => m.name).map((m) => `${m.name}${m.dosage ? ` ${m.dosage}` : ''}`).join(', ') || '—'}{r.frequency ? ` · ${label(FREQUENCY, r.frequency)}` : ''}</span> },
  { label: 'Vet', key: 'vet' },
  { label: 'Outcome', text: (r) => label(OUTCOME, r.outcome), render: (r) => <Badge tone={r.outcome === 'recovered' ? 'green' : r.outcome === 'ongoing' ? 'amber' : 'grey'}>{label(OUTCOME, r.outcome)}</Badge> },
];

export const DEWORM_FIELDS = (withDog = true) => [
  ...(withDog ? [{ name: 'dog_id', label: 'Dog', type: 'dog', required: true }] : []),
  { name: 'kind', label: 'Type', type: 'select', options: DEWORM_KIND, default: 'deworming', required: true },
  { name: 'date_given', label: 'Date given', type: 'date', required: true, default: today, onChange: (v) => ({ next_due_date: v ? addMonths(v, 3) : '' }) },
  { name: 'next_due_date', label: 'Next due', type: 'date', default: () => addMonths(today(), 3), hint: 'Every 3 months by default' },
  { name: 'medication', label: 'Medicine' },
  { name: 'dosage', label: 'Dose' },
  { name: 'administered_by', label: 'Given by' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
export const dewormColumns = (withDog = true) => [
  ...(withDog ? [dogName] : []),
  { label: 'Type', text: (r) => label(DEWORM_KIND, r.kind), render: (r) => label(DEWORM_KIND, r.kind) },
  { label: 'Given', key: 'date_given', type: 'date', csv: (r) => r.date_given },
  { label: 'Next due', key: 'next_due_date', csv: (r) => r.next_due_date, render: (r) => <span className="flex flex-wrap items-center gap-2">{fmtDate(r.next_due_date)} <DueBadge date={r.next_due_date} /></span> },
  { label: 'Medicine', text: (r) => `${r.medication || ''} ${r.dosage || ''}`, render: (r) => `${r.medication || '—'} ${r.dosage || ''}` },
  { label: 'By', key: 'administered_by' },
];

export const RESCUE_FIELDS = (withDog = true) => [
  ...(withDog
    ? [
        { name: 'dog_id', label: 'Dog', type: 'dog', hint: 'Leave empty and fill “New dog’s name” to create a profile', show: (f) => !f._new_dog_name },
        { name: '_new_dog_name', label: 'New dog’s name', omit: true, show: (f) => !f.dog_id, hint: 'Creates a new dog profile with this rescue' },
      ]
    : []),
  { name: 'rescue_date', label: 'Rescue date', type: 'date', required: true, default: today },
  { name: 'rescue_type', label: 'What happened', type: 'select', options: RESCUE_TYPE, required: true },
  { name: 'intake_condition', label: 'Condition at intake', type: 'select', options: CONDITION, required: true },
  { name: 'rescued_by', label: 'Rescued by' },
  { name: 'location_text', label: 'Exact location', span: 2, placeholder: 'Near the tea stall, Gate 2, Sector 14 market' },
  { name: 'area', label: 'Area / locality', required: true },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  {
    name: 'latitude', label: 'Map pin', type: 'custom',
    render: (f, set) => <MapPicker lat={f.latitude} lng={f.longitude} onChange={set} />,
  },
  { name: 'longitude', label: '', type: 'custom', render: () => null, show: () => false },
  { name: 'photos', label: 'Intake photos', type: 'images', folder: 'rescues' },
  { name: 'notes', label: 'Initial notes', type: 'textarea', placeholder: 'Condition at rescue, injuries, first aid given' },
];
