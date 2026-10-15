import { useState } from 'react';
import { insertQuiet } from '@/lib/data';
import { Button, Field, Input, Textarea, useToast } from '@/components/ui';

const ROLES = ['Walking & socialising dogs', 'Cleaning & feeding', 'Rescue calls & transport', 'Vet visits', 'Photography & social media', 'Fundraising & events'];

export default function Volunteer() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '', availability: '', message: '' });
  const [skills, setSkills] = useState([]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggle = (s) => setSkills((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await insertQuiet('volunteers', { ...form, skills: skills.join(', '), status: 'new' });
      setSent(true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap max-w-3xl pt-12">
      <h1 className="text-5xl font-extrabold">Volunteer with us</h1>
      <p className="mt-3 text-lg text-ink-500">A few hours a week makes a real difference. Tell us what you’d like to do and when you’re free.</p>
      {sent ? (
        <div className="mt-10 rounded-2xl bg-neem-50 p-8 text-neem">
          <h2 className="text-3xl font-extrabold text-neem">Thanks for signing up</h2>
          <p className="mt-2 text-lg">We’ll get in touch to plan your first visit.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-10 grid gap-4 sm:grid-cols-2">
          <Field label="Name" required><Input value={form.name} onChange={set('name')} required /></Field>
          <Field label="Phone" required><Input type="tel" value={form.phone} onChange={set('phone')} required /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
          <Field label="Where do you live?"><Input value={form.location} onChange={set('location')} placeholder="Area, city" /></Field>
          <fieldset className="sm:col-span-2">
            <legend className="label">What would you like to help with?</legend>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button type="button" key={r} onClick={() => toggle(r)} aria-pressed={skills.includes(r)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ring-2 ${skills.includes(r) ? 'bg-ink text-white ring-ink' : 'bg-white ring-wall-3'}`}>{r}</button>
              ))}
            </div>
          </fieldset>
          <Field label="When are you free?" className="sm:col-span-2"><Input value={form.availability} onChange={set('availability')} placeholder="e.g. Saturday mornings, weekday evenings" /></Field>
          <Field label="Anything else?" className="sm:col-span-2"><Textarea value={form.message} onChange={set('message')} /></Field>
          <Button type="submit" loading={busy} size="lg" className="sm:col-span-2 sm:justify-self-start">Sign up to volunteer</Button>
        </form>
      )}
    </div>
  );
}
