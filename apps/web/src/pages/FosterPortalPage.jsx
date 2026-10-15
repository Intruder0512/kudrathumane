import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import pb from '@/lib/pocketbaseClient';
import { getDeterministicDogImage } from '@/lib/imageUtils';
import { toast } from 'sonner';

const FosterPortalPage = () => {
  const { currentUser } = useAuth();
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateForm, setUpdateForm] = useState({
    weight: '', health_notes: '', behavior_notes: '', mood_level: 'Normal'
  });

  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        const res = await pb.collection('foster_placements').getFullList({
          filter: 'status="Active"',
          expand: 'dog_id',
          $autoCancel: false
        });
        setPlacements(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlacements();
  }, []);

  const handleSubmitUpdate = async (e, placementId) => {
    e.preventDefault();
    try {
      await pb.collection('foster_updates').create({
        placement_id: placementId,
        date: new Date().toISOString().split('T')[0],
        weight: Number(updateForm.weight),
        health_notes: updateForm.health_notes,
        behavior_notes: updateForm.behavior_notes,
        mood_level: updateForm.mood_level,
        created_by: currentUser.id
      }, { $autoCancel: false });
      toast.success('Update submitted successfully');
      setUpdateForm({ weight: '', health_notes: '', behavior_notes: '', mood_level: 'Normal' });
    } catch (err) {
      toast.error('Failed to submit update');
    }
  };

  return (
    <>
      <Helmet><title>Foster Portal - Kudrat Humane Living</title></Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow py-12 bg-muted/30">
          <div className="container max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Foster Family Portal</h1>
            
            {loading ? (
              <p>Loading your placements...</p>
            ) : placements.length === 0 ? (
              <div className="bg-card p-8 rounded-xl border text-center">
                <p className="text-muted-foreground">You currently have no active foster placements.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {placements.map(p => {
                  const dog = p.expand?.dog_id;
                  const imageUrl = dog?.photo ? pb.files.getUrl(dog, dog.photo) : getDeterministicDogImage(dog?.id);
                  return (
                    <div key={p.id} className="bg-card rounded-xl border p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <img src={imageUrl} alt={dog?.name} className="w-16 h-16 rounded-full object-cover" />
                          <h2 className="text-2xl font-semibold">Fostering: {dog?.name || 'Unknown Dog'}</h2>
                        </div>
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Active</span>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <h3 className="font-medium mb-4">Submit Daily Update</h3>
                          <form onSubmit={(e) => handleSubmitUpdate(e, p.id)} className="space-y-4">
                            <div>
                              <Label>Weight (kg)</Label>
                              <Input type="number" step="0.1" value={updateForm.weight} onChange={e => setUpdateForm({...updateForm, weight: e.target.value})} />
                            </div>
                            <div>
                              <Label>Mood Level</Label>
                              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={updateForm.mood_level} onChange={e => setUpdateForm({...updateForm, mood_level: e.target.value})}>
                                <option>Energetic</option><option>Normal</option><option>Lethargic</option><option>Playful</option>
                              </select>
                            </div>
                            <div>
                              <Label>Health Notes</Label>
                              <Textarea value={updateForm.health_notes} onChange={e => setUpdateForm({...updateForm, health_notes: e.target.value})} />
                            </div>
                            <div>
                              <Label>Behavior Notes</Label>
                              <Textarea value={updateForm.behavior_notes} onChange={e => setUpdateForm({...updateForm, behavior_notes: e.target.value})} />
                            </div>
                            <Button type="submit" className="w-full">Submit Update</Button>
                          </form>
                        </div>
                        
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h3 className="font-medium mb-2">Care Instructions</h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {p.special_care_instructions || 'No special instructions provided.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default FosterPortalPage;