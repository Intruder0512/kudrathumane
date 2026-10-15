import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { list, useAsync } from '@/lib/data';
import { downloadCSV } from '@/lib/csv';
import { fmtDate } from '@/lib/format';
import { PageTitle } from '@/layouts/AdminLayout';
import { Button, Empty, Spinner } from '@/components/ui';
import { DogStatus } from '@/components/StatusBadge';

export default function Microchips() {
  const { data, loading } = useAsync(() => list('dogs', { order: ['name', true] }), []);
  const [q, setQ] = useState('');
  const chipped = useMemo(() => (data || []).filter((d) => d.microchip_number), [data]);
  const hits = q.trim() ? chipped.filter((d) => d.microchip_number.replace(/\s/g, '').includes(q.replace(/\s/g, ''))) : chipped;
  return (
    <div>
      <PageTitle title="Microchip registry" actions={<Button variant="soft" onClick={() => downloadCSV('microchips', chipped, [{ label: 'Dog', key: 'name' }, { label: 'Chip number', key: 'microchip_number' }, { label: 'Brand', key: 'microchip_brand' }, { label: 'Implanted', key: 'microchip_date' }, { label: 'Status', key: 'status' }])}>Export CSV</Button>}>
        Scan a found dog’s chip and search the number here. Add or change a chip from the dog’s file (Spay / neuter & chip tab).
      </PageTitle>
      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-300" />
        <input className="input py-3 pl-10 text-lg" placeholder="Search chip number" value={q} onChange={(e) => setQ(e.target.value)} inputMode="numeric" aria-label="Chip number" />
      </label>
      <div className="mt-6">
        {loading ? <Spinner /> : hits.length === 0 ? <Empty title={q ? 'No dog has that chip number' : 'No chipped dogs yet'} /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Dog</th><th>Chip number</th><th>Brand</th><th>Implanted</th><th>Status</th></tr></thead>
              <tbody>
                {hits.map((d) => (
                  <tr key={d.id}>
                    <td><Link to={`/admin/dogs/${d.id}`} className="font-semibold underline">{d.name}</Link></td>
                    <td className="font-mono">{d.microchip_number}</td>
                    <td>{d.microchip_brand || '—'}</td>
                    <td>{fmtDate(d.microchip_date)}</td>
                    <td><DogStatus status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
