import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import UploadInput from './UploadInput';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const QRCodeManagementModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [qrRecord, setQrRecord] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchCurrentQR();
    }
  }, [isOpen]);

  const fetchCurrentQR = async () => {
    try {
      const records = await pb.collection('qr_code').getFullList({ $autoCancel: false });
      if (records.length > 0) {
        setQrRecord(records[0]);
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoFile) {
      toast.error('Please select an image to upload');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('image', photoFile);

      if (qrRecord) {
        await pb.collection('qr_code').update(qrRecord.id, data, { $autoCancel: false });
      } else {
        await pb.collection('qr_code').create(data, { $autoCancel: false });
      }
      
      toast.success('QR Code updated successfully');
      onClose();
    } catch (error) {
      console.error('Error saving QR code:', error);
      toast.error('Failed to update QR code');
    } finally {
      setLoading(false);
    }
  };

  const currentPhotoUrl = qrRecord?.image ? pb.files.getUrl(qrRecord, qrRecord.image) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Fundraising QR Code</DialogTitle>
          <DialogDescription>
            Upload a new UPI QR code image. This will replace the current QR code shown on the fundraising page.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <UploadInput 
            label="QR Code Image" 
            currentImage={currentPhotoUrl}
            onChange={setPhotoFile}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !photoFile}>
              {loading ? 'Uploading...' : 'Replace QR Code'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeManagementModal;