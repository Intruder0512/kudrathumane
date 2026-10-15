import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ChevronLeft, Heart, Syringe, Activity, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import pb from '@/lib/pocketbaseClient';
import { getDeterministicDogImage } from '@/lib/imageUtils';
import { toast } from 'sonner';

const DogProfilePage = () => {
  const { dogId } = useParams();
  const [dog, setDog] = useState(null);
  const [rescues, setRescues] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDogData = async () => {
      try {
        const d = await pb.collection('dogs').getOne(dogId, { $autoCancel: false });
        setDog(d);
        
        const [r, v] = await Promise.all([
          pb.collection('rescues').getFullList({ filter: `dog_id="${dogId}"`, $autoCancel: false }),
          pb.collection('vaccinations').getFullList({ filter: `dog_id="${dogId}"`, sort: '-date_administered', $autoCancel: false })
        ]);
        setRescues(r);
        setVaccinations(v);
      } catch (error) {
        toast.error('Failed to load dog profile');
      } finally {
        setLoading(false);
      }
    };
    fetchDogData();
  }, [dogId]);

  if (loading || !dog) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container py-12"><Skeleton className="h-[60vh] w-full rounded-2xl" /></main>
        <Footer />
      </div>
    );
  }

  const mainImage = dog.photo ? pb.files.getUrl(dog, dog.photo) : getDeterministicDogImage(dog.id);
  const getHealthBadgeStyle = (status) => `bg-[hsl(var(--status-${status?.replace(/ /g, '-')}))] text-white`;

  return (
    <>
      <Helmet><title>{`${dog.name}'s Medical Profile`} - Kudrat Humane</title></Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow pt-8 pb-20">
          <div className="container max-w-5xl">
            <Link to="/dogs" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to all dogs
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="aspect-square rounded-3xl overflow-hidden bg-muted">
                  <img src={mainImage} alt={dog.name} className="w-full h-full object-cover" />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
                <div className="mb-6">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${getHealthBadgeStyle(dog.health_status)}`}>
                    {dog.health_status}
                  </span>
                  <h1 className="text-4xl md:text-5xl font-bold mb-2">{dog.name}</h1>
                  <p className="text-xl text-muted-foreground">{dog.breed} • {dog.sex} • {dog.age} yrs</p>
                </div>

                <div className="space-y-8 flex-grow">
                  <section>
                    <h3 className="text-lg font-semibold flex items-center mb-3"><MapPin className="w-5 h-5 mr-2 text-primary" /> Rescue Story</h3>
                    {rescues.length > 0 ? (
                      <Card className="bg-muted/50 border-none shadow-none">
                        <CardContent className="p-4 space-y-2 text-sm text-foreground/80 leading-relaxed">
                          <p><strong>Rescued on:</strong> {new Date(rescues[0].rescue_date).toLocaleDateString()}</p>
                          <p><strong>Location:</strong> {rescues[0].rescue_location}</p>
                          <p><strong>Condition:</strong> {rescues[0].intake_condition}</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <p className="text-sm text-muted-foreground">Rescue details are currently being updated.</p>
                    )}
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold flex items-center mb-3"><Syringe className="w-5 h-5 mr-2 text-primary" /> Medical Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm border-b pb-2">
                        <span className="text-muted-foreground">Spay/Neuter</span>
                        <span className="font-medium capitalize">{dog.spay_neuter_status}</span>
                      </div>
                      <div className="pt-2">
                        <p className="text-sm font-medium mb-2">Vaccination Log</p>
                        {vaccinations.length > 0 ? (
                          <div className="space-y-2">
                            {vaccinations.map(v => (
                              <div key={v.id} className="flex justify-between items-center bg-card border rounded-lg p-3 text-sm">
                                <span>{v.vaccine_name}</span>
                                <span className="text-muted-foreground">{new Date(v.date_administered).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No vaccination records available.</p>
                        )}
                      </div>
                    </div>
                  </section>
                </div>

                <div className="mt-12 pt-6 border-t">
                  <Link to="/adoption" state={{ selectedDog: dog }}>
                    <Button size="lg" className="w-full text-lg h-14 rounded-xl shadow-lg hover:shadow-xl transition-all">
                      <Heart className="w-5 h-5 mr-2" /> Virtually Adopt {dog.name}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default DogProfilePage;