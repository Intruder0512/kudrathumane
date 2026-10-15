import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { insert, insertQuiet, list, update, useAsync, useSettings } from '@/lib/data';
import { ADOPTION_STATUS, APPLICATION_STATUS, MOOD, PAYMENT_STATUS, label } from '@/lib/constants';
import { fmtDate, inr, monthStart, today } from '@/lib/format';
import { dogPhoto, onImgError } from '@/lib/images';
import { adoptionCertificate, donationReceipt } from '@/lib/pdf';
import DogTag from '@/components/DogTag';
import UpiPay from '@/components/UpiPay';
import ImageUpload from '@/components/ImageUpload';
import { Badge, Button, Empty, Field, Input, LinkButton, Modal, Select, Spinner, Textarea, useToast } from '@/components/ui';

export default function Account() {
  const { user, ready, signOut, refresh, isStaff } = useAuth();
  const { data, loading, reload } = useAsync(async () => {
    if (!user) return null;
    const [adoptions, payments, placements, applications] = await Promise.all([
      list('virtual_adoptions', { select: '*, dogs(*)', eq: { user_id: user.id }, order: ['created_at', false] }),
      list('payments', { eq: { user_id: user.id }, order: ['paid_on', false] }),
      list('foster_placements', { select: '*, dogs(*)', eq: { foster_user_id: user.id }, order: ['start_date', false] }),
      list('foster_applications', { eq: { user_id: user.id }, order: ['created_at', false] }),
    ]);
    return { adoptions, payments, placements, applications };
  }, [user?.id]);

  if (!ready) return <Spinner />;
  if (!user) return <Navigate to="/login?next=/account" replace />;

  return (
    <div className="wrap pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-extrabold">Hello, {user.full_name?.split(' ')[0] || 'friend'}</h1>
          <p className="mt-2 text-ink-500">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {isStaff && <LinkButton to="/admin" variant="dark">Open admin</LinkButton>}
          <Button variant="ghost" onClick={signOut}>Log out</Button>
        </div>
      </div>

      {loading || !data ? <Spinner /> : (
        <div className="mt-12 space-y-16">
          {data.placements.length > 0 && <FosterPortal placements={data.placements} />}

          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-3xl font-extrabold">Your virtual adoptions</h2>
              <LinkButton to="/adopt" size="sm"><Plus className="h-4 w-4" /> Adopt another dog</LinkButton>
            </div>
            {data.adoptions.length === 0 ? (
              <div className="mt-6"><Empty title="No adoptions yet" action={<LinkButton to="/adopt">Choose a dog</LinkButton>}>Pick a dog and pay for their care each month.</Empty></div>
            ) : (
              <div className="mt-6 space-y-6">
                {data.adoptions.map((a) => (
                  <AdoptionCard key={a.id} a={a} payments={data.payments.filter((p) => p.virtual_adoption_id === a.id)} user={user} onChange={reload} />
                ))}
              </div>
            )}
          </section>

          <Donations payments={data.payments.filter((p) => p.purpose === 'donation')} />

          {data.applications.length > 0 && (
            <section>
              <h2 className="text-3xl font-extrabold">Foster applications</h2>
              <ul className="mt-4 space-y-2">
                {data.applications.map((ap) => (
                  <li key={ap.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-wall-3">
                    <span>Sent {fmtDate(ap.created_at)}</span>
                    <Badge tone={ap.status === 'approved' ? 'green' : ap.status === 'rejected' ? 'grey' : 'amber'}>{label(APPLICATION_STATUS, ap.status)}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Profile user={user} onSaved={refresh} />
        </div>
      )}
    </div>
  );
}

function AdoptionCard({ a, payments, user, onChange }) {
  const settings = useSettings();
  const toast = useToast();
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [ref, setRef] = useState({ reference: '', paid_on: today() });
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const dog = a.dogs || { name: 'Your dog' };
  const thisMonth = payments.find((p) => p.for_month === monthStart() && p.status !== 'failed');

  const recordPayment = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await insertQuiet('payments', {
        purpose: 'virtual_adoption', virtual_adoption_id: a.id, user_id: user.id, donor_name: a.supporter_name,
        donor_email: user.email, amount: a.monthly_amount, method: 'upi', reference: ref.reference, paid_on: ref.paid_on, for_month: monthStart(),
      });
      toast('Payment sent for checking');
      setPaying(false);
      onChange();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const cancel = async () => {
    setBusy(true);
    try {
      await update('virtual_adoptions', a.id, { status: 'cancelled', cancel_reason: reason });
      toast('Adoption cancelled');
      setCancelling(false);
      onChange();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="grid gap-6 rounded-[22px] bg-white p-5 ring-1 ring-wall-3 md:grid-cols-[180px_1fr]">
      <img src={dogPhoto(dog, 400)} onError={onImgError} alt="" className="aspect-square w-full rounded-2xl object-cover" />
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <DogTag name={dog.name} />
          <Badge tone={a.status === 'active' ? 'green' : a.status === 'pending' ? 'amber' : 'grey'}>{label(ADOPTION_STATUS, a.status)}</Badge>
        </div>
        <p className="mt-3 text-ink-500">{inr(a.monthly_amount)} a month since {fmtDate(a.start_date)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {a.status === 'active' && (
            <Button size="sm" variant="soft" onClick={() => adoptionCertificate({ adoption: a, dog, settings, number: `KHLT-VA-${a.id.slice(0, 8).toUpperCase()}` })}>
              <Download className="h-4 w-4" /> Adoption certificate
            </Button>
          )}
          {['active', 'pending'].includes(a.status) && !thisMonth && <Button size="sm" onClick={() => setPaying(true)}>Pay this month</Button>}
          {['active', 'pending'].includes(a.status) && <Button size="sm" variant="ghost" onClick={() => setCancelling(true)}>Stop monthly support</Button>}
          {dog.id && <Link to={`/dogs/${dog.id}`} className="self-center text-sm font-semibold underline">See {dog.name}’s profile</Link>}
        </div>
        {payments.length > 0 && (
          <div className="table-wrap mt-5">
            <table className="table">
              <thead><tr><th>Month</th><th>Paid on</th><th>Amount</th><th>UTR</th><th>Status</th></tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.for_month ? fmtDate(p.for_month, { month: 'short', year: 'numeric' }) : '—'}</td>
                    <td>{fmtDate(p.paid_on)}</td>
                    <td>{inr(p.amount)}</td>
                    <td className="font-mono text-xs">{p.reference || '—'}</td>
                    <td><Badge tone={p.status === 'completed' ? 'green' : p.status === 'failed' ? 'red' : 'amber'}>{label(PAYMENT_STATUS, p.status)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={paying} onClose={() => setPaying(false)} title={`Pay for ${dog.name} this month`} wide>
        <form onSubmit={recordPayment} className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <UpiPay amount={a.monthly_amount} note={`Virtual adoption ${dog.name}`} />
          <div className="space-y-4">
            <Field label="UPI transaction ID (UTR)" required><Input value={ref.reference} onChange={(e) => setRef({ ...ref, reference: e.target.value })} required minLength={6} /></Field>
            <Field label="Date paid" required><Input type="date" value={ref.paid_on} onChange={(e) => setRef({ ...ref, paid_on: e.target.value })} required /></Field>
            <Button type="submit" loading={busy} className="w-full">Send payment details</Button>
          </div>
        </form>
      </Modal>
      <Modal open={cancelling} onClose={() => setCancelling(false)} title="Stop monthly support?"
        footer={<><Button variant="ghost" onClick={() => setCancelling(false)}>Keep supporting</Button><Button variant="danger" loading={busy} onClick={cancel}>Stop support</Button></>}>
        <p className="text-ink-500">{dog.name} will stay safe at the shelter. Telling us why helps us improve.</p>
        <Field label="Reason (optional)" className="mt-4"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Modal>
    </article>
  );
}

function Donations({ payments }) {
  const settings = useSettings();
  if (!payments.length) return null;
  return (
    <section>
      <h2 className="text-3xl font-extrabold">Your donations</h2>
      <div className="table-wrap mt-4">
        <table className="table">
          <thead><tr><th>Date</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{fmtDate(p.paid_on)}</td>
                <td>{inr(p.amount)}</td>
                <td><Badge tone={p.status === 'completed' ? 'green' : p.status === 'failed' ? 'red' : 'amber'}>{label(PAYMENT_STATUS, p.status)}</Badge></td>
                <td>{p.status === 'completed' ? (
                  <button className="inline-flex items-center gap-1 font-semibold underline" onClick={() => donationReceipt({ payment: p, settings, number: p.receipt_number || `KHLT-${p.id.slice(0, 8).toUpperCase()}` })}>
                    <Download className="h-4 w-4" /> Download
                  </button>
                ) : 'After we confirm'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FosterPortal({ placements }) {
  const active = placements.filter((p) => p.status === 'active');
  return (
    <section>
      <h2 className="text-3xl font-extrabold">Foster portal</h2>
      <p className="mt-1 text-ink-500">Post a short update every day — weight, mood and a photo help our vet track recovery.</p>
      <div className="mt-6 space-y-8">
        {(active.length ? active : placements).map((p) => <Placement key={p.id} p={p} />)}
      </div>
    </section>
  );
}

function Placement({ p }) {
  const toast = useToast();
  const dog = p.dogs || { name: 'Your foster dog' };
  const { data: updates, reload } = useAsync(() => list('foster_updates', { eq: { placement_id: p.id }, order: ['update_date', false] }), [p.id]);
  const blank = { update_date: today(), weight_kg: '', mood: 'calm', eating: '', health_notes: '', behaviour_notes: '', photos: [] };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await insert('foster_updates', { ...form, placement_id: p.id });
      toast('Update posted');
      setForm(blank);
      reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <div className="flex items-center gap-4">
          <img src={dogPhoto(dog, 300)} onError={onImgError} alt="" className="h-20 w-20 rounded-2xl object-cover" />
          <div>
            <DogTag name={dog.name} />
            <p className="mt-1 text-sm text-ink-400">With you since {fmtDate(p.start_date)}{p.expected_end_date ? ` · until about ${fmtDate(p.expected_end_date)}` : ''}</p>
          </div>
        </div>
        {p.care_instructions && <div className="mt-4 rounded-xl bg-marigold-50 p-4 text-sm"><p className="font-semibold">Care instructions</p><p className="mt-1 whitespace-pre-line">{p.care_instructions}</p></div>}
        {p.status === 'active' && (
          <form onSubmit={submit} className="mt-6 grid gap-3 sm:grid-cols-2">
            <Field label="Date"><Input type="date" value={form.update_date} onChange={set('update_date')} required /></Field>
            <Field label="Weight (kg)"><Input type="number" step="0.1" value={form.weight_kg} onChange={set('weight_kg')} /></Field>
            <Field label="Mood"><Select value={form.mood} onChange={set('mood')} options={MOOD} /></Field>
            <Field label="Eating"><Input value={form.eating} onChange={set('eating')} placeholder="e.g. finished both meals" /></Field>
            <Field label="Health" className="sm:col-span-2"><Textarea value={form.health_notes} onChange={set('health_notes')} placeholder="Wounds, limping, stools, medicines given" /></Field>
            <Field label="Behaviour" className="sm:col-span-2"><Textarea value={form.behaviour_notes} onChange={set('behaviour_notes')} placeholder="Play, sleep, how they get on with people" /></Field>
            <div className="sm:col-span-2"><ImageUpload multiple value={form.photos} onChange={(photos) => setForm({ ...form, photos })} folder="foster-updates" label="Add photos" /></div>
            <Button type="submit" loading={busy} className="sm:col-span-2">Post update</Button>
          </form>
        )}
      </div>
      <div>
        <h3 className="text-xl font-bold">Updates</h3>
        {!updates?.length ? <p className="mt-2 text-ink-400">No updates yet.</p> : (
          <ol className="mt-4 space-y-4 border-l-2 border-wall-3 pl-5">
            {updates.map((u) => (
              <li key={u.id} className="relative">
                <span className="absolute left-[-27px] top-1.5 h-3 w-3 rounded-full bg-marigold ring-4 ring-wall" />
                <p className="text-sm font-semibold">{fmtDate(u.update_date)} · {label(MOOD, u.mood)}{u.weight_kg ? ` · ${u.weight_kg} kg` : ''}</p>
                {u.eating && <p className="text-sm text-ink-500">Eating: {u.eating}</p>}
                {u.health_notes && <p className="text-sm text-ink-500">{u.health_notes}</p>}
                {u.behaviour_notes && <p className="text-sm text-ink-500">{u.behaviour_notes}</p>}
                {u.photos?.length > 0 && <div className="mt-2 flex gap-2">{u.photos.map((ph) => <img key={ph} src={ph} alt="" className="h-16 w-16 rounded-lg object-cover" />)}</div>}
                {u.admin_comment && <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-sm"><span className="font-semibold">Shelter: </span>{u.admin_comment}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function Profile({ user, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ full_name: user.full_name || '', phone: user.phone || '', address: user.address || '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await update('profiles', user.id, form);
      await onSaved();
      toast('Details saved');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="max-w-xl">
      <h2 className="text-3xl font-extrabold">Your details</h2>
      <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Name"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
        <Field label="Phone"><Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Address" className="sm:col-span-2"><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        <Button type="submit" variant="dark" loading={busy} className="sm:justify-self-start">Save details</Button>
      </form>
    </section>
  );
}
