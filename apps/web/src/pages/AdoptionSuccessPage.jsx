import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import apiServerClient from '@/lib/apiServerClient';
import pb from '@/lib/pocketbaseClient';
import { INDIAN_STREET_DOGS } from '@/lib/imageUtils';

const AdoptionSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const adoptionId = searchParams.get('adoption_id');
  const [payment, setPayment] = useState(null);
  const [adoption, setAdoption] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId && adoptionId) {
      fetchPaymentDetails();
    }
  }, [sessionId, adoptionId]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await apiServerClient.fetch(`/stripe/session/${sessionId}`);
      const paymentData = await response.json();
      setPayment(paymentData);

      const adoptionData = await pb.collection('virtual_adoptions').getOne(adoptionId, { $autoCancel: false });
      setAdoption(adoptionData);

      await pb.collection('virtual_adoptions').update(adoptionId, {
        payment_status: 'active'
      }, { $autoCancel: false });
    } catch (error) {
      console.error('Error fetching payment details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="container max-w-2xl">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Adoption Successful - Kudrat Humane Living Trust</title>
        <meta name="description" content="Thank you for your virtual adoption. Your support helps us rescue and care for street dogs." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-grow flex items-center justify-center py-20">
          <div className="container max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-card rounded-2xl p-8 shadow-lg text-center overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-32 opacity-20 pointer-events-none">
                <img src={INDIAN_STREET_DOGS[4]} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card"></div>
              </div>
              
              <div className="relative z-10">
                <CheckCircle className="w-20 h-20 text-accent mx-auto mb-6" />
                <h1 className="text-4xl font-bold mb-4 text-card-foreground">Virtual adoption successful</h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Thank you for supporting our mission to rescue and care for street dogs
                </p>

                {payment && adoption && (
                  <div className="bg-muted rounded-xl p-6 mb-8 text-left">
                    <h2 className="text-lg font-bold mb-4">Adoption details</h2>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly contribution:</span>
                        <span className="font-medium text-card-foreground">₹{(payment.amountTotal / 100).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment status:</span>
                        <span className="font-medium text-accent capitalize">{payment.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium text-card-foreground">{payment.customerEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subscription ID:</span>
                        <span className="font-medium text-card-foreground font-mono text-xs">{payment.subscriptionId}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-primary/5 rounded-xl p-6 mb-8">
                  <Heart className="w-8 h-8 text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    You will receive monthly updates about your adopted dog's progress and well-being. Your contribution makes a real difference in their life.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/dogs">
                    <Button variant="outline" size="lg">
                      View All Dogs
                    </Button>
                  </Link>
                  <Link to="/">
                    <Button size="lg">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AdoptionSuccessPage;