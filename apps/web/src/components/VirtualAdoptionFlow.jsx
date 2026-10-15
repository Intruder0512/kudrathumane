import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, IndianRupee } from 'lucide-react';
import { getDeterministicDogImage } from '@/lib/imageUtils';

const VirtualAdoptionFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDog, setSelectedDog] = useState(location.state?.selectedDog || null);
  const [monthlyAmount, setMonthlyAmount] = useState('5000');
  const [userDetails, setUserDetails] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDogs();
  }, []);

  const fetchDogs = async () => {
    try {
      const records = await pb.collection('dogs').getFullList({
        filter: 'status = "Available"',
        sort: 'name',
        $autoCancel: false
      });
      setDogs(records);
    } catch (error) {
      console.error('Error fetching dogs:', error);
      toast('Failed to load dogs');
    } finally {
      setLoading(false);
    }
  };

  const handleAdopt = async () => {
    if (!selectedDog) {
      toast('Please select a dog to adopt');
      return;
    }

    if (!currentUser) {
      toast('Please login to continue');
      navigate('/login');
      return;
    }

    const amount = parseFloat(monthlyAmount);
    if (amount < 5000) {
      toast('Minimum monthly contribution is ₹5,000');
      return;
    }

    setProcessing(true);

    try {
      const adoption = await pb.collection('virtual_adoptions').create({
        user_id: currentUser.id,
        dog_id: selectedDog.id,
        monthly_amount: amount,
        payment_status: 'pending'
      }, { $autoCancel: false });

      const amountInPaise = amount * 100;

      const response = await apiServerClient.fetch('/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInPaise,
          dogName: selectedDog.name,
          userEmail: currentUser.email,
          successUrl: window.location.origin + '/adoption/success?session_id={CHECKOUT_SESSION_ID}&adoption_id=' + adoption.id,
          cancelUrl: window.location.origin + '/adoption'
        })
      });

      if (!response.ok) {
        throw new Error('Payment setup failed');
      }

      const data = await response.json();
      window.open(data.url, '_blank');
      
      toast('Redirecting to payment...');
    } catch (error) {
      console.error('Error creating adoption:', error);
      toast('Failed to process adoption. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!selectedDog ? (
        <>
          <div>
            <h2 className="text-3xl font-bold mb-2">Select a Dog to Adopt</h2>
            <p className="text-muted-foreground">Choose a furry friend to support through virtual adoption</p>
          </div>

          {dogs.length === 0 ? (
            <div className="text-center py-12 bg-muted rounded-2xl">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">No dogs available for adoption at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dogs.map((dog) => {
                const imageUrl = dog.photo ? pb.files.getUrl(dog, dog.photo) : getDeterministicDogImage(dog.id);
                return (
                  <div
                    key={dog.id}
                    onClick={() => setSelectedDog(dog)}
                    className="bg-card rounded-xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <img src={imageUrl} alt={dog.name} className="w-full h-48 object-cover" />
                    <div className="p-4">
                      <h3 className="text-xl font-bold text-card-foreground">{dog.name}</h3>
                      <p className="text-sm text-muted-foreground">{dog.breed}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bg-card rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-card-foreground">Adopting {selectedDog.name}</h2>
            <Button variant="outline" onClick={() => setSelectedDog(null)} size="sm">
              Choose Different Dog
            </Button>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-card-foreground">Monthly Contribution</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={monthlyAmount === '5000' ? 'default' : 'outline'}
                  onClick={() => setMonthlyAmount('5000')}
                >
                  ₹5,000
                </Button>
                <Button
                  variant={monthlyAmount === '10000' ? 'default' : 'outline'}
                  onClick={() => setMonthlyAmount('10000')}
                >
                  ₹10,000
                </Button>
                <Button
                  variant={monthlyAmount === '15000' ? 'default' : 'outline'}
                  onClick={() => setMonthlyAmount('15000')}
                >
                  ₹15,000
                </Button>
              </div>
              <div>
                <Label htmlFor="customAmount">Custom Amount (minimum ₹5,000)</Label>
                <div className="relative mt-2">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="customAmount"
                    type="number"
                    min="5000"
                    step="100"
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(e.target.value)}
                    className="pl-10 text-foreground"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-card-foreground">Your Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={userDetails.name}
                  onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                  required
                  className="mt-2 text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userDetails.email}
                  onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                  required
                  className="mt-2 text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={userDetails.phone}
                  onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                  required
                  className="mt-2 text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={userDetails.address}
                  onChange={(e) => setUserDetails({ ...userDetails, address: e.target.value })}
                  required
                  className="mt-2 text-foreground"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleAdopt} disabled={processing} size="lg" className="w-full">
            {processing ? 'Processing...' : `Proceed to Payment (₹${monthlyAmount}/month)`}
          </Button>
        </>
      )}
    </div>
  );
};

export default VirtualAdoptionFlow;