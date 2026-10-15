import { useState } from 'react';
import { ArrowDownUp, AlertTriangle } from 'lucide-react';
import ResourceManager, { RecordForm } from '@/components/ResourceManager';
import { PageTitle } from '@/layouts/AdminLayout';
import { insert } from '@/lib/data';
import { SUPPLY_CATEGORY, UNITS, MOVEMENT_REASON, label } from '@/lib/constants';
import { fmtDate, today } from '@/lib/format';
import { Badge, Button, Tabs, useToast } from '@/components/ui';

const low = (r) => Number(r.quantity) <= Number(r.reorder_level);

export default function Inventory() {
  const toast = useToast();
  const [tab, setTab] = useState('stock');
  const [moving, setMoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState(0);

  const saveMove = async (f) => {
    setBusy(true);
    try {
      const qty = Math.abs(Number(f.qty));
      const sign = ['used', 'expired'].includes(f.reason) ? -1 : f.reason === 'correction' ? Math.sign(Number(f.qty)) || 1 : 1;
      await insert('inventory_movements', { item_id: moving.item.id, change: sign * qty, reason: f.reason, dog_id: f.dog_id || null, moved_on: f.moved_on, notes: f.notes });
      toast('Stock updated');
      setMoving(null);
      setKey((k) => k + 1);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageTitle title="Inventory">Food, medicine and supplies at the shelter. Items at or below their reorder level are flagged.</PageTitle>
      <Tabs value={tab} onChange={setTab} tabs={[['stock', 'Stock'], ['history', 'Usage history']]} />
      <div className="mt-5">
        {tab === 'stock' && (
          <ResourceManager key={key}
            table="inventory_items" noun="item" order={['name', true]}
            fields={[
              { name: 'name', label: 'Item', required: true },
              { name: 'category', label: 'Type', type: 'select', options: SUPPLY_CATEGORY, default: 'food', required: true },
              { name: 'quantity', label: 'Quantity in stock', type: 'number', default: 0, required: true },
              { name: 'unit', label: 'Unit', type: 'select', options: UNITS, default: 'kg' },
              { name: 'reorder_level', label: 'Reorder when at or below', type: 'number', default: 0, required: true },
              { name: 'notes', label: 'Notes', type: 'textarea' },
            ]}
            columns={[
              { label: 'Item', key: 'name', render: (r) => <span className="font-semibold">{r.name}</span> },
              { label: 'Type', text: (r) => label(SUPPLY_CATEGORY, r.category), render: (r) => label(SUPPLY_CATEGORY, r.category) },
              { label: 'In stock', text: (r) => `${r.quantity} ${r.unit}`, render: (r) => <span className="flex items-center gap-2"><b>{Number(r.quantity)}</b> {r.unit}{low(r) && <Badge tone="red"><AlertTriangle className="h-3 w-3" /> Low</Badge>}</span> },
              { label: 'Reorder at', key: 'reorder_level' },
              { label: 'Updated', key: 'updated_at', render: (r) => fmtDate(r.updated_at), csv: (r) => r.updated_at },
            ]}
            search={['name', 'notes']}
            filters={[{ name: 'category', label: 'Types', options: SUPPLY_CATEGORY }, { name: 'low', label: 'Stock levels', options: [['low', 'Low stock only']], test: (r) => low(r) }]}
            csvName="inventory"
            rowClass={(r) => (low(r) ? 'bg-sindoor-50/50' : '')}
            rowActions={(r) => <Button size="sm" variant="soft" onClick={() => setMoving({ item: r, initial: { reason: 'used', qty: '', moved_on: today(), dog_id: '', notes: '' } })}><ArrowDownUp className="h-4 w-4" /> Use / restock</Button>}
          />
        )}
        {tab === 'history' && (
          <ResourceManager table="inventory_movements" select="*, inventory_items(name, unit), dogs(name)" noun="movement" order={['moved_on', false]} canAdd={false} canEdit={false}
            fields={[]}
            columns={[
              { label: 'Date', key: 'moved_on', render: (r) => fmtDate(r.moved_on), csv: (r) => r.moved_on },
              { label: 'Item', text: (r) => r.inventory_items?.name, render: (r) => r.inventory_items?.name },
              { label: 'Change', key: 'change', render: (r) => <b className={r.change < 0 ? 'text-sindoor' : 'text-neem'}>{r.change > 0 ? '+' : ''}{Number(r.change)} {r.inventory_items?.unit}</b> },
              { label: 'Reason', text: (r) => label(MOVEMENT_REASON, r.reason), render: (r) => label(MOVEMENT_REASON, r.reason) },
              { label: 'For dog', text: (r) => r.dogs?.name, render: (r) => r.dogs?.name || '—' },
              { label: 'Notes', key: 'notes' },
            ]}
            search={[(r) => r.inventory_items?.name, 'notes', (r) => r.dogs?.name]}
            filters={[{ name: 'reason', label: 'Reasons', options: MOVEMENT_REASON }]}
            dateField="moved_on" csvName="inventory-usage" />
        )}
      </div>
      <RecordForm
        open={!!moving} initial={moving?.initial} noun="movement" busy={busy} onClose={() => setMoving(null)} onSave={saveMove}
        title={`${moving?.item.name} — ${Number(moving?.item.quantity ?? 0)} ${moving?.item.unit} in stock`} saveLabel="Update stock"
        fields={[
          { name: 'reason', label: 'What happened', type: 'select', options: MOVEMENT_REASON, required: true },
          { name: 'qty', label: `Quantity (${moving?.item.unit || ''})`, type: 'number', required: true, hint: 'For a correction, use a negative number to reduce stock' },
          { name: 'moved_on', label: 'Date', type: 'date', required: true },
          { name: 'dog_id', label: 'Used for dog (optional)', type: 'dog', show: (f) => f.reason === 'used' },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ]}
      />
    </div>
  );
}
