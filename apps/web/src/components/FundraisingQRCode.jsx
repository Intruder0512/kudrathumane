import React from 'react';
import { QrCode } from 'lucide-react';

const FundraisingQRCode = () => {
  return (
    <div className="bg-card rounded-2xl p-8 shadow-lg text-center">
      <h3 className="text-2xl font-bold mb-4 text-card-foreground">Scan to Donate</h3>
      <div className="bg-muted rounded-xl p-8 inline-block">
        <QrCode className="w-48 h-48 text-primary mx-auto" />
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        Scan this QR code with your UPI app to make a donation
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        UPI ID: kudrathumane@upi
      </p>
    </div>
  );
};

export default FundraisingQRCode;