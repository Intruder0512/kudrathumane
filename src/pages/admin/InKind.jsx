import ResourceManager from '@/components/ResourceManager';
import { PageTitle } from '@/layouts/AdminLayout';
import { insert, list, update } from '@/lib/data';
import { SUPPLY_CATEGORY, UNITS, label } from '@/lib/constants';
import { fmtDate, inr, today } from '@/lib/format';

export default function InKind() {
  return (
    <div>
      <PageTitle title="In-kind donations">Food, medicines and supplies people give. Tick “Add to inventory” and the stock goes up automatically.</PageTitle>
      <ResourceManager
        table="in_kind_donations" noun="donation" order={['donation_date', false]} addLabel="Log a donation"
        fields={[
          { name: 'donor_name', label: 'Donated by', required: true },
          { name: 'donor_contact', label: 'Phone or email' },
          { name: 'donation_date', label: 'Date received', type: 'date', default: today, required: true },
          { name: 'category', label: 'Type', type: 'select', options: SUPPLY_CATEGORY, default: 'food', required: true },
          { name: 'description', label: 'Item', span: 2, placeholder: 'e.g. Pedigree adult 10 kg, Betadine 500 ml' },
          { name: 'quantity', label: 'Quantity', type: 'number' },
          { name: 'unit', label: 'Unit', type: 'select', options: UNITS, default: 'kg' },
          { name: 'estimated_value', label: 'Estimated value (₹)', type: 'number', default: 0, required: true, hint: 'What it would cost to buy' },
          { name: '_add_to_inventory', label: 'Add to inventory', type: 'checkbox', omit: true, default: true, show: (f) => !f.id },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ]}
        columns={[
          { label: 'Date', key: 'donation_date', render: (r) => fmtDate(r.donation_date), csv: (r) => r.donation_date },
          { label: 'Donor', text: (r) => r.donor_name, render: (r) => <span className="font-semibold">{r.donor_name}<span className="block text-xs font-normal text-ink-400">{r.donor_contact}</span></span> },
          { label: 'Type', text: (r) => label(SUPPLY_CATEGORY, r.category), render: (r) => label(SUPPLY_CATEGORY, r.category) },
          { label: 'Item', key: 'description' },
          { label: 'Quantity', text: (r) => `${r.quantity ?? ''} ${r.unit ?? ''}`, render: (r) => (r.quantity ? `${r.quantity} ${r.unit || ''}` : '—') },
          { label: 'Value', key: 'estimated_value', render: (r) => inr(r.estimated_value) },
        ]}
        search={['donor_name', 'description', 'donor_contact']}
        filters={[{ name: 'category', label: 'Types', options: SUPPLY_CATEGORY }]}
        dateField="donation_date"
        csvName="in-kind-donations"
        summary={(rows) => {
          const by = {};
          for (const r of rows) by[r.category] = (by[r.category] || 0) + Number(r.estimated_value || 0);
          return (
            <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-wall-3">
              <p><b>{inr(rows.reduce((s, r) => s + Number(r.estimated_value || 0), 0))}</b> worth of supplies in {rows.length} donations</p>
              <p className="mt-1 text-sm text-ink-400">{Object.entries(by).map(([k, v]) => `${label(SUPPLY_CATEGORY, k)} ${inr(v)}`).join(' · ')}</p>
            </div>
          );
        }}
        afterSave={async (saved, editing, row) => {
          if (editing?.id || !row._add_to_inventory || !saved.quantity) return;
          const name = (saved.description || label(SUPPLY_CATEGORY, saved.category)).trim();
          const items = await list('inventory_items', { eq: { category: saved.category } });
          let item = items.find((i) => i.name.toLowerCase() === name.toLowerCase());
          if (!item) item = await insert('inventory_items', { name, category: saved.category, quantity: 0, unit: saved.unit, reorder_level: 0 });
          await insert('inventory_movements', { item_id: item.id, change: Number(saved.quantity), reason: 'donated_in', moved_on: saved.donation_date, notes: `From ${saved.donor_name}` });
          await update('in_kind_donations', saved.id, { inventory_item_id: item.id });
        }}
      />
    </div>
  );
}
