import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button.jsx';
import { MapPin, Calendar } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { getDeterministicDogImage } from '@/lib/imageUtils';

const LostFoundPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await pb.collection('lost_found_reports').getFullList({
          filter: 'status="Lost" || status="Found"',
          sort: '-date_reported',
          $autoCancel: false
        });
        setReports(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filteredReports = filter === 'All' ? reports : reports.filter(r => r.type === filter);

  return (
    <>
      <Helmet><title>Lost & Found - Kudrat Humane Living</title></Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow py-12 bg-muted/30">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Lost & Found Pets</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Help us reunite lost pets with their families. Browse recent reports or submit a new one.
              </p>
            </div>

            <div className="flex justify-center space-x-4 mb-8">
              <Button variant={filter === 'All' ? 'default' : 'outline'} onClick={() => setFilter('All')}>All Reports</Button>
              <Button variant={filter === 'Lost' ? 'default' : 'outline'} onClick={() => setFilter('Lost')}>Lost Dogs</Button>
              <Button variant={filter === 'Found' ? 'default' : 'outline'} onClick={() => setFilter('Found')}>Found Dogs</Button>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading reports...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReports.map(r => {
                  const imageUrl = r.photos && r.photos.length > 0 
                    ? pb.files.getUrl(r, r.photos[0]) 
                    : getDeterministicDogImage(r.id);
                  return (
                    <div key={r.id} className="bg-card rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all">
                      <div className="h-48 overflow-hidden relative">
                        <img src={imageUrl} alt="Lost/Found Dog" className="w-full h-full object-cover" />
                        <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-bold text-white rounded ${r.type === 'Lost' ? 'bg-red-500' : 'bg-green-500'}`}>
                          {r.type.toUpperCase()}
                        </div>
                      </div>
                      <div className="p-6">
                        <p className="font-medium mb-4 line-clamp-2">{r.dog_description}</p>
                        <div className="space-y-2 text-sm text-muted-foreground mb-6">
                          <div className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> {r.location}</div>
                          <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> {new Date(r.date_reported).toLocaleDateString()}</div>
                        </div>
                        <Button variant="outline" className="w-full">Contact Us</Button>
                      </div>
                    </div>
                  );
                })}
                {filteredReports.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    No reports found matching your criteria.
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default LostFoundPage;