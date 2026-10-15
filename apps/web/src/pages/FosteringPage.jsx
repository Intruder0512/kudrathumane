import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Home, Heart, Shield, Users } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FosteringForm from '@/components/FosteringForm';
import { INDIAN_STREET_DOGS } from '@/lib/imageUtils';

const FosteringPage = () => {
  return (
    <>
      <Helmet>
        <title>Fostering Program - Kudrat Humane Living Trust</title>
        <meta name="description" content="Become a foster parent for rescued dogs. Provide temporary care while we find them permanent homes. All medical expenses covered." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-grow">
          <section className="py-20 bg-background">
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
                  Become a foster parent
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Provide temporary care for a rescued Indian street dog while we find them a permanent home. We cover all medical expenses.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-8"
                >
                  <div className="rounded-2xl overflow-hidden shadow-lg mb-8">
                    <img src={INDIAN_STREET_DOGS[3]} alt="Happy fostered Indian street dog" className="w-full h-64 object-cover" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-6">Why foster?</h2>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Heart className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Save a life</h3>
                          <p className="text-muted-foreground">Give a rescued dog a safe, loving environment while they recover and prepare for adoption</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Shield className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">No medical costs</h3>
                          <p className="text-muted-foreground">We cover all veterinary expenses, vaccinations, and medical treatments</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Users className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Full support</h3>
                          <p className="text-muted-foreground">Our team provides guidance, training resources, and 24/7 support</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Home className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Flexible commitment</h3>
                          <p className="text-muted-foreground">Foster for as long as you can, from a few weeks to several months</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-4">What we provide</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        All medical care and vaccinations
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        Food and supplies
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        Training resources and guidance
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        24/7 emergency support
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        Help finding permanent homes
                      </li>
                    </ul>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-card rounded-2xl p-8 shadow-lg"
                >
                  <h2 className="text-2xl font-bold mb-6 text-card-foreground">Apply to foster</h2>
                  <FosteringForm />
                </motion.div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FosteringPage;