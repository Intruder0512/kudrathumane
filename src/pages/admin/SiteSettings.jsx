import { useEffect, useState } from 'react';
import { PageTitle, AdminOnly } from '@/layouts/AdminLayout';
import { clearSettingsCache, getSettings, update } from '@/lib/data';
import { Button, Field, Input, Spinner, Textarea, useToast } from '@/components/ui';

const GROUPS = [
  ['Trust details', [
    ['trust_name', 'Trust name'], ['founder_name', 'Founder'], ['registration_number', 'Trust registration no.'],
    ['pan', 'Trust PAN'], ['eighty_g_number', '80G registration no.', 'Shown on donation receipts. Leave empty if not registered yet.'],
  ]],
  ['Contact', [
    ['phone', 'Phone'], ['email', 'Email'], ['address', 'Shelter address', 'Used for the map on the contact page', true],
    ['map_link', 'Google Maps link', 'The “Get directions” button'], ['instagram_url', 'Instagram link'], ['facebook_url', 'Facebook link'],
  ]],
  ['Payments', [
    ['upi_id', 'UPI ID', 'e.g. kudrattrust@okaxis — creates QR codes with the amount filled in'],
    ['upi_payee_name', 'UPI payee name'],
    ['min_monthly_amount', 'Minimum monthly virtual adoption (₹)'],
  ]],
  ['Home page', [
    ['rescued_offset', 'Dogs rescued before this website', 'Added to the “dogs rescued” count on the home page'],
  ]],
];

export default function SiteSettings() {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getSettings(true).then(setForm);
  }, []);
  if (!form) return <Spinner />;
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { id, updated_at, featured_dog_id, ...rest } = form;
      for (const k of ['min_monthly_amount', 'rescued_offset']) rest[k] = rest[k] === '' || rest[k] === null ? 0 : Number(rest[k]);
      await update('settings', 1, { ...rest, updated_at: new Date().toISOString() });
      clearSettingsCache();
      toast('Settings saved');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <AdminOnly>
      <PageTitle title="Site settings">Details shown on the website, receipts and certificates.</PageTitle>
      <form onSubmit={save} className="max-w-3xl space-y-10">
        {GROUPS.map(([g, fields]) => (
          <fieldset key={g}>
            <legend className="mb-4 text-xl font-bold">{g}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map(([k, l, hint, long]) => (
                <Field key={k} label={l} hint={hint} className={long ? 'sm:col-span-2' : ''}>
                  {long ? <Textarea value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /> : <Input value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />}
                </Field>
              ))}
            </div>
          </fieldset>
        ))}
        <Button type="submit" loading={busy} size="lg">Save settings</Button>
      </form>
    </AdminOnly>
  );
}
