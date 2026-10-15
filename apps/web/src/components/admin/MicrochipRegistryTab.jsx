import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const MicrochipRegistryTab = () => {
  const [microchips, setMicrochips] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    dog_id: '',
    microchip_number: '',
    brand: 'HomeAgain',
    implant_date: new Date().toISOString().split('T')[0],
    implant_vet: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chipRecords, dogRecords] = await Promise.all([
        pb.collection('microchips').getFullList({ sort: '-implant_date', $autoCancel: false }),
        pb.collection('dogs').getFullList({ sort: 'name', $autoCancel: false })
      ]);
      setMicrochips(chipRecords);
      setDogs(dogRecords);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch microchip data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await pb.collection('microchips').create(formData, { $autoCancel: false });
      toast.success('Microchip registered successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to register microchip');
    }
  };

  const dogsMap = dogs.reduce((acc, dog) => ({ ...acc, [dog.id]: dog.name }), {});
  
  const filteredChips = microchips.filter(c => 
    c.microchip_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dogsMap[c.dog_id] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Microchip Registry</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Register Microchip</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Microchip</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Dog</Label>
                <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={formData.dog_id} onChange={e => setFormData({...formData, dog_id: e.target.value})}>
                  <option value="">Select a dog...</option>
                  {dogs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Microchip Number</Label>
                <Input required value={formData.microchip_number} onChange={e => setFormData({...formData, microchip_number: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Brand</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                    <option value="HomeAgain">HomeAgain</option>
                    <option value="AKC Reunite">AKC Reunite</option>
                    <option value="PetLink">PetLink</option>
                    <option value="24PetWatch">24PetWatch</option>
                  </select>
                </div>
                <div>
                  <Label>Implant Date</Label>
                  <Input type="date" required value={formData.implant_date} onChange={e => setFormData({...formData, implant_date: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Implant Vet</Label>
                <Input required value={formData.implant_vet} onChange={e => setFormData({...formData, implant_vet: e.target.value})} />
              </div>
              <Button type="submit" className="w-full">Save Registration</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search by chip number or dog name..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dog Name</TableHead>
              <TableHead>Microchip Number</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Implant Date</TableHead>
              <TableHead>Vet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChips.map(chip => (
              <TableRow key={chip.id}>
                <TableCell className="font-medium">{dogsMap[chip.dog_id] || 'Unknown'}</TableCell>
                <TableCell className="font-mono">{chip.microchip_number}</TableCell>
                <TableCell>{chip.brand}</TableCell>
                <TableCell>{new Date(chip.implant_date).toLocaleDateString()}</TableCell>
                <TableCell>{chip.implant_vet}</TableCell>
              </TableRow>
            ))}
            {filteredChips.length === 0 && !loading && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No microchips found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MicrochipRegistryTab;