import ResourceManager from '@/components/ResourceManager';
import { PageTitle } from '@/layouts/AdminLayout';
import { update } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { fmtDate } from '@/lib/format';
import { Select, useToast } from '@/components/ui';

export default function Users() {
  const toast = useToast();
  const { user } = useAuth();
  return (
    <div>
      <PageTitle title="Logins & roles">
        Everyone who has signed up on the website. Admins can do everything; volunteers can manage dogs, medical records and rescues (not money); foster families get the foster portal. To add a staff login, ask them to sign up, then change their role here.
      </PageTitle>
      <ResourceManager
        table="profiles" noun="login" canAdd={false} canDelete={false}
        fields={[{ name: 'full_name', label: 'Name' }, { name: 'phone', label: 'Phone' }, { name: 'address', label: 'Address', span: 2 }]}
        columns={[
          { label: 'Name', key: 'full_name', render: (r) => <span className="font-semibold">{r.full_name || '—'}</span> },
          { label: 'Email', key: 'email' },
          { label: 'Phone', key: 'phone' },
          { label: 'Joined', key: 'created_at', render: (r) => fmtDate(r.created_at), csv: (r) => r.created_at },
          {
            label: 'Role', text: (r) => r.role,
            render: (r, reload) => (
              <Select className="w-40 py-1.5" value={r.role} options={ROLES} disabled={r.id === user.id} aria-label={`Role for ${r.email}`}
                onChange={async (e) => {
                  try {
                    await update('profiles', r.id, { role: e.target.value });
                    toast(`${r.email} is now ${e.target.value}`);
                    reload();
                  } catch (err) {
                    toast(err.message, 'error');
                  }
                }} />
            ),
          },
        ]}
        search={['full_name', 'email', 'phone']}
        filters={[{ name: 'role', label: 'Roles', options: ROLES }]}
        csvName="logins"
      />
    </div>
  );
}
