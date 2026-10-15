import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DogCard from '@/components/DogCard';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const DogsPage = () => {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [healthFilter, setHealthFilter] = useState('all');

  useEffect(() => {
    fetchDogs();
  }, []);

  const fetchDogs = async () => {
    try {
      const records = await pb.collection('dogs').getFullList({ sort: '-created', $autoCancel: false });
      setDogs(records);
    } catch (error) {
      toast.error('Failed to load dogs');
    } finally {
      setLoading(false);
    }
  };

  const filteredDogs = dogs.filter(dog => healthFilter === 'all' || dog.health_status === healthFilter);

  return (
    <>
      <Helmet><title>Meet Our Rescues - Kudrat Humane Living</title></Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow py-20 bg-background">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Meet our rescues</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Follow their medical journeys from rescue to recovery, and find your perfect virtual adoption match.</p>
            </motion.div>

            <div className="flex justify-end mb-8">
              <Select value={healthFilter} onValueChange={setHealthFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Health Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {['rescued', 'under assessment', 'under treatment', 'recovering', 'ready for adoption', 'adopted', 'fostered'].map(v => (
                    <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-96 w-full rounded-2xl" />)}
              </div>
            ) : filteredDogs.length === 0 ? (
              <div className="text-center py-20 bg-muted rounded-2xl">
                <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-2xl font-bold">No dogs found</h3>
                <p className="text-muted-foreground">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredDogs.map((dog, index) => (
                  <motion.div key={dog.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                    <DogCard dog={dog} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default DogsPage;