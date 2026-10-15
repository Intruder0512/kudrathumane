import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import ResourceManager from '@/components/ResourceManager';
import { PageTitle } from '@/layouts/AdminLayout';
import { DOG_STATUS, SEX } from '@/lib/constants';
import { DOG_FIELDS, dogColumns } from './fields';

export default function Dogs() {
  return (
    <div>
      <PageTitle title="Dogs">Every dog’s profile. Open a dog to see their full medical file, rescue and release records.</PageTitle>
      <ResourceManager
        table="dogs"
        noun="dog"
        order={['intake_date', false]}
        columns={dogColumns}
        fields={DOG_FIELDS}
        search={['name', 'rescued_from_area', 'colour', 'microchip_number', 'breed']}
        filters={[{ name: 'status', label: 'Statuses', options: DOG_STATUS }, { name: 'sex', label: 'Sexes', options: SEX }]}
        dateField="intake_date"
        csvName="dogs"
        rowActions={(r) => (
          <Link to={`/admin/dogs/${r.id}`} className="rounded-lg p-2 hover:bg-wall-2" aria-label={`Open ${r.name}'s file`} title="Medical file">
            <FileText className="h-4 w-4" />
          </Link>
        )}
      />
    </div>
  );
}
