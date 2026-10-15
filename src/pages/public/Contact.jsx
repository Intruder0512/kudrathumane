import { useState } from 'react';
import { Phone, Mail, MapPin, Navigation } from 'lucide-react';
import { insertQuiet, useSettings } from '@/lib/data';
import { Button, Field, Input, Textarea, useToast } from '@/components/ui';

export default function Contact() {
  const s = useSettings();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await insertQuiet('contact_messages', form);
      setSent(true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(s.address || s.map_query || 'Kudrat Humane Living Trust')}&output=embed`;

  return (
    <div className="wrap pt-12">
      <h1 className="text-5xl font-extrabold">Contact & visit</h1>
      <p className="mt-3 max-w-prose text-lg text-ink-500">To report an injured dog, call us — it’s the fastest way. For everything else, send a message and we’ll reply within two days.</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <ul className="space-y-4 text-lg">
            {s.phone && <li className="flex gap-3"><Phone className="mt-1 h-5 w-5 flex-none" /><a href={`tel:${s.phone}`} className="font-semibold underline">{s.phone}</a></li>}
            <li className="flex gap-3"><Mail className="mt-1 h-5 w-5 flex-none" /><a href={`mailto:${s.email || 'info@kudrathumane.org'}`} className="underline">{s.email || 'info@kudrathumane.org'}</a></li>
            {s.address && <li className="flex gap-3"><MapPin className="mt-1 h-5 w-5 flex-none" /><span>{s.address}</span></li>}
          </ul>
          {s.map_link && <a href={s.map_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 font-semibold text-white"><Navigation className="h-4 w-4" /> Get directions</a>}
          {sent ? (
            <div className="rounded-2xl bg-neem-50 p-6 text-neem">
              <p className="font-display text-2xl font-bold">Message sent</p>
              <p className="mt-1">We’ll reply to {form.email || form.phone} soon.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required className="sm:col-span-2"><Input value={form.name} onChange={set('name')} required /></Field>
              <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
              <Field label="Phone"><Input type="tel" value={form.phone} onChange={set('phone')} /></Field>
              <Field label="Message" required className="sm:col-span-2"><Textarea rows={5} value={form.message} onChange={set('message')} required /></Field>
              <Button type="submit" loading={busy} className="sm:col-span-2 sm:justify-self-start">Send message</Button>
            </form>
          )}
        </div>
        <iframe title="Shelter location map" src={mapSrc} className="h-[420px] w-full rounded-[22px] border-0 lg:h-full lg:min-h-[520px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>
    </div>
  );
}
