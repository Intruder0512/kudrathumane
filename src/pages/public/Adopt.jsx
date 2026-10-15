import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { insert, insertQuiet, list, useAsync, useSettings } from '@/lib/data';
import { IN_CARE } from '@/lib/constants';
import { inr, monthStart, today } from '@/lib/format';
import { dogPhoto, onImgError } from '@/lib/images';
import DogTag from '@/components/DogTag';
import AuthBox from '@/components/AuthBox';
import UpiPay from '@/components/UpiPay';
import { Button, Field, Input, LinkButton, Spinner, useToast, cx } from '@/components/ui';

export default function Adopt() {
  const [params, setParams] = useSearchParams();
  const settings = useSettings();
  const { user } = useAuth();
  const toast = useToast();
  const min = Number(settings.min_monthly_amount || 5000);
  const { data: dogs, loading } = useAsync(() => list('dogs', { inValues: { status: IN_CARE }, eq: { open_for_virtual_adoption: true }, order: ['name', true] }).catch(() => []), []);
  const dogId = params.get('dog');
  const dog = useMemo(() => (dogs || []).find((d) => d.id === dogId), [dogs, dogId]);
  const [amount, setAmount] = useState(min);
  const [custom, setCustom] = useState('');
  const [details, setDetails] = useState({ name: '', phone: '' });
  const [pay, setPay] = useState({ reference: '', paid_on: today() });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => setAmount((a) => Math.max(a, min)), [min]);
  useEffect(() => {
    if (user) setDetails((d) => ({ name: d.name || user.full_name, phone: d.phone || user.phone }));
  }, [user]);

  const finalAmount = custom ? Number(custom) : amount;
  const presets = [min, min * 1.5, min * 2, min * 3];

  const submit = async (e) => {
    e.preventDefault();
    if (finalAmount < min) return toast(`The monthly amount starts at ${inr(min)}.`, 'error');
    setBusy(true);
    try {
      const adoption = await insert('virtual_adoptions', {
        dog_id: dog.id,
        user_id: user.id,
        supporter_name: details.name,
        supporter_email: user.email,
        supporter_phone: details.phone,
        monthly_amount: finalAmount,
      });
      await insertQuiet('payments', {
        purpose: 'virtual_adoption',
        virtual_adoption_id: adoption.id,
        user_id: user.id,
        donor_name: details.name,
        donor_email: user.email,
        donor_phone: details.phone,
        amount: finalAmount,
        method: 'upi',
        reference: pay.reference,
        paid_on: pay.paid_on,
        for_month: monthStart(),
      });
      setDone(true);
      window.scrollTo(0, 0);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <div className="wrap max-w-2xl py-20">
        <DogTag name={dog.name} size="lg" />
        <h1 className="mt-6 text-4xl font-extrabold">Thank you, {details.name.split(' ')[0]}.</h1>
        <p className="mt-4 text-lg text-ink-500">
          We’ve received your details for {inr(finalAmount)} a month. Once we match your UPI payment (usually within two days), {dog.name}’s adoption becomes active and your certificate appears in your account.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton to="/account">Go to my account</LinkButton>
          <LinkButton to={`/dogs/${dog.id}`} variant="outline">Back to {dog.name}</LinkButton>
        </div>
      </div>
    );

  return (
    <div className="wrap pt-12">
      <h1 className="text-5xl font-extrabold">Virtually adopt a dog</h1>
      <p className="mt-3 max-w-prose text-lg text-ink-500">
        Your dog stays safe at the shelter. Your monthly gift pays for their food, medicine and vet care, and you get a certificate and updates on how they’re doing.
      </p>

      <ol className="mt-10 space-y-12">
        {/* Step 1 */}
        <Step n={1} title="Choose a dog" done={!!dog}>
          {loading ? <Spinner /> : dog ? (
            <div className="flex flex-wrap items-center gap-4">
              <img src={dogPhoto(dog, 300)} onError={onImgError} alt="" className="h-20 w-20 rounded-2xl object-cover" />
              <DogTag name={dog.name} />
              <button className="text-sm font-semibold underline" onClick={() => setParams({})}>Choose another dog</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {(dogs || []).map((d) => (
                <button key={d.id} onClick={() => setParams({ dog: d.id })} className="group text-left">
                  <div className="aspect-square overflow-hidden rounded-2xl bg-wall-2 ring-2 ring-transparent group-hover:ring-marigold">
                    <img src={dogPhoto(d, 400)} onError={onImgError} alt="" className="h-full w-full object-cover" />
                  </div>
                  <span className="mt-2 block font-display text-lg font-bold">{d.name}</span>
                  <span className="text-sm text-ink-400">{d.rescued_from_area}</span>
                </button>
              ))}
              {dogs?.length === 0 && <p className="text-ink-400">No dogs are open for virtual adoption right now.</p>}
            </div>
          )}
        </Step>

        {/* Step 2 */}
        <Step n={2} title="Pick a monthly amount" active={!!dog}>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button key={p} type="button" onClick={() => { setAmount(p); setCustom(''); }}
                className={cx('rounded-xl px-5 py-3 font-display text-lg font-bold ring-2', !custom && amount === p ? 'bg-ink text-white ring-ink' : 'bg-white ring-wall-3 hover:ring-ink-300')}>
                {inr(p)}
              </button>
            ))}
            <label className="flex items-center gap-2 rounded-xl bg-white px-3 ring-2 ring-wall-3">
              <span className="text-sm font-semibold text-ink-400">Other ₹</span>
              <input type="number" min={min} step="100" value={custom} onChange={(e) => setCustom(e.target.value)} className="w-28 py-3 font-display text-lg font-bold outline-hidden" placeholder={String(min)} aria-label="Custom monthly amount" />
            </label>
          </div>
          <p className="hint">Minimum {inr(min)} a month. You can stop any time from your account.</p>
        </Step>

        {/* Step 3 */}
        <Step n={3} title="Your account" active={!!dog} done={!!user}>
          {user ? (
            <div className="grid max-w-xl gap-4 sm:grid-cols-2">
              <Field label="Name on certificate" required><Input value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} required /></Field>
              <Field label="Phone"><Input type="tel" value={details.phone || ''} onChange={(e) => setDetails({ ...details, phone: e.target.value })} /></Field>
              <p className="text-sm text-ink-400 sm:col-span-2">Logged in as {user.email}.</p>
            </div>
          ) : (
            <div className="max-w-md">
              <p className="mb-4 text-ink-500">An account lets you see your payments and download your certificate.</p>
              <AuthBox initialMode="signup" compact />
            </div>
          )}
        </Step>

        {/* Step 4 */}
        <Step n={4} title="Pay the first month" active={!!dog && !!user}>
          {dog && user && (
            <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <UpiPay amount={finalAmount} note={`Virtual adoption ${dog.name}`} />
              <div className="space-y-4">
                <Field label="UPI transaction ID (UTR)" required hint="12 digits, shown in your UPI app after paying">
                  <Input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} required minLength={6} />
                </Field>
                <Field label="Date paid" required><Input type="date" value={pay.paid_on} onChange={(e) => setPay({ ...pay, paid_on: e.target.value })} required /></Field>
                <Button type="submit" size="lg" loading={busy} className="w-full">Confirm adoption of {dog.name}</Button>
                <p className="text-sm text-ink-400">By confirming, you agree to give {inr(finalAmount)} each month until you cancel.</p>
              </div>
            </form>
          )}
        </Step>
      </ol>
      <p className="mt-12 text-sm text-ink-400">Questions? <Link to="/contact" className="underline">Talk to us</Link>.</p>
    </div>
  );
}

function Step({ n, title, children, active = true, done }) {
  return (
    <li className={cx('grid gap-4 sm:grid-cols-[56px_1fr]', !active && 'opacity-40')} aria-disabled={!active}>
      <span className={cx('flex h-11 w-11 items-center justify-center rounded-full font-display text-lg font-extrabold', done ? 'bg-neem text-white' : 'bg-marigold text-ink')}>
        {done ? <Check className="h-5 w-5" /> : n}
      </span>
      <div>
        <h2 className="mb-4 text-2xl font-bold">{title}</h2>
        {active ? children : null}
      </div>
    </li>
  );
}
