import { useState } from 'react';
import { Clock } from 'lucide-react';
import ResourceManager from '@/components/ResourceManager';
import { PageTitle } from '@/layouts/AdminLayout';
import { list, useAsync } from '@/lib/data';
import { VOLUNTEER_STATUS, label } from '@/lib/constants';
import { fmtDate, num, today } from '@/lib/format';
import { Badge, Button, Modal } from '@/components/ui';

export default function Volunteers() {
  const { data: hours, reload: reloadHours } = useAsync(() => list('volunteer_hours').catch(() => []), []);
  const [logFor, setLogFor] = useState(null);
  const total = (id) => (hours || []).filter((h) => h.volunteer_id === id).reduce((s, h) => s + Number(h.hours), 0);
  return (
    <div>
      <PageTitle title="Volunteers">Sign-ups from the website land here as “New”. Log hours after each shift.</PageTitle>
      <ResourceManager
        table="volunteers" noun="volunteer"
        fields={[
          { name: 'name', label: 'Name', required: true }, { name: 'phone', label: 'Phone' }, { name: 'email', label: 'Email', type: 'email' },
          { name: 'location', label: 'Location' }, { name: 'skills', label: 'Helps with', span: 2 }, { name: 'availability', label: 'Availability', span: 2 },
          { name: 'status', label: 'Status', type: 'select', options: VOLUNTEER_STATUS, default: 'active', required: true },
          { name: 'message', label: 'Notes', type: 'textarea' },
        ]}
        columns={[
          { label: 'Name', key: 'name', render: (r) => <span className="font-semibold">{r.name}</span> },
          { label: 'Contact', text: (r) => `${r.phone || ''} ${r.email || ''}`, render: (r) => <span>{r.phone}<span className="block text-xs text-ink-400">{r.email}</span></span> },
          { label: 'Helps with', key: 'skills', className: 'max-w-xs text-ink-500' },
          { label: 'Availability', key: 'availability' },
          { label: 'Hours', text: (r) => total(r.id), render: (r) => num(total(r.id)) },
          { label: 'Status', text: (r) => r.status, render: (r) => <Badge tone={r.status === 'active' ? 'green' : r.status === 'new' ? 'amber' : 'grey'}>{label(VOLUNTEER_STATUS, r.status)}</Badge> },
        ]}
        search={['name', 'phone', 'email', 'skills', 'location']}
        filters={[{ name: 'status', label: 'Statuses', options: VOLUNTEER_STATUS }]}
        csvName="volunteers"
        rowActions={(r) => <Button size="sm" variant="ghost" onClick={() => setLogFor(r)}><Clock className="h-4 w-4" /> Hours</Button>}
      />
      <Modal open={!!logFor} onClose={() => { setLogFor(null); reloadHours(); }} title={`Hours — ${logFor?.name || ''}`} wide>
        {logFor && (
          <ResourceManager table="volunteer_hours" noun="shift" fixed={{ volunteer_id: logFor.id }} order={['worked_on', false]} addLabel="Log hours"
            fields={[{ name: 'worked_on', label: 'Date', type: 'date', default: today, required: true }, { name: 'hours', label: 'Hours', type: 'number', required: true, min: 0.5 }, { name: 'task', label: 'What they did', span: 2 }]}
            columns={[{ label: 'Date', key: 'worked_on', render: (r) => fmtDate(r.worked_on) }, { label: 'Hours', key: 'hours' }, { label: 'Task', key: 'task' }]}
            csvName={`hours-${logFor.name}`} />
        )}
      </Modal>
    </div>
  );
}
