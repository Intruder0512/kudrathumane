import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, MapPin } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { toast } from 'sonner';

const LostFoundManagementTab = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportType, setReportType] = useState('Lost');

  const [formData, setFormData] = useState({
    type: 'Lost', dog_description: '', location: '', date_reported: new Date().toISOString().split('T')[0],
    reporter_name: '', reporter_contact: '', status: 'Lost'
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await pb.collection('lost_found_reports').getFullList({ sort: '-date_reported', $autoCancel: false });
      setReports(res);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await pb.collection('lost_found_reports').create({
        ...formData,
        type: reportType,
        status: reportType === 'Lost' ? 'Lost' : 'Found'
      }, { $autoCancel: false });
      toast.success('Report added successfully');
      setIsModalOpen(false);
      fetchReports();
    } catch (err) {
      toast.error('Failed to add report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lost & Found</h2>
        <div className="space-x-2">
          <Button onClick={() => { setReportType('Lost'); setIsModalOpen(true); }} variant="destructive">
            <Plus className="w-4 h-4 mr-2" /> Report Lost
          </Button>
          <Button onClick={() => { setReportType('Found'); setIsModalOpen(true); }} variant="secondary">
            <Plus className="w-4 h-4 mr-2" /> Report Found
          </Button>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Report {reportType} Dog</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Description</Label><Input required value={formData.dog_description} onChange={e => setFormData({...formData, dog_description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Location</Label><Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
              <div><Label>Date</Label><Input type="date" required value={formData.date_reported} onChange={e => setFormData({...formData, date_reported: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Reporter Name</Label><Input required value={formData.reporter_name} onChange={e => setFormData({...formData, reporter_name: e.target.value})} /></div>
              <div><Label>Contact</Label><Input required value={formData.reporter_contact} onChange={e => setFormData({...formData, reporter_contact: e.target.value})} /></div>
            </div>
            <Button type="submit" className="w-full">Save Report</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map(r => (
              <TableRow key={r.id}>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${r.type === 'Lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {r.type}
                  </span>
                </TableCell>
                <TableCell className="max-w-xs truncate">{r.dog_description}</TableCell>
                <TableCell><div className="flex items-center text-sm"><MapPin className="w-3 h-3 mr-1" /> {r.location}</div></TableCell>
                <TableCell>{new Date(r.date_reported).toLocaleDateString()}</TableCell>
                <TableCell>{r.status}</TableCell>
              </TableRow>
            ))}
            {reports.length === 0 && !loading && <TableRow><TableCell colSpan={5} className="text-center py-4">No reports found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LostFoundManagementTab;