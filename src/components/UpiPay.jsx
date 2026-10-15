import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, Copy } from 'lucide-react';
import { list, useSettings } from '@/lib/data';
import { inr } from '@/lib/format';
import { useToast } from './ui';

// Shows the trust's UPI QR codes plus a generated QR / app link for the exact amount.
export default function UpiPay({ amount, note = 'Donation' }) {
  const settings = useSettings();
  const [codes, setCodes] = useState([]);
  const [qr, setQr] = useState('');
  const toast = useToast();
  const upi = settings.upi_id;
  const link = upi
    ? `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(settings.upi_payee_name || 'Kudrat Humane Living Trust')}&am=${Number(amount || 0).toFixed(2)}&cu=INR&tn=${encodeURIComponent(note.slice(0, 40))}`
    : '';

  useEffect(() => {
    list('qr_codes', { order: ['sort_order', true] }).then(setCodes).catch(() => setCodes([]));
  }, []);
  useEffect(() => {
    if (link) QRCode.toDataURL(link, { margin: 1, width: 360, color: { dark: '#1E2A5A', light: '#FFFFFF' } }).then(setQr);
  }, [link]);

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-wall-3">
      <p className="font-display text-xl font-bold">Pay {amount ? inr(amount) : ''} by UPI</p>
      <p className="mt-1 text-sm text-ink-400">Scan with any UPI app — Google Pay, PhonePe, Paytm or your bank’s app.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {qr && (
          <figure className="text-center">
            <img src={qr} alt={`UPI QR code for ${inr(amount)}`} className="mx-auto w-48 rounded-lg" />
            <figcaption className="mt-1 text-xs text-ink-400">Amount already filled in</figcaption>
          </figure>
        )}
        {codes.map((c) => (
          <figure key={c.id} className="text-center">
            {c.image_url && <img src={c.image_url} alt={`${c.label} QR code`} className="mx-auto w-48 rounded-lg" />}
            <figcaption className="mt-1 text-xs text-ink-400">{c.label}{c.upi_id ? ` · ${c.upi_id}` : ''}</figcaption>
          </figure>
        ))}
        {!qr && codes.length === 0 && <p className="text-sm text-ink-400 sm:col-span-2">Our payment QR code will appear here once it’s added. Please use the contact page to reach us meanwhile.</p>}
      </div>
      {upi && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a href={link} className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white sm:hidden">
            <Smartphone className="h-4 w-4" /> Open UPI app
          </a>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(upi).then(() => toast('UPI ID copied'))}
            className="inline-flex items-center gap-2 rounded-xl bg-wall px-3 py-2 text-sm font-semibold"
          >
            <Copy className="h-4 w-4" /> {upi}
          </button>
        </div>
      )}
      <p className="mt-4 text-sm text-ink-400">After paying, note the 12-digit UTR / transaction ID shown in your UPI app and enter it below.</p>
    </div>
  );
}
