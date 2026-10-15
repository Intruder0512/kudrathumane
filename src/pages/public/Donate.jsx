import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Soup, Home, Ambulance } from 'lucide-react';
import { insertQuiet, useSettings } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import { inr, today } from '@/lib/format';
import UpiPay from '@/components/UpiPay';
import { Button, Field, Input, LinkButton, useToast, cx } from '@/components/ui';

const PRESETS = [500, 1000, 2500, 5000, 10000];

export default function Donate() {
  const settings = useSettings();
  const { user } = useAuth();
  const toast = useToast();
  const [amount, setAmount] = useState(1000);
  const [form, setForm] = useState({ donor_name: user?.full_name || '', donor_email: user?.email || '', donor_phone: '', donor_pan: '', reference: '', paid_on: today() });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, donor_name: f.donor_name || user.full_name || '', donor_email: f.donor_email || user.email || '', donor_phone: f.donor_phone || user.phone || '' }));
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await insertQuiet('payments', { ...form, purpose: 'donation', amount: Number(amount), method: 'upi', user_id: user?.id || null });
      setSent(true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap pt-12">
      <h1 className="text-5xl font-extrabold">Donate</h1>
      <p className="mt-3 max-w-prose text-lg text-ink-500">
        We’re a newly set up shelter running entirely on donations. One-time gifts pay for emergency rescues and surgeries; monthly support through <Link to="/adopt" className="font-semibold underline">virtual adoption</Link> keeps the shelter running.
      </p>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [Stethoscope, 'Medical care', 'Surgery, X-rays, vaccines and medicines.'],
          [Soup, 'Food', 'Two cooked meals a day for every dog.'],
          [Home, 'Shelter', 'Kennels, bedding and monsoon cover.'],
          [Ambulance, 'Rescue', 'Transport and first aid for emergency calls.'],
        ].map(([Icon, t, d]) => (
          <li key={t} className="border-t-4 border-marigold pt-4">
            <Icon className="h-6 w-6" />
            <p className="mt-2 font-display text-xl font-bold">{t}</p>
            <p className="text-ink-500">{d}</p>
          </li>
        ))}
      </ul>

      <section className="mt-16 grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="text-3xl font-extrabold">Give by UPI</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setAmount(p)} className={cx('rounded-xl px-4 py-2.5 font-display text-lg font-bold ring-2', Number(amount) === p ? 'bg-ink text-white ring-ink' : 'bg-white ring-wall-3')}>{inr(p)}</button>
            ))}
            <label className="flex items-center gap-2 rounded-xl bg-white px-3 ring-2 ring-wall-3">
              <span className="text-sm font-semibold text-ink-400">₹</span>
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-24 py-2.5 font-display text-lg font-bold outline-hidden" aria-label="Amount" />
            </label>
          </div>
          <div className="mt-5"><UpiPay amount={amount} note="Donation to Kudrat Humane" /></div>
        </div>

        <div>
          {sent ? (
            <div className="rounded-2xl bg-neem-50 p-8 text-neem">
              <h2 className="text-3xl font-extrabold text-neem">Thank you</h2>
              <p className="mt-3 text-lg">We’ll match your payment of {inr(amount)} and email your receipt{settings.eighty_g_number ? ' (with 80G details)' : ''}.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-white p-6 ring-1 ring-wall-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <h2 className="text-2xl font-bold">Tell us you’ve paid</h2>
                <p className="mt-1 text-sm text-ink-400">So we can thank you and send a receipt{settings.eighty_g_number ? ' for 80G tax exemption' : ''}.</p>
              </div>
              <Field label="Your name" required><Input value={form.donor_name} onChange={set('donor_name')} required /></Field>
              <Field label="Phone"><Input type="tel" value={form.donor_phone} onChange={set('donor_phone')} /></Field>
              <Field label="Email" className="sm:col-span-2"><Input type="email" value={form.donor_email} onChange={set('donor_email')} /></Field>
              <Field label="UPI transaction ID (UTR)" required><Input value={form.reference} onChange={set('reference')} required minLength={6} /></Field>
              <Field label="Date paid" required><Input type="date" value={form.paid_on} onChange={set('paid_on')} required /></Field>
              {settings.eighty_g_number && <Field label="PAN (for 80G receipt)" className="sm:col-span-2"><Input value={form.donor_pan} onChange={set('donor_pan')} maxLength={10} /></Field>}
              <Button type="submit" loading={busy} className="sm:col-span-2">I’ve donated {inr(amount)}</Button>
            </form>
          )}
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-3xl font-extrabold">Other ways to help</h2>
        <div className="mt-6 grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-display text-xl font-bold">Send supplies</p>
            <p className="mt-1 text-ink-500">Dry dog food, rice, eggs, Betadine, gauze, tick medicine, old blankets and bedsheets. Call before dropping off so we can tell you what’s running low.</p>
            <LinkButton to="/contact" variant="outline" size="sm" className="mt-3">Arrange a drop-off</LinkButton>
          </div>
          <div>
            <p className="font-display text-xl font-bold">Volunteer</p>
            <p className="mt-1 text-ink-500">Walk dogs, help at rescues, drive to the vet, take photos, or help with social media.</p>
            <LinkButton to="/volunteer" variant="outline" size="sm" className="mt-3">Sign up to volunteer</LinkButton>
          </div>
          <div>
            <p className="font-display text-xl font-bold">Spread the word</p>
            <p className="mt-1 text-ink-500">Share a dog’s profile. Most of our adopters found us through a friend’s post.</p>
            <LinkButton to="/dogs" variant="outline" size="sm" className="mt-3">Find a dog to share</LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
