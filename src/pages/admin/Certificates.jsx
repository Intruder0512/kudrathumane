import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Download } from 'lucide-react';
import { PageTitle } from '@/layouts/AdminLayout';
import ResourceManager from '@/components/ResourceManager';
import { getSettings, insert, list, useAsync } from '@/lib/data';
import { addDays, daysUntil, fmtDate, inr, today } from '@/lib/format';
import { adoptionCertificate } from '@/lib/pdf';
import { Button, Spinner, useToast } from '@/components/ui';

async function nextNumber(kind) {
  const prefix = { adoption: 'KHLT/AC', anniversary: 'KHLT/AN' }[kind];
  const year = new Date().getFullYear();
  const rows = await list('certificates', { select: 'number', eq: { kind } });
  const n = rows.map((r) => r.number).filter((x) => x.startsWith(`${prefix}/${year}/`)).length + 1;
  return `${prefix}/${year}/${String(n).padStart(3, '0')}`;
}

// Next anniversary date of an adoption
const nextAnniversary = (start) => {
  const s = new Date(`${start}T00:00:00`);
  const now = new Date(`${today()}T00:00:00`);
  let a = new Date(now.getFullYear(), s.getMonth(), s.getDate());
  if (a < now) a = new Date(now.getFullYear() + 1, s.getMonth(), s.getDate());
  return a;
};

export default function Certificates() {
  const toast = useToast();
  const [logKey, setLogKey] = useState(0);
  const { data, loading } = useAsync(() => list('virtual_adoptions', { select: '*, dogs(*)', eq: { status: 'active' }, order: ['start_date', true] }), []);

  const issue = async (a, anniversary) => {
    try {
      const kind = anniversary ? 'anniversary' : 'adoption';
      const number = await nextNumber(kind);
      await adoptionCertificate({ adoption: a, dog: a.dogs, settings: await getSettings(), number, anniversary });
      await insert('certificates', { kind, number, dog_id: a.dog_id, virtual_adoption_id: a.id, recipient_name: a.supporter_name, recipient_email: a.supporter_email, amount: a.monthly_amount });
      setLogKey((k) => k + 1);
      toast(`Certificate ${number} downloaded — attach it to an email to ${a.supporter_email || a.supporter_name}`);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const upcoming = (data || []).filter((a) => a.start_date <= addDays(today(), -300)).map((a) => ({ a, on: nextAnniversary(a.start_date) })).filter((x) => daysUntil(x.on) <= 30);

  return (
    <div>
      <PageTitle title="Certificates & receipts">Download adoption and anniversary certificates for active virtual adopters. Donation receipts (80G when registered) are on the payments page and in each donor’s account.</PageTitle>

      {upcoming.length > 0 && (
        <section className="mb-8 rounded-2xl bg-marigold-50 p-5">
          <h2 className="text-lg font-bold">Adoption anniversaries in the next 30 days</h2>
          <ul className="mt-3 space-y-2">
            {upcoming.map(({ a, on }) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2">
                <span><b>{a.supporter_name}</b> & {a.dogs?.name} — {fmtDate(on)}</span>
                <Button size="sm" onClick={() => issue(a, true)}><Award className="h-4 w-4" /> Anniversary certificate</Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="text-xl font-bold">Active virtual adopters</h2>
      {loading ? <Spinner /> : !data?.length ? <p className="mt-2 text-ink-400">No active adoptions yet. <Link to="/admin/adoptions" className="underline">Manage adoptions</Link></p> : (
        <div className="table-wrap mt-3">
          <table className="table">
            <thead><tr><th>Supporter</th><th>Dog</th><th>Since</th><th>Monthly</th><th className="text-right">Download</th></tr></thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id}>
                  <td className="font-semibold">{a.supporter_name}<span className="block text-xs font-normal text-ink-400">{a.supporter_email}</span></td>
                  <td>{a.dogs?.name}</td>
                  <td>{fmtDate(a.start_date)}</td>
                  <td>{inr(a.monthly_amount)}</td>
                  <td className="whitespace-nowrap text-right">
                    <Button size="sm" variant="soft" onClick={() => issue(a, false)}><Download className="h-4 w-4" /> Adoption</Button>{' '}
                    <Button size="sm" variant="ghost" onClick={() => issue(a, true)}>Anniversary</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-10 text-xl font-bold">Issued certificates</h2>
      <div className="mt-3">
        <ResourceManager key={logKey} table="certificates" noun="certificate" canAdd={false} canEdit={false} fields={[]}
          columns={[
            { label: 'Number', key: 'number', className: 'font-mono text-xs' },
            { label: 'Type', key: 'kind', render: (r) => <span className="capitalize">{r.kind.replace('_', ' ')}</span> },
            { label: 'Issued to', key: 'recipient_name' },
            { label: 'Date', key: 'issued_on', render: (r) => fmtDate(r.issued_on), csv: (r) => r.issued_on },
          ]}
          search={['number', 'recipient_name']} csvName="certificates" />
      </div>
      <p className="mt-6 text-sm text-ink-400">Need an 80G receipt? Open <Link to="/admin/payments" className="underline">Payments</Link>, confirm the payment, then use the download button. Add your 80G number in <Link to="/admin/settings" className="underline">Site settings</Link> so receipts include it.</p>
    </div>
  );
}
