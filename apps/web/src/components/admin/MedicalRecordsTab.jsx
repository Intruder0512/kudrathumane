import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Download, Trash2, PlusCircle } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const MedicalRecordsTab = ({ dogsMap }) => {
  const [vaccinations, setVaccinations] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [deworming, setDeworming] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [vaxModalOpen, setVaxModalOpen] = useState(false);
  const [dewormModalOpen, setDewormModalOpen] = useState(false);
  const [treatModalOpen, setTreatModalOpen] = useState(false);

  const [vaxForm, setVaxForm] = useState({ dog_id: '', vaccine_name: '', date_administered: '', next_due_date: '', status: 'up to date' });
  
  const [dewormForm, setDewormForm] = useState({
    dog_id: '', deworming_date: new Date().toISOString().split('T')[0], next_due_date: '',
    medication: '', dosage: '', administered_by: '', notes: ''
  });

  const [treatForm, setTreatForm] = useState({
    dog_id: '', condition: '', start_date: new Date().toISOString().split('T')[0],
    treatment_plan: '', frequency: 'daily', vet_name: '', progress_notes: '', end_date: '', outcome: 'ongoing'
  });
  const [medications, setMedications] = useState([{ name: '', dosage: '' }]);

  useEffect(() => {
    fetchMedicalData();
  }, []);

  const fetchMedicalData = async () => {
    setLoading(true);
    try {
      const [vax, treat, deworm] = await Promise.all([
        pb.collection('vaccinations').getFullList({ sort: '-date_administered', $autoCancel: false }),
        pb.collection('treatments').getFullList({ sort: '-start_date', $autoCancel: false }),
        pb.collection('deworming').getFullList({ sort: '-deworming_date', $autoCancel: false })
      ]);
      setVaccinations(vax);
      setTreatments(treat);
      setDeworming(deworm);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch medical records');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVax = async (e) => {
    e.preventDefault();
    try {
      await pb.collection('vaccinations').create(vaxForm, { $autoCancel: false });
      toast.success('Vaccination added');
      setVaxModalOpen(false);
      fetchMedicalData();
    } catch (err) {
      toast.error('Failed to add vaccination');
    }
  };

  const handleDewormDateChange = (e) => {
    const date = e.target.value;
    const nextDate = new Date(date);
    nextDate.setMonth(nextDate.getMonth() + 3);
    setDewormForm({ ...dewormForm, deworming_date: date, next_due_date: nextDate.toISOString().split('T')[0] });
  };

  const handleAddDeworming = async (e) => {
    e.preventDefault();
    try {
      await pb.collection('deworming').create(dewormForm, { $autoCancel: false });
      toast.success('Deworming record added');
      setDewormModalOpen(false);
      fetchMedicalData();
    } catch (err) {
      toast.error('Failed to add deworming record');
    }
  };

  const handleAddTreatment = async (e) => {
    e.preventDefault();
    try {
      const validMeds = medications.filter(m => m.name.trim() !== '');
      await pb.collection('treatments').create({
        ...treatForm,
        medications: JSON.stringify(validMeds)
      }, { $autoCancel: false });
      toast.success('Treatment record added');
      setTreatModalOpen(false);
      fetchMedicalData();
    } catch (err) {
      toast.error('Failed to add treatment record');
    }
  };

  const getAlertColor = (status) => {
    if (status === 'up to date') return 'bg-green-500 text-white';
    if (status === 'due soon') return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Medical Records</h2>
        <Button onClick={() => window.print()} variant="outline">
          <Download className="w-4 h-4 mr-2" /> Export Health Records
        </Button>
      </div>

      <Tabs defaultValue="vaccinations" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
          <TabsTrigger value="deworming">Deworming</TabsTrigger>
        </TabsList>

        <TabsContent value="vaccinations">
          <div className="flex justify-end mb-4">
            <Dialog open={vaxModalOpen} onOpenChange={setVaxModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Vaccination</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Vaccination</DialogTitle></DialogHeader>
                <form onSubmit={handleAddVax} className="space-y-4">
                  <div>
                    <Label>Dog</Label>
                    <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={vaxForm.dog_id} onChange={e => setVaxForm({...vaxForm, dog_id: e.target.value})}>
                      <option value="">Select Dog...</option>
                      {Object.values(dogsMap).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Vaccine Name</Label>
                    <Input required value={vaxForm.vaccine_name} onChange={e => setVaxForm({...vaxForm, vaccine_name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date Administered</Label>
                      <Input type="date" required value={vaxForm.date_administered} onChange={e => setVaxForm({...vaxForm, date_administered: e.target.value})} />
                    </div>
                    <div>
                      <Label>Next Due Date</Label>
                      <Input type="date" required value={vaxForm.next_due_date} onChange={e => setVaxForm({...vaxForm, next_due_date: e.target.value})} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Save</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dog Name</TableHead>
                  <TableHead>Vaccine</TableHead>
                  <TableHead>Administered</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vaccinations.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{dogsMap[v.dog_id]?.name || 'Unknown'}</TableCell>
                    <TableCell>{v.vaccine_name}</TableCell>
                    <TableCell>{new Date(v.date_administered).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(v.next_due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getAlertColor(v.status)}`}>
                        {v.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {vaccinations.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No records</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="treatments">
          <div className="flex justify-end mb-4">
            <Dialog open={treatModalOpen} onOpenChange={setTreatModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Treatment</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Add Treatment Record</DialogTitle></DialogHeader>
                <form onSubmit={handleAddTreatment} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Dog</Label>
                      <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={treatForm.dog_id} onChange={e => setTreatForm({...treatForm, dog_id: e.target.value})}>
                        <option value="">Select Dog...</option>
                        {Object.values(dogsMap).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Condition/Diagnosis</Label>
                      <Input required value={treatForm.condition} onChange={e => setTreatForm({...treatForm, condition: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input type="date" required value={treatForm.start_date} onChange={e => setTreatForm({...treatForm, start_date: e.target.value})} />
                    </div>
                    <div>
                      <Label>End Date (Optional)</Label>
                      <Input type="date" value={treatForm.end_date} onChange={e => setTreatForm({...treatForm, end_date: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <Label>Treatment Plan</Label>
                    <Textarea value={treatForm.treatment_plan} onChange={e => setTreatForm({...treatForm, treatment_plan: e.target.value})} />
                  </div>
                  
                  <div className="space-y-2 border p-4 rounded-lg bg-muted/30">
                    <div className="flex justify-between items-center">
                      <Label>Medications</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => setMedications([...medications, { name: '', dosage: '' }])}>
                        <PlusCircle className="w-4 h-4 mr-1" /> Add Med
                      </Button>
                    </div>
                    {medications.map((med, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input placeholder="Medication Name" value={med.name} onChange={e => {
                          const newMeds = [...medications];
                          newMeds[idx].name = e.target.value;
                          setMedications(newMeds);
                        }} />
                        <Input placeholder="Dosage" value={med.dosage} onChange={e => {
                          const newMeds = [...medications];
                          newMeds[idx].dosage = e.target.value;
                          setMedications(newMeds);
                        }} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setMedications(medications.filter((_, i) => i !== idx))}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Frequency</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={treatForm.frequency} onChange={e => setTreatForm({...treatForm, frequency: e.target.value})}>
                        <option value="daily">Daily</option>
                        <option value="twice daily">Twice Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="as needed">As Needed</option>
                      </select>
                    </div>
                    <div>
                      <Label>Attending Vet</Label>
                      <Input value={treatForm.vet_name} onChange={e => setTreatForm({...treatForm, vet_name: e.target.value})} />
                    </div>
                    <div>
                      <Label>Outcome</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={treatForm.outcome} onChange={e => setTreatForm({...treatForm, outcome: e.target.value})}>
                        <option value="ongoing">Ongoing</option>
                        <option value="recovered">Recovered</option>
                        <option value="referred">Referred</option>
                        <option value="deceased">Deceased</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label>Progress Notes</Label>
                    <Textarea value={treatForm.progress_notes} onChange={e => setTreatForm({...treatForm, progress_notes: e.target.value})} />
                  </div>
                  <Button type="submit" className="w-full">Save Treatment</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dog Name</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Vet Name</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatments.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{dogsMap[t.dog_id]?.name || 'Unknown'}</TableCell>
                    <TableCell>{t.condition}</TableCell>
                    <TableCell>{new Date(t.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{t.vet_name}</TableCell>
                    <TableCell className="capitalize">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.outcome === 'recovered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {t.outcome || 'ongoing'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {treatments.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No records</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="deworming">
          <div className="flex justify-end mb-4">
            <Dialog open={dewormModalOpen} onOpenChange={setDewormModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Deworming</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Deworming Record</DialogTitle></DialogHeader>
                <form onSubmit={handleAddDeworming} className="space-y-4">
                  <div>
                    <Label>Dog</Label>
                    <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={dewormForm.dog_id} onChange={e => setDewormForm({...dewormForm, dog_id: e.target.value})}>
                      <option value="">Select Dog...</option>
                      {Object.values(dogsMap).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Deworming Date</Label>
                      <Input type="date" required value={dewormForm.deworming_date} onChange={handleDewormDateChange} />
                    </div>
                    <div>
                      <Label>Next Due Date</Label>
                      <Input type="date" required value={dewormForm.next_due_date} onChange={e => setDewormForm({...dewormForm, next_due_date: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Medication</Label>
                      <Input required value={dewormForm.medication} onChange={e => setDewormForm({...dewormForm, medication: e.target.value})} />
                    </div>
                    <div>
                      <Label>Dosage</Label>
                      <Input value={dewormForm.dosage} onChange={e => setDewormForm({...dewormForm, dosage: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <Label>Administered By</Label>
                    <Input value={dewormForm.administered_by} onChange={e => setDewormForm({...dewormForm, administered_by: e.target.value})} />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={dewormForm.notes} onChange={e => setDewormForm({...dewormForm, notes: e.target.value})} />
                  </div>
                  <Button type="submit" className="w-full">Save</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dog Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Administered By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deworming.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{dogsMap[d.dog_id]?.name || 'Unknown'}</TableCell>
                    <TableCell>{new Date(d.deworming_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(d.next_due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div>{d.medication}</div>
                      <div className="text-xs text-muted-foreground">{d.dosage}</div>
                    </TableCell>
                    <TableCell>{d.administered_by}</TableCell>
                  </TableRow>
                ))}
                {deworming.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No records</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MedicalRecordsTab;