import ResourceManager from '@/components/ResourceManager';
import { PageTitle } from '@/layouts/AdminLayout';
import { update } from '@/lib/data';
import { fmtDate } from '@/lib/format';
import { Badge, Button } from '@/components/ui';

export default function Messages() {
  return (
    <div>
      <PageTitle title="Messages">From the contact form on the website.</PageTitle>
      <ResourceManager
        table="contact_messages" noun="message" canAdd={false} canEdit={false}
        columns={[
          { label: 'Received', key: 'created_at', render: (r) => fmtDate(r.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), csv: (r) => r.created_at },
          { label: 'From', text: (r) => `${r.name} ${r.email || ''} ${r.phone || ''}`, render: (r) => <span className="font-semibold">{r.name}<span className="block text-xs font-normal">{r.email && <a className="underline" href={`mailto:${r.email}`}>{r.email}</a>} {r.phone && <a className="underline" href={`tel:${r.phone}`}>{r.phone}</a>}</span></span> },
          { label: 'Message', key: 'message', className: 'max-w-lg whitespace-pre-line' },
          { label: 'Status', text: (r) => (r.handled ? 'Handled' : 'New'), render: (r) => <Badge tone={r.handled ? 'grey' : 'amber'}>{r.handled ? 'Handled' : 'New'}</Badge> },
        ]}
        fields={[]}
        search={['name', 'email', 'phone', 'message']}
        filters={[{ name: 'handled', label: 'Messages', options: [['false', 'New'], ['true', 'Handled']], test: (r, v) => String(r.handled) === v }]}
        csvName="messages"
        rowActions={(r, reload) => <Button size="sm" variant="ghost" onClick={() => update('contact_messages', r.id, { handled: !r.handled }).then(reload)}>{r.handled ? 'Mark new' : 'Mark handled'}</Button>}
      />
    </div>
  );
}
