import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Home, Heart, Mail } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { toast } from 'sonner';

const FosterFamilyManagementTab = () => {
  const [families, setFamilies] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const [familyForm, setFamilyForm] = useState({
    name: '', contact_person: '', email: '', phone: '', address: '',
    experience_level: 'Beginner', max_dogs: 1, availability: 'Flexible', notes: ''
  });

  const [assignForm, setAssignForm] = useState({
    foster_id: '', dog_id: '', assignment_date: new Date().toISOString().split('T')[0],
    expected_return_date: '', special_care_instructions: '', status: 'Active'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [famRes, placeRes, dogRes] = await Promise.all([
        pb.collection('foster_families').getFullList({ sort: '-created', $autoCancel: false }),
        pb.collection('foster_placements').getFullList({ sort: '-assignment_date', $autoCancel: false }),
        pb.collection('dogs').getFullList({ filter: 'status="Available"', sort: 'name', $autoCancel: false })
      ]);
      setFamilies(famRes);
      setPlacements(placeRes);
      setDogs(dogRes);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch foster data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddFamily = async (e) => {
    e.preventDefault();
    try {
      await pb.collection('foster_families').create({
        ...familyForm,
        max_dogs: Number(familyForm.max_dogs),
        current_dogs: 0
      }, { $autoCancel: false });
      toast.success('Foster family added');
      setIsFamilyModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to add family');
    }
  };

  const handleAssignDog = async (e) => {
    e.preventDefault();
    try {
      await pb.collection('foster_placements').create(assignForm, { $autoCancel: false });
      
      // Update dog status
      await pb.collection('dogs').update(assignForm.dog_id, { status: 'Fostered' }, { $autoCancel: false });
      
      // Notify via backend
      const family = families.find(f => f.id === assignForm.foster_id);
      const dog = dogs.find(d => d.id === assignForm.dog_id);
      if (family && dog) {
        await apiServerClient.fetch('/foster-families/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            foster_family_email: family.email,
            dog_name: dog.name,
            assignment_date: assignForm.assignment_date
          })
        });
      }

      toast.success('Dog assigned to foster family');
      setIsAssignModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign dog');
    }
  };

  const dogsMap = dogs.reduce((acc, d) => ({ ...acc, [d.id]: d.name }), {});
  const famMap = families.reduce((acc, f) => ({ ...acc, [f.id]: f.name }), {});

  return (
    <div className="space-y-8">
      {/* Families Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold flex items-center"><Home className="w-5 h-5 mr-2" /> Foster Families</h3>
          <Dialog open={isFamilyModalOpen} onOpenChange={setIsFamilyModalOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Family</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add Foster Family</DialogTitle></DialogHeader>
              <form onSubmit={handleAddFamily} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Family Name</Label><Input required value={familyForm.name} onChange={e => setFamilyForm({...familyForm, name: e.target.value})} /></div>
                  <div><Label>Contact Person</Label><Input required value={familyForm.contact_person} onChange={e => setFamilyForm({...familyForm, contact_person: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Email</Label><Input type="email" required value={familyForm.email} onChange={e => setFamilyForm({...familyForm, email: e.target.value})} /></div>
                  <div><Label>Phone</Label><Input required value={familyForm.phone} onChange={e => setFamilyForm({...familyForm, phone: e.target.value})} /></div>
                </div>
                <div><Label>Address</Label><Input required value={familyForm.address} onChange={e => setFamilyForm({...familyForm, address: e.target.value})} /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Experience</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={familyForm.experience_level} onChange={e => setFamilyForm({...familyForm, experience_level: e.target.value})}>
                      <option>Beginner</option><option>Intermediate</option><option>Experienced</option>
                    </select>
                  </div>
                  <div><Label>Max Dogs</Label><Input type="number" min="1" required value={familyForm.max_dogs} onChange={e => setFamilyForm({...familyForm, max_dogs: e.target.value})} /></div>
                  <div>
                    <Label>Availability</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={familyForm.availability} onChange={e => setFamilyForm({...familyForm, availability: e.target.value})}>
                      <option>Full-time</option><option>Weekends</option><option>Flexible</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" className="w-full">Save Family</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {families.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell><div className="text-sm">{f.contact_person}</div><div className="text-xs text-muted-foreground">{f.email}</div></TableCell>
                  <TableCell>{f.experience_level}</TableCell>
                  <TableCell>{f.current_dogs || 0} / {f.max_dogs}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm"><Mail className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {families.length === 0 && !loading && <TableRow><TableCell colSpan={5} className="text-center py-4">No families found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Placements Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold flex items-center"><Heart className="w-5 h-5 mr-2" /> Active Placements</h3>
          <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
            <DialogTrigger asChild><Button variant="secondary"><Plus className="w-4 h-4 mr-2" /> Assign Dog</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Assign Dog to Foster</DialogTitle></DialogHeader>
              <form onSubmit={handleAssignDog} className="space-y-4">
                <div>
                  <Label>Foster Family</Label>
                  <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={assignForm.foster_id} onChange={e => setAssignForm({...assignForm, foster_id: e.target.value})}>
                    <option value="">Select family...</option>
                    {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Dog</Label>
                  <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={assignForm.dog_id} onChange={e => setAssignForm({...assignForm, dog_id: e.target.value})}>
                    <option value="">Select dog...</option>
                    {dogs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Assignment Date</Label><Input type="date" required value={assignForm.assignment_date} onChange={e => setAssignForm({...assignForm, assignment_date: e.target.value})} /></div>
                  <div><Label>Expected Return</Label><Input type="date" value={assignForm.expected_return_date} onChange={e => setAssignForm({...assignForm, expected_return_date: e.target.value})} /></div>
                </div>
                <Button type="submit" className="w-full">Assign Dog</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dog</TableHead>
                <TableHead>Foster Family</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Expected Return</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placements.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{dogsMap[p.dog_id] || 'Unknown Dog'}</TableCell>
                  <TableCell>{famMap[p.foster_id] || 'Unknown Family'}</TableCell>
                  <TableCell>{new Date(p.assignment_date).toLocaleDateString()}</TableCell>
                  <TableCell>{p.expected_return_date ? new Date(p.expected_return_date).toLocaleDateString() : 'Indefinite'}</TableCell>
                  <TableCell><span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">{p.status}</span></TableCell>
                </TableRow>
              ))}
              {placements.length === 0 && !loading && <TableRow><TableCell colSpan={5} className="text-center py-4">No active placements</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default FosterFamilyManagementTab;