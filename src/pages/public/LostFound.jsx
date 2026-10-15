import { useMemo, useState } from 'react';
import { Phone } from 'lucide-react';
import { insertQuiet, list, uploadFile, useAsync } from '@/lib/data';
import { fmtDate, inr, today } from '@/lib/format';
import { LF_STATUS, label } from '@/lib/constants';
import { onImgError, PLACEHOLDER } from '@/lib/images';
import { Badge, Button, Field, Input, Modal, Spinner, Empty, Textarea, useToast, cx } from '@/components/ui';

export default function LostFound() {
  const { data, loading } = useAsync(() => list('lost_found_reports', { order: ['seen_on', false] }).catch(() => []), []);
  const [kind, setKind] = useState('found');
  const [area, setArea] = useState('');
  const [reporting, setReporting] = useState(null);
  const rows = useMemo(() => (data || []).filter((r) => r.kind === kind && (!area || `${r.area} ${r.city}`.toLowerCase().includes(area.toLowerCase()))), [data, kind, area]);

  return (
    <div className="wrap pt-12">
      <h1 className="text-5xl font-extrabold">Lost & found dogs</h1>
      <p className="mt-3 max-w-prose text-lg text-ink-500">Found a dog that looks like someone’s pet, or lost your own? Post it here. We check every report before it goes up, and match lost and found dogs by area and description.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => setReporting('found')}>I found a dog</Button>
        <Button variant="outline" onClick={() => setReporting('lost')}>I lost my dog</Button>
      </div>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1" role="tablist">
          {[['found', 'Found dogs'], ['lost', 'Lost dogs']].map(([v, l]) => (
            <button key={v} role="tab" aria-selected={kind === v} onClick={() => setKind(v)} className={cx('rounded-full px-4 py-2 text-sm font-semibold', kind === v ? 'bg-ink text-white' : 'bg-white text-ink-500')}>{l}</button>
          ))}
        </div>
        <input className="input sm:w-64" placeholder="Filter by area or city" value={area} onChange={(e) => setArea(e.target.value)} aria-label="Filter by area" />
      </div>

      <div className="mt-8">
        {loading ? <Spinner /> : rows.length === 0 ? (
          <Empty title={`No ${kind} dogs posted${area ? ' in this area' : ''}`}>New reports show up here once we’ve checked them.</Empty>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <article key={r.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-wall-3">
                <img src={r.photo_url || PLACEHOLDER} onError={onImgError} alt={r.dog_description} className="aspect-4/3 w-full object-cover" loading="lazy" />
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={r.kind === 'lost' ? 'red' : 'green'}>{r.kind === 'lost' ? 'Lost' : 'Found'} {fmtDate(r.seen_on)}</Badge>
                    {r.status !== 'open' && <Badge tone="ink">{label(LF_STATUS, r.status)}</Badge>}
                  </div>
                  <p className="mt-3 font-display text-lg font-bold">{r.area}{r.city ? `, ${r.city}` : ''}</p>
                  <p className="mt-1 text-ink-500">{r.dog_description}</p>
                  {r.reward > 0 && <p className="mt-2 text-sm font-semibold">Reward {inr(r.reward)}</p>}
                  <a href={`tel:${r.reporter_phone}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline">
                    <Phone className="h-4 w-4" /> {r.kind === 'lost' ? 'I’ve seen this dog' : 'This might be my dog'} — call {r.reporter_name}
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <ReportForm kind={reporting} onClose={() => setReporting(null)} />
    </div>
  );
}

function ReportForm({ kind, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ dog_description: '', colour: '', area: '', city: '', seen_on: today(), reporter_name: '', reporter_phone: '', reporter_email: '', reward: '' });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const close = () => {
    setSent(false);
    onClose();
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const photo_url = file ? await uploadFile(file, 'lost-found') : null;
      await insertQuiet('lost_found_reports', { ...form, kind, photo_url, reward: form.reward || null });
      setSent(true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={!!kind} onClose={close} title={kind === 'lost' ? 'Report a lost dog' : 'Report a found dog'} wide>
      {sent ? (
        <div className="py-6 text-center">
          <p className="font-display text-2xl font-bold">Report sent</p>
          <p className="mt-2 text-ink-500">We’ll check it and post it within a day. If it matches another report, we’ll call you.</p>
          <Button className="mt-6" onClick={close}>Done</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Describe the dog" required className="sm:col-span-2"><Textarea value={form.dog_description} onChange={set('dog_description')} required placeholder="Size, colour, collar, injuries, how they behave" /></Field>
          <Field label="Colour"><Input value={form.colour} onChange={set('colour')} /></Field>
          <Field label={kind === 'lost' ? 'Date lost' : 'Date found'} required><Input type="date" value={form.seen_on} onChange={set('seen_on')} required /></Field>
          <Field label="Area / locality" required><Input value={form.area} onChange={set('area')} required placeholder="e.g. Sector 50" /></Field>
          <Field label="City"><Input value={form.city} onChange={set('city')} placeholder="e.g. Noida" /></Field>
          <Field label="Photo" className="sm:col-span-2"><input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" /></Field>
          <Field label="Your name" required><Input value={form.reporter_name} onChange={set('reporter_name')} required /></Field>
          <Field label="Your phone" required hint="Shown on the post so people can call you"><Input type="tel" value={form.reporter_phone} onChange={set('reporter_phone')} required /></Field>
          <Field label="Email"><Input type="email" value={form.reporter_email} onChange={set('reporter_email')} /></Field>
          {kind === 'lost' && <Field label="Reward (₹, optional)"><Input type="number" min="0" value={form.reward} onChange={set('reward')} /></Field>}
          <Button type="submit" loading={busy} className="sm:col-span-2">Send report</Button>
        </form>
      )}
    </Modal>
  );
}
