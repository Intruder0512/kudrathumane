import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const DeleteDogModal = ({ isOpen, onClose, dog, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!dog) return;
    setLoading(true);
    try {
      await pb.collection('dogs').delete(dog.id, { $autoCancel: false });
      toast.success('Dog deleted successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting dog:', error);
      toast.error('Failed to delete dog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Dog</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {dog?.name}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteDogModal;