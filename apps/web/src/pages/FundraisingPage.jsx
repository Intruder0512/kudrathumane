import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Heart, Stethoscope, Home, Utensils } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FundraisingQRCode from '@/components/FundraisingQRCode';

const FundraisingPage = () => {
  return (
    <>
      <Helmet>
        <title>Fundraising - Kudrat Humane Living Trust</title>
        <meta name="description" content="Support our mission to rescue and rehabilitate street dogs. Your donations help provide medical care, food, and shelter for dogs in need." />
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
                  Support our mission
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Your donations help us rescue, rehabilitate, and rehome street dogs across India
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-3xl font-bold mb-6">Where your money goes</h2>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Stethoscope className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Medical care</h3>
                          <p className="text-muted-foreground">Veterinary treatments, vaccinations, surgeries, and emergency care for injured dogs</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Utensils className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Food and nutrition</h3>
                          <p className="text-muted-foreground">Quality dog food, supplements, and special diets for recovering dogs</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Home className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Shelter maintenance</h3>
                          <p className="text-muted-foreground">Safe housing, bedding, cleaning supplies, and facility upkeep</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Heart className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Rescue operations</h3>
                          <p className="text-muted-foreground">Transportation, rescue equipment, and emergency response for street dogs</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <FundraisingQRCode />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-card rounded-2xl p-8 shadow-lg text-center"
              >
                <h2 className="text-2xl font-bold mb-4 text-card-foreground">Other ways to contribute</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Besides monetary donations, you can also support us by donating supplies, volunteering your time, or spreading awareness about our mission.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="bg-muted rounded-xl px-6 py-3">
                    <span className="font-medium">Dog food</span>
                  </div>
                  <div className="bg-muted rounded-xl px-6 py-3">
                    <span className="font-medium">Blankets</span>
                  </div>
                  <div className="bg-muted rounded-xl px-6 py-3">
                    <span className="font-medium">Toys</span>
                  </div>
                  <div className="bg-muted rounded-xl px-6 py-3">
                    <span className="font-medium">Medical supplies</span>
                  </div>
                  <div className="bg-muted rounded-xl px-6 py-3">
                    <span className="font-medium">Cleaning products</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FundraisingPage;