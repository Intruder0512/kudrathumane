import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Package } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const InKindDonationsTab = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    donor_name: '',
    donation_date: new Date().toISOString().split('T')[0],
    donation_type: 'Food',
    quantity: '',
    unit: 'kg',
    estimated_value: ''
  });

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('in_kind_donations').getFullList({ sort: '-donation_date', $autoCancel: false });
      setDonations(records);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await pb.collection('in_kind_donations').create({
        ...formData,
        quantity: Number(formData.quantity),
        estimated_value: Number(formData.estimated_value)
      }, { $autoCancel: false });
      toast.success('Donation added successfully');
      setIsModalOpen(false);
      fetchDonations();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add donation');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">In-Kind Donations</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Donation</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add In-Kind Donation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Donor Name</Label>
                <Input required value={formData.donor_name} onChange={e => setFormData({...formData, donor_name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={formData.donation_type} onChange={e => setFormData({...formData, donation_type: e.target.value})}>
                    <option value="Food">Food</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Bedding">Bedding</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" required value={formData.donation_date} onChange={e => setFormData({...formData, donation_date: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input type="number" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                </div>
                <div>
                  <Label>Unit</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option value="kg">kg</option>
                    <option value="pieces">pieces</option>
                    <option value="boxes">boxes</option>
                  </select>
                </div>
                <div>
                  <Label>Est. Value (₹)</Label>
                  <Input type="number" required value={formData.estimated_value} onChange={e => setFormData({...formData, estimated_value: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full">Save Donation</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Est. Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.map(d => (
              <TableRow key={d.id}>
                <TableCell>{new Date(d.donation_date).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{d.donor_name}</TableCell>
                <TableCell>{d.donation_type}</TableCell>
                <TableCell>{d.quantity} {d.unit}</TableCell>
                <TableCell>₹{d.estimated_value}</TableCell>
              </TableRow>
            ))}
            {donations.length === 0 && !loading && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No donations recorded yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InKindDonationsTab;