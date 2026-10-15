import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, Map, Plus, Edit, Trash2 } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const RescueOperationsTab = ({ dogsMap }) => {
  const [rescues, setRescues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    rescue_date: new Date().toISOString().split('T')[0],
    rescue_location: '',
    dog_name: '',
    dog_description: '',
    condition_when_found: 'stable',
    rescue_type: 'Stray found',
    rescued_by: '',
    initial_notes: '',
    notes: ''
  });
  const [photos, setPhotos] = useState(null);

  useEffect(() => {
    fetchRescues();
  }, []);

  const fetchRescues = async () => {
    try {
      const data = await pb.collection('rescues').getFullList({ sort: '-rescue_date', $autoCancel: false });
      setRescues(data);
    } catch (error) {
      toast.error('Failed to load rescues');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRescue = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      
      // We need a dummy dog_id since it's required by schema, or we create a dog first.
      // For this task, we'll just pass a placeholder or create a dog record if needed.
      // Assuming dog_id is required, we'll create a basic dog record first.
      const dogRecord = await pb.collection('dogs').create({
        name: formData.dog_name || 'Unknown Rescue',
        breed: 'Mixed/Indie',
        age: 1,
        sex: 'Unknown',
        rescued_from_area: formData.rescue_location,
        status: 'Available',
        health_status: 'rescued'
      }, { $autoCancel: false });

      data.append('dog_id', dogRecord.id);
      data.append('intake_condition', formData.condition_when_found);

      if (photos) {
        for (let i = 0; i < photos.length; i++) {
          data.append('intake_photos', photos[i]);
        }
      }

      await pb.collection('rescues').create(data, { $autoCancel: false });
      toast.success('Rescue record added successfully');
      setIsModalOpen(false);
      fetchRescues();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add rescue record');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rescue record?')) {
      try {
        await pb.collection('rescues').delete(id, { $autoCancel: false });
        toast.success('Record deleted');
        fetchRescues();
      } catch (err) {
        toast.error('Failed to delete record');
      }
    }
  };

  const simulateCsvExport = () => {
    toast.success('Downloading Rescue Log CSV...');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Rescue Operations</h2>
        <div className="flex gap-2">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Add Rescue</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Rescue Record</DialogTitle></DialogHeader>
              <form onSubmit={handleAddRescue} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Rescue Date</Label>
                    <Input type="date" required value={formData.rescue_date} onChange={e => setFormData({...formData, rescue_date: e.target.value})} />
                  </div>
                  <div>
                    <Label>Location Found</Label>
                    <Input required value={formData.rescue_location} onChange={e => setFormData({...formData, rescue_location: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dog Name (if known/given)</Label>
                    <Input value={formData.dog_name} onChange={e => setFormData({...formData, dog_name: e.target.value})} />
                  </div>
                  <div>
                    <Label>Rescued By</Label>
                    <Input required value={formData.rescued_by} onChange={e => setFormData({...formData, rescued_by: e.target.value})} />
                  </div>
                </div>
                <div>
                  <Label>Dog Description</Label>
                  <Textarea placeholder="Color, size, breed type, distinguishing marks..." value={formData.dog_description} onChange={e => setFormData({...formData, dog_description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Condition When Found</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.condition_when_found} onChange={e => setFormData({...formData, condition_when_found: e.target.value})}>
                      <option value="healthy">Healthy</option>
                      <option value="stable">Stable</option>
                      <option value="serious">Serious</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <Label>Rescue Type</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.rescue_type} onChange={e => setFormData({...formData, rescue_type: e.target.value})}>
                      <option value="Stray found">Stray found</option>
                      <option value="abandoned">Abandoned</option>
                      <option value="road accident">Road accident</option>
                      <option value="abuse case">Abuse case</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Initial Medical Assessment</Label>
                  <Textarea value={formData.initial_notes} onChange={e => setFormData({...formData, initial_notes: e.target.value})} />
                </div>
                <div>
                  <Label>Photos (Max 10)</Label>
                  <Input type="file" multiple accept="image/*" onChange={e => setPhotos(e.target.files)} />
                </div>
                <Button type="submit" className="w-full">Save Rescue Record</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={simulateCsvExport}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Dog Name</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Rescue Type</TableHead>
              <TableHead>Rescued By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rescues.map(r => (
              <TableRow key={r.id}>
                <TableCell>{new Date(r.rescue_date).toLocaleDateString()}</TableCell>
                <TableCell>{r.rescue_location}</TableCell>
                <TableCell className="font-medium">{r.dog_name || dogsMap[r.dog_id]?.name || 'Unknown'}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-muted rounded-md text-xs font-medium uppercase tracking-wider">
                    {r.condition_when_found || r.intake_condition}
                  </span>
                </TableCell>
                <TableCell className="capitalize">{r.rescue_type}</TableCell>
                <TableCell>{r.rescued_by}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => toast('Edit coming soon')}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {rescues.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-4 text-muted-foreground">No rescue records</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RescueOperationsTab;