import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UploadInput from './UploadInput';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const DogManagementModal = ({ isOpen, onClose, dog, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', breed: '', age: '', sex: '', rescued_from_area: '',
    status: 'Available',
    health_status: 'rescued',
    spay_neuter_status: 'not yet',
    spay_neuter_date: '',
    operating_vet: ''
  });
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    if (dog) {
      setFormData({
        name: dog.name || '', breed: dog.breed || '', age: dog.age || '', sex: dog.sex || '', 
        rescued_from_area: dog.rescued_from_area || '', status: dog.status || 'Available',
        health_status: dog.health_status || 'rescued',
        spay_neuter_status: dog.spay_neuter_status || 'not yet',
        spay_neuter_date: dog.spay_neuter_date ? dog.spay_neuter_date.split('T')[0] : '',
        operating_vet: dog.operating_vet || ''
      });
    } else {
      setFormData({
        name: '', breed: '', age: '', sex: '', rescued_from_area: '', status: 'Available',
        health_status: 'rescued', spay_neuter_status: 'not yet', spay_neuter_date: '', operating_vet: ''
      });
    }
    setPhotoFile(null);
  }, [dog, isOpen]);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') data.append(key, value);
      });
      if (photoFile) data.append('photo', photoFile);

      if (dog) {
        await pb.collection('dogs').update(dog.id, data, { $autoCancel: false });
        toast.success('Dog updated');
      } else {
        await pb.collection('dogs').create(data, { $autoCancel: false });
        toast.success('Dog added');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to save dog');
    } finally {
      setLoading(false);
    }
  };

  const currentPhotoUrl = dog?.photo ? pb.files.getUrl(dog, dog.photo) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{dog ? 'Edit Dog' : 'Add New Dog'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required /></div>
            <div className="space-y-2"><Label>Breed</Label><Input value={formData.breed} onChange={(e) => handleChange('breed', e.target.value)} required /></div>
            <div className="space-y-2"><Label>Age</Label><Input type="number" step="0.1" value={formData.age} onChange={(e) => handleChange('age', e.target.value)} required /></div>
            <div className="space-y-2"><Label>Sex</Label>
              <Select value={formData.sex} onValueChange={(val) => handleChange('sex', val)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={formData.status} onValueChange={(val) => handleChange('status', val)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="Available">Available</SelectItem><SelectItem value="Adopted">Adopted</SelectItem><SelectItem value="Fostered">Fostered</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Health Status</Label>
              <Select value={formData.health_status} onValueChange={(val) => handleChange('health_status', val)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  {['rescued', 'under assessment', 'under treatment', 'recovering', 'ready for adoption', 'adopted', 'fostered'].map(v => (
                    <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label>Rescued From</Label><Input value={formData.rescued_from_area} onChange={(e) => handleChange('rescued_from_area', e.target.value)} required /></div>
          
          <div className="grid grid-cols-3 gap-4 border-t pt-4">
            <div className="space-y-2"><Label>Spay/Neuter</Label>
              <Select value={formData.spay_neuter_status} onValueChange={(val) => handleChange('spay_neuter_status', val)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="spayed/neutered">Spayed/Neutered</SelectItem><SelectItem value="not yet">Not Yet</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Surgery Date</Label><Input type="date" value={formData.spay_neuter_date} onChange={(e) => handleChange('spay_neuter_date', e.target.value)} /></div>
            <div className="space-y-2"><Label>Operating Vet</Label><Input value={formData.operating_vet} onChange={(e) => handleChange('operating_vet', e.target.value)} /></div>
          </div>

          <UploadInput label="Dog Photo" currentImage={currentPhotoUrl} onChange={setPhotoFile} />
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Dog'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DogManagementModal;