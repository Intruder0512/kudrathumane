import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2 } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const AdoptionsTab = ({ dogsMap }) => {
  const [adoptions, setAdoptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    dog_id: '',
    adopter_name: '',
    adopter_email: '',
    adopter_phone: '',
    adopter_address: '',
    adoption_date: new Date().toISOString().split('T')[0],
    adoption_type: 'Physical adoption',
    adoption_fee: '',
    follow_up_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchAdoptions();
  }, []);

  const fetchAdoptions = async () => {
    try {
      const data = await pb.collection('adoptions').getFullList({ sort: '-adoption_date', $autoCancel: false });
      setAdoptions(data);
    } catch (error) {
      toast.error('Failed to load adoptions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdoption = async (e) => {
    e.preventDefault();
    try {
      await pb.collection('adoptions').create({
        ...formData,
        adoption_fee: Number(formData.adoption_fee) || 0
      }, { $autoCancel: false });
      
      // Update dog status
      if (formData.dog_id) {
        await pb.collection('dogs').update(formData.dog_id, { status: 'Adopted' }, { $autoCancel: false });
      }

      toast.success('Adoption record added successfully');
      setIsModalOpen(false);
      fetchAdoptions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add adoption record');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this adoption record?')) {
      try {
        await pb.collection('adoptions').delete(id, { $autoCancel: false });
        toast.success('Record deleted');
        fetchAdoptions();
      } catch (err) {
        toast.error('Failed to delete record');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Adoptions</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Adoption</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Adoption Record</DialogTitle></DialogHeader>
            <form onSubmit={handleAddAdoption} className="space-y-4">
              <div>
                <Label>Dog</Label>
                <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.dog_id} onChange={e => setFormData({...formData, dog_id: e.target.value})}>
                  <option value="">Select Dog...</option>
                  {Object.values(dogsMap).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Adopter Name</Label>
                  <Input required value={formData.adopter_name} onChange={e => setFormData({...formData, adopter_name: e.target.value})} />
                </div>
                <div>
                  <Label>Adopter Email</Label>
                  <Input type="email" required value={formData.adopter_email} onChange={e => setFormData({...formData, adopter_email: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Adopter Phone</Label>
                  <Input required value={formData.adopter_phone} onChange={e => setFormData({...formData, adopter_phone: e.target.value})} />
                </div>
                <div>
                  <Label>Adoption Date</Label>
                  <Input type="date" required value={formData.adoption_date} onChange={e => setFormData({...formData, adoption_date: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Adopter Address</Label>
                <Textarea required value={formData.adopter_address} onChange={e => setFormData({...formData, adopter_address: e.target.value})} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Adoption Type</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.adoption_type} onChange={e => setFormData({...formData, adoption_type: e.target.value})}>
                    <option value="Physical adoption">Physical adoption</option>
                    <option value="Virtual adoption">Virtual adoption</option>
                  </select>
                </div>
                <div>
                  <Label>Adoption Fee (₹)</Label>
                  <Input type="number" value={formData.adoption_fee} onChange={e => setFormData({...formData, adoption_fee: e.target.value})} />
                </div>
                <div>
                  <Label>Follow-up Date</Label>
                  <Input type="date" value={formData.follow_up_date} onChange={e => setFormData({...formData, follow_up_date: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
              <Button type="submit" className="w-full">Save Adoption Record</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dog Name</TableHead>
              <TableHead>Adopter Name</TableHead>
              <TableHead>Adoption Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adoptions.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{dogsMap[a.dog_id]?.name || 'Unknown'}</TableCell>
                <TableCell>
                  <div>{a.adopter_name}</div>
                  <div className="text-xs text-muted-foreground">{a.adopter_email}</div>
                </TableCell>
                <TableCell>{new Date(a.adoption_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    {a.adoption_type}
                  </span>
                </TableCell>
                <TableCell>₹{a.adoption_fee || 0}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => toast('Edit coming soon')}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {adoptions.length === 0 && !loading && (
              <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground">No adoption records</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdoptionsTab;