import { useEffect, useState } from 'react';
import { insertQuiet } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import { stock, onImgError } from '@/lib/images';
import { Button, Checkbox, Field, Input, Select, Textarea, useToast } from '@/components/ui';

const STEPS = [
  ['Apply', 'Fill in the form below. It takes about five minutes.'],
  ['We call you', 'We talk about your home, routine and what kind of dog would settle well.'],
  ['Home visit', 'A short visit to check the space is safe — no fancy setup needed.'],
  ['Your foster dog arrives', 'We bring the dog, food and medicines, and add you to the foster portal.'],
  ['Daily updates', 'Log weight, mood and photos from your phone. We’re a call away for anything.'],
];

export default function Foster() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.full_name || '', email: user?.email || '', phone: user?.phone || '', address: '', city: '', home_type: '', has_other_pets: false, experience: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  // Fill in the logged-in person's details once their login has loaded
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: f.name || user.full_name || '', email: f.email || user.email || '', phone: f.phone || user.phone || '' }));
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await insertQuiet('foster_applications', { ...form, user_id: user?.id || null });
      setSent(true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap pt-12">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <h1 className="text-5xl font-extrabold">Foster a dog at home</h1>
          <p className="mt-4 max-w-prose text-lg text-ink-500">
            Some dogs heal faster away from kennel noise. Fostering means giving one of them a quiet corner of your home while they recover or wait for a family. We pay for food and vet care.
          </p>
        </div>
        <img src={stock(3, 900)} onError={onImgError} alt="An Indie dog relaxing at home" className="aspect-[4/3] w-full rounded-[28px] object-cover" />
      </div>

      <section className="mt-16 grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-extrabold">How fostering works</h2>
          <ol className="mt-6 space-y-5">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-ink font-display font-bold text-white">{i + 1}</span>
                <div>
                  <p className="font-display text-lg font-bold">{t}</p>
                  <p className="text-ink-500">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <h2 className="mt-12 text-3xl font-extrabold">Who can foster</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-500">
            <li>You’re 21 or older and live in Delhi NCR.</li>
            <li>Everyone at home — and your landlord, if you rent — is happy to have a dog.</li>
            <li>Someone is home for most of the day, or can be for the first two weeks.</li>
            <li>You can bring the dog to the vet when we ask (we pay).</li>
          </ul>
        </div>

        <div>
          {sent ? (
            <div className="rounded-2xl bg-neem-50 p-8 text-neem">
              <h2 className="text-3xl font-extrabold text-neem">Application received</h2>
              <p className="mt-3 text-lg">Thank you, {form.name.split(' ')[0]}. We’ll call you on {form.phone} within a few days.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-white p-6 ring-1 ring-wall-3 sm:grid-cols-2">
              <h2 className="text-2xl font-bold sm:col-span-2">Apply to foster</h2>
              <Field label="Full name" required><Input value={form.name} onChange={set('name')} required /></Field>
              <Field label="Phone" required><Input type="tel" value={form.phone} onChange={set('phone')} required /></Field>
              <Field label="Email" required className="sm:col-span-2"><Input type="email" value={form.email} onChange={set('email')} required /></Field>
              <Field label="Address" className="sm:col-span-2"><Input value={form.address} onChange={set('address')} /></Field>
              <Field label="City"><Input value={form.city} onChange={set('city')} /></Field>
              <Field label="Home">
                <Select value={form.home_type} onChange={set('home_type')} placeholder="Choose" options={[['Apartment', 'Apartment'], ['Independent house', 'Independent house'], ['House with yard', 'House with yard'], ['Farm', 'Farm']]} />
              </Field>
              <Checkbox className="sm:col-span-2" label="I have other pets" checked={form.has_other_pets} onChange={set('has_other_pets')} />
              <Field label="Experience with dogs" className="sm:col-span-2"><Textarea value={form.experience} onChange={set('experience')} placeholder="Have you had dogs before? Cared for an injured animal?" /></Field>
              <Field label="Anything else?" className="sm:col-span-2"><Textarea value={form.message} onChange={set('message')} /></Field>
              <Button type="submit" loading={busy} className="sm:col-span-2">Send application</Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
