import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Share2, Sparkles } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { toast } from 'sonner';

const SocialMediaTab = () => {
  const [content, setContent] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    dog_id: '', story_type: 'rescue', tone: 'heartwarming'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contentRes, dogRes] = await Promise.all([
        pb.collection('social_media_content').getFullList({ sort: '-created', $autoCancel: false }),
        pb.collection('dogs').getFullList({ sort: 'name', $autoCancel: false })
      ]);
      setContent(contentRes);
      setDogs(dogRes);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const response = await apiServerClient.fetch('/social-media/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        // Save to pocketbase
        await pb.collection('social_media_content').create({
          dog_id: formData.dog_id,
          story_type: formData.story_type,
          tone: formData.tone,
          story_text: data.storyText,
          instagram_caption: data.instagramCaption,
          facebook_post: data.facebookPost,
          twitter_post: data.twitterPost,
          status: 'Draft',
          platform: 'All'
        }, { $autoCancel: false });
        
        toast.success('Content generated successfully');
        setIsModalOpen(false);
        fetchData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  const dogsMap = dogs.reduce((acc, d) => ({ ...acc, [d.id]: d.name }), {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Social Media Content</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild><Button><Sparkles className="w-4 h-4 mr-2" /> Generate Story</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Generate AI Story</DialogTitle></DialogHeader>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <Label>Dog</Label>
                <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.dog_id} onChange={e => setFormData({...formData, dog_id: e.target.value})}>
                  <option value="">Select dog...</option>
                  {dogs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Story Type</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.story_type} onChange={e => setFormData({...formData, story_type: e.target.value})}>
                    <option value="rescue">Rescue</option><option value="adoption">Adoption</option><option value="medical">Medical</option>
                  </select>
                </div>
                <div>
                  <Label>Tone</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.tone} onChange={e => setFormData({...formData, tone: e.target.value})}>
                    <option value="heartwarming">Heartwarming</option><option value="inspiring">Inspiring</option><option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={generating}>{generating ? 'Generating...' : 'Generate Content'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dog</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Tone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {content.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{dogsMap[c.dog_id] || 'Unknown'}</TableCell>
                <TableCell className="capitalize">{c.story_type}</TableCell>
                <TableCell className="capitalize">{c.tone}</TableCell>
                <TableCell><span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">{c.status}</span></TableCell>
                <TableCell>{new Date(c.created).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {content.length === 0 && !loading && <TableRow><TableCell colSpan={5} className="text-center py-4">No content generated</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SocialMediaTab;