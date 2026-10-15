import ResourceManager from '@/components/ResourceManager';
import { PageTitle } from '@/layouts/AdminLayout';
import { Badge } from '@/components/ui';
import { LinkButton } from '@/components/ui';

export default function QrCodes() {
  return (
    <div>
      <PageTitle title="Payment QR codes" actions={<LinkButton to="/donate" variant="soft">Preview the donate page</LinkButton>}>
        Upload the QR codes from your UPI apps (Google Pay, PhonePe, Paytm, bank). They appear on the donate, adoption and account pages. For QR codes with the exact amount filled in, also add your UPI ID in Site settings.
      </PageTitle>
      <ResourceManager
        table="qr_codes" noun="QR code" order={['sort_order', true]}
        fields={[
          { name: 'label', label: 'Name', required: true, placeholder: 'e.g. Google Pay' },
          { name: 'upi_id', label: 'UPI ID shown under it', placeholder: 'kudrat@okaxis' },
          { name: 'image_url', label: 'QR image', type: 'image', folder: 'qr', span: 2 },
          { name: 'sort_order', label: 'Order on page', type: 'number', default: 0 },
          { name: 'active', label: 'Show on website', type: 'checkbox', default: true },
        ]}
        columns={[
          { label: 'QR', csv: false, render: (r) => (r.image_url ? <img src={r.image_url} alt="" className="h-20 w-20 rounded-lg bg-white object-contain" /> : '—') },
          { label: 'Name', key: 'label', render: (r) => <span className="font-semibold">{r.label}</span> },
          { label: 'UPI ID', key: 'upi_id' },
          { label: 'Shown', text: (r) => (r.active ? 'yes' : 'no'), render: (r) => <Badge tone={r.active ? 'green' : 'grey'}>{r.active ? 'On website' : 'Hidden'}</Badge> },
        ]}
        csvName="qr-codes"
      />
    </div>
  );
}
