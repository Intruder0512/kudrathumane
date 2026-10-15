import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, AlertTriangle } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const InventoryTrackerTab = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Food',
    quantity: '',
    unit: 'kg',
    reorder_level: ''
  });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('inventory').getFullList({ sort: 'name', $autoCancel: false });
      setInventory(records);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await pb.collection('inventory').create({
        ...formData,
        quantity: Number(formData.quantity),
        reorder_level: Number(formData.reorder_level)
      }, { $autoCancel: false });
      toast.success('Item added successfully');
      setIsModalOpen(false);
      fetchInventory();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add item');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventory Tracker</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Item Name</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <Label>Category</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Food">Food</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Bedding">Bedding</option>
                  <option value="Toys">Toys</option>
                  <option value="Equipment">Equipment</option>
                </select>
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
                    <option value="liters">liters</option>
                    <option value="pieces">pieces</option>
                  </select>
                </div>
                <div>
                  <Label>Reorder Level</Label>
                  <Input type="number" required value={formData.reorder_level} onChange={e => setFormData({...formData, reorder_level: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full">Save Item</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map(item => {
              const isLow = item.quantity <= item.reorder_level;
              return (
                <TableRow key={item.id} className={isLow ? "bg-destructive/10" : ""}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.quantity} {item.unit}</TableCell>
                  <TableCell>
                    {isLow ? (
                      <span className="flex items-center text-destructive text-sm font-medium">
                        <AlertTriangle className="w-4 h-4 mr-1" /> Low Stock
                      </span>
                    ) : (
                      <span className="text-green-600 text-sm font-medium">In Stock</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {inventory.length === 0 && !loading && (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No inventory items found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InventoryTrackerTab;