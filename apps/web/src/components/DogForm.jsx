import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const DogForm = ({ dog, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    sex: 'Male',
    rescued_from_area: '',
    status: 'Available',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dog) {
      setFormData({
        name: dog.name || '',
        breed: dog.breed || '',
        age: dog.age?.toString() || '',
        sex: dog.sex || 'Male',
        rescued_from_area: dog.rescued_from_area || '',
        status: dog.status || 'Available',
      });
    }
  }, [dog]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('breed', formData.breed);
      data.append('age', parseFloat(formData.age));
      data.append('sex', formData.sex);
      data.append('rescued_from_area', formData.rescued_from_area);
      data.append('status', formData.status);
      
      if (photoFile) {
        data.append('photo', photoFile);
      }

      if (dog) {
        await pb.collection('dogs').update(dog.id, data, { $autoCancel: false });
        toast('Dog updated successfully');
      } else {
        await pb.collection('dogs').create(data, { $autoCancel: false });
        toast('Dog added successfully');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving dog:', error);
      toast('Failed to save dog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-card-foreground">{dog ? 'Edit Dog' : 'Add New Dog'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="text-card-foreground">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-2 text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="breed" className="text-card-foreground">Breed</Label>
              <Input
                id="breed"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                required
                className="mt-2 text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="age" className="text-card-foreground">Age (years)</Label>
              <Input
                id="age"
                type="number"
                step="0.1"
                min="0"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
                className="mt-2 text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="sex" className="text-card-foreground">Sex</Label>
              <Select value={formData.sex} onValueChange={(value) => setFormData({ ...formData, sex: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rescued_from_area" className="text-card-foreground">Rescued From Area</Label>
              <Input
                id="rescued_from_area"
                value={formData.rescued_from_area}
                onChange={(e) => setFormData({ ...formData, rescued_from_area: e.target.value })}
                required
                className="mt-2 text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="status" className="text-card-foreground">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Adopted">Adopted</SelectItem>
                  <SelectItem value="Fostered">Fostered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="photo" className="text-card-foreground">Photo</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files[0])}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : dog ? 'Update Dog' : 'Add Dog'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DogForm;