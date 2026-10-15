import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Send, Download } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { toast } from 'sonner';

const AdoptionCertificatesTab = () => {
  const [certificates, setCertificates] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    adopter_name: '', dog_id: '', adoption_date: new Date().toISOString().split('T')[0], custom_message: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [certRes, dogRes] = await Promise.all([
        pb.collection('adoption_certificates').getFullList({ sort: '-created', $autoCancel: false }),
        pb.collection('dogs').getFullList({ filter: 'status="Adopted"', sort: 'name', $autoCancel: false })
      ]);
      setCertificates(certRes);
      setDogs(dogRes);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const response = await apiServerClient.fetch('/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Certificate generated successfully');
        setIsModalOpen(false);
        fetchData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async (certId) => {
    try {
      const email = prompt("Enter adopter's email address:");
      if (!email) return;
      
      const response = await apiServerClient.fetch('/certificates/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificate_id: certId, adopter_email: email })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Certificate sent successfully');
        fetchData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send certificate');
    }
  };

  const dogsMap = dogs.reduce((acc, d) => ({ ...acc, [d.id]: d.name }), {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Adoption Certificates</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild><Button><FileText className="w-4 h-4 mr-2" /> Generate Certificate</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Generate Certificate</DialogTitle></DialogHeader>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div><Label>Adopter Name</Label><Input required value={formData.adopter_name} onChange={e => setFormData({...formData, adopter_name: e.target.value})} /></div>
              <div>
                <Label>Dog</Label>
                <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.dog_id} onChange={e => setFormData({...formData, dog_id: e.target.value})}>
                  <option value="">Select adopted dog...</option>
                  {dogs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div><Label>Adoption Date</Label><Input type="date" required value={formData.adoption_date} onChange={e => setFormData({...formData, adoption_date: e.target.value})} /></div>
              <div><Label>Custom Message (Optional)</Label><Input value={formData.custom_message} onChange={e => setFormData({...formData, custom_message: e.target.value})} /></div>
              <Button type="submit" className="w-full" disabled={generating}>{generating ? 'Generating...' : 'Generate PDF'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Adopter</TableHead>
              <TableHead>Dog</TableHead>
              <TableHead>Adoption Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certificates.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.adopter_name}</TableCell>
                <TableCell>{dogsMap[c.dog_id] || 'Unknown'}</TableCell>
                <TableCell>{new Date(c.adoption_date).toLocaleDateString()}</TableCell>
                <TableCell><span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">{c.status}</span></TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleSend(c.id)}><Send className="w-4 h-4 mr-1" /> Send</Button>
                </TableCell>
              </TableRow>
            ))}
            {certificates.length === 0 && !loading && <TableRow><TableCell colSpan={5} className="text-center py-4">No certificates generated</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdoptionCertificatesTab;