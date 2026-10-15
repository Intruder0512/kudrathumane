import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ResourceManager from '@/components/ResourceManager';
import { PageTitle } from '@/layouts/AdminLayout';
import { Tabs, Button } from '@/components/ui';
import { OUTCOME, DEWORM_KIND } from '@/lib/constants';
import { daysUntil } from '@/lib/format';
import { VACC_FIELDS, vaccColumns, TREAT_FIELDS, treatColumns, DEWORM_FIELDS, dewormColumns } from './fields';
import { ProgressNotes } from './DogFile';

const due = [
  ['overdue', 'Overdue'], ['7', 'Due in 7 days'], ['30', 'Due in 30 days'],
];
const dueTest = (r, v) => {
  const d = daysUntil(r.next_due_date);
  if (d === null) return false;
  return v === 'overdue' ? d < 0 : d >= 0 && d <= Number(v);
};

export default function Medical() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'vaccinations';
  const [notesFor, setNotesFor] = useState(null);
  return (
    <div>
      <PageTitle title="Medical records">Log vaccinations, treatments and deworming for any dog. Next due dates fill in automatically.</PageTitle>
      <Tabs value={tab} onChange={(t) => setParams({ tab: t })} tabs={[['vaccinations', 'Vaccinations'], ['treatments', 'Treatments'], ['deworming', 'Deworming & tick / flea']]} />
      <div className="mt-5">
        {tab === 'vaccinations' && (
          <ResourceManager table="vaccinations" select="*, dogs(name)" noun="vaccination" order={['next_due_date', true]} fields={VACC_FIELDS()} columns={vaccColumns()}
            search={[(r) => r.dogs?.name, 'vaccine', 'administered_by']} filters={[{ name: 'due', label: 'Due dates', options: due, test: dueTest }]} dateField="date_administered" csvName="vaccinations" />
        )}
        {tab === 'treatments' && (
          <>
            <ResourceManager table="treatments" select="*, dogs(name)" noun="treatment" order={['start_date', false]} fields={TREAT_FIELDS()} columns={treatColumns()}
              search={[(r) => r.dogs?.name, 'condition', 'vet']} filters={[{ name: 'outcome', label: 'Outcomes', options: OUTCOME }]} dateField="start_date" csvName="treatments"
              rowActions={(r) => <Button size="sm" variant="ghost" onClick={() => setNotesFor(r)}>Notes</Button>} />
            {notesFor && <ProgressNotes treatment={notesFor} onClose={() => setNotesFor(null)} />}
          </>
        )}
        {tab === 'deworming' && (
          <ResourceManager table="dewormings" select="*, dogs(name)" noun="deworming record" order={['next_due_date', true]} fields={DEWORM_FIELDS()} columns={dewormColumns()}
            search={[(r) => r.dogs?.name, 'medication']} filters={[{ name: 'kind', label: 'Types', options: DEWORM_KIND }, { name: 'due', label: 'Due dates', options: due, test: dueTest }]} dateField="date_given" csvName="deworming" addLabel="Add deworming / tick treatment" />
        )}
      </div>
    </div>
  );
}
