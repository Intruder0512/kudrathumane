import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Users, Home as HomeIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImpactStats from '@/components/ImpactStats';
import DonationBreakdown from '@/components/DonationBreakdown';
import { INDIAN_STREET_DOGS } from '@/lib/imageUtils';

const HomePage = () => {
  return (
    <>
      <Helmet>
        <title>Kudrat Humane Living Trust - Rescuing and Rehoming Street Dogs in India</title>
        <meta name="description" content="Dedicated to rescuing, rehabilitating, and rehoming street dogs in India. Join us in creating a more compassionate world for our four-legged friends." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-grow">
          <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              <img
                src={INDIAN_STREET_DOGS[0]}
                alt="Rescued Indian street dog at Kudrat Humane Living Trust shelter"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"></div>
            </div>

            <div className="container relative z-10 text-white">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-3xl"
              >
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6" style={{ letterSpacing: '-0.02em' }}>
                  Every dog deserves a loving home
                </h1>
                <p className="text-xl md:text-2xl leading-relaxed mb-8 text-white/90">
                  Join us in rescuing, rehabilitating, and rehoming street dogs across India. Together, we can make a difference.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/adoption">
                    <Button size="lg" className="text-lg px-8">
                      <Heart className="w-5 h-5 mr-2" />
                      Virtual Adoption
                    </Button>
                  </Link>
                  <Link to="/fostering">
                    <Button size="lg" variant="secondary" className="text-lg px-8">
                      <HomeIcon className="w-5 h-5 mr-2" />
                      Become a Foster
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="py-20 bg-background">
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-4">Our mission</h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Founded by Pooja Prasad, Kudrat Humane Living Trust is dedicated to creating a world where every street dog has access to food, shelter, medical care, and love.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <img
                    src={INDIAN_STREET_DOGS[1]}
                    alt="Happy rescued Indian street dog"
                    className="rounded-2xl shadow-xl w-full"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="space-y-6"
                >
                  <h3 className="text-3xl font-bold">Founder's story</h3>
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    Pooja Prasad started Kudrat Humane Living Trust after witnessing the plight of street dogs in her neighborhood. What began as feeding a few strays grew into a full-fledged rescue operation.
                  </p>
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    Today, we work tirelessly to rescue injured and abandoned dogs, provide them with medical care, and find them loving homes through adoption and fostering programs.
                  </p>
                  <Link to="/contact">
                    <Button variant="outline" size="lg">
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </motion.div>
              </div>

              <ImpactStats />
              
              <DonationBreakdown />
            </div>
          </section>

          <section className="py-20 bg-muted">
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-4">How you can help</h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  There are many ways to support our mission and make a difference in the lives of rescued dogs
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-card rounded-2xl p-8 shadow-lg relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none">
                    <img src={INDIAN_STREET_DOGS[2]} alt="" className="w-full h-full object-cover rounded-bl-full" />
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 relative z-10">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-card-foreground relative z-10">Virtual adoption</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6 relative z-10">
                    Support a rescued dog with a monthly contribution starting from ₹5,000. Your donation covers food, medical care, and shelter.
                  </p>
                  <Link to="/adoption" className="relative z-10">
                    <Button>
                      Adopt Virtually
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-card rounded-2xl p-8 shadow-lg relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none">
                    <img src={INDIAN_STREET_DOGS[3]} alt="" className="w-full h-full object-cover rounded-bl-full" />
                  </div>
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 relative z-10">
                    <HomeIcon className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-card-foreground relative z-10">Foster a dog</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6 relative z-10">
                    Provide temporary care for a rescued dog while we find them a permanent home. We cover all medical expenses.
                  </p>
                  <Link to="/fostering" className="relative z-10">
                    <Button variant="secondary">
                      Become a Foster
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-card rounded-2xl p-8 shadow-lg relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none">
                    <img src={INDIAN_STREET_DOGS[4]} alt="" className="w-full h-full object-cover rounded-bl-full" />
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4 relative z-10">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-card-foreground relative z-10">Volunteer</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6 relative z-10">
                    Join our team of volunteers and help with rescue operations, dog care, and community outreach programs.
                  </p>
                  <Link to="/contact" className="relative z-10">
                    <Button variant="outline">
                      Get Involved
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-card rounded-2xl p-8 shadow-lg relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none">
                    <img src={INDIAN_STREET_DOGS[5]} alt="" className="w-full h-full object-cover rounded-bl-full" />
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 relative z-10">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-card-foreground relative z-10">Donate</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6 relative z-10">
                    Make a one-time or recurring donation to support our rescue operations, medical care, and shelter maintenance.
                  </p>
                  <Link to="/fundraising" className="relative z-10">
                    <Button>
                      Donate Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
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

export default HomePage;