import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ResourceManager from '@/components/ResourceManager';
import { PageTitle } from '@/layouts/AdminLayout';
import { HotspotMap } from '@/components/Maps';
import { insert, list, useAsync } from '@/lib/data';
import { RESCUE_TYPE, CONDITION, label } from '@/lib/constants';
import { Badge, Select } from '@/components/ui';
import { RESCUE_FIELDS } from './fields';

export default function Rescues() {
  const { data } = useAsync(() => list('rescues', { select: 'id,rescue_date,latitude,longitude,area' }).catch(() => []), []);
  const months = useMemo(() => [...new Set((data || []).map((r) => r.rescue_date?.slice(0, 7)).filter(Boolean))].sort().reverse(), [data]);
  const [month, setMonth] = useState('');
  const mapRows = (data || []).filter((r) => !month || r.rescue_date?.startsWith(month));

  return (
    <div>
      <PageTitle title="Rescue operations">Every intake: where and how each dog was found. Adding a rescue with a new dog’s name creates their profile too.</PageTitle>

      <section className="mb-8 rounded-2xl bg-white p-4 ring-1 ring-wall-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Rescue hotspots</h2>
          <Select className="w-48" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="All months"
            options={months.map((m) => [m, new Date(`${m}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })])} aria-label="Month" />
        </div>
        <HotspotMap rescues={mapRows} height={340} />
        <p className="mt-2 text-sm text-ink-400">{mapRows.filter((r) => r.latitude).length} of {mapRows.length} rescues have a map pin. Bigger circles mean more rescues from that spot.</p>
      </section>

      <ResourceManager
        table="rescues"
        select="*, dogs(name)"
        noun="rescue"
        order={['rescue_date', false]}
        fields={RESCUE_FIELDS()}
        columns={[
          { label: 'Date', key: 'rescue_date', type: 'date', csv: (r) => r.rescue_date },
          { label: 'Dog', text: (r) => r.dogs?.name, render: (r) => r.dogs ? <Link className="font-semibold underline" to={`/admin/dogs/${r.dog_id}`}>{r.dogs.name}</Link> : '—' },
          { label: 'Area', text: (r) => [r.area, r.city, r.state].filter(Boolean).join(', '), render: (r) => <span>{r.area}{r.city ? `, ${r.city}` : ''}<span className="block text-xs text-ink-400">{r.location_text}</span></span> },
          { label: 'Type', text: (r) => label(RESCUE_TYPE, r.rescue_type), render: (r) => label(RESCUE_TYPE, r.rescue_type) },
          { label: 'Condition', text: (r) => label(CONDITION, r.intake_condition), render: (r) => <Badge tone={{ critical: 'red', serious: 'amber', stable: 'ink', healthy: 'green' }[r.intake_condition] || 'grey'}>{label(CONDITION, r.intake_condition)}</Badge> },
          { label: 'Rescued by', key: 'rescued_by' },
          { label: 'Latitude', key: 'latitude', hidden: true },
          { label: 'Longitude', key: 'longitude', hidden: true },
        ]}
        search={['area', 'city', 'location_text', 'rescued_by', (r) => r.dogs?.name]}
        filters={[
          { name: 'rescue_type', label: 'Types', options: RESCUE_TYPE },
          { name: 'intake_condition', label: 'Conditions', options: CONDITION },
          { name: 'area', label: 'Areas', options: [...new Set((data || []).map((r) => r.area).filter(Boolean))].map((a) => [a, a]) },
        ]}
        dateField="rescue_date"
        csvName="rescue-log"
        beforeSave={async (row) => {
          if (!row.dog_id && row._new_dog_name) {
            const dog = await insert('dogs', { name: row._new_dog_name.trim(), status: 'rescued', rescued_from_area: row.area, intake_date: row.rescue_date });
            row.dog_id = dog.id;
          }
          return row;
        }}
      />
    </div>
  );
}
