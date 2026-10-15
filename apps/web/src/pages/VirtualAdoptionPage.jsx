import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VirtualAdoptionFlow from '@/components/VirtualAdoptionFlow';

const VirtualAdoptionPage = () => {
  return (
    <>
      <Helmet>
        <title>Virtual Adoption - Kudrat Humane Living Trust</title>
        <meta name="description" content="Support a rescued dog through virtual adoption. Your monthly contribution helps provide food, medical care, and shelter for dogs in need." />
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
                  Virtual adoption program
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Support a rescued dog with a monthly contribution. Your donation covers food, medical care, and shelter expenses.
                </p>
              </motion.div>

              <div className="max-w-5xl mx-auto">
                <VirtualAdoptionFlow />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mt-16 bg-muted rounded-2xl p-8"
              >
                <h2 className="text-2xl font-bold mb-4">How virtual adoption works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-4xl font-bold text-primary mb-2">1</div>
                    <h3 className="text-lg font-semibold mb-2">Choose a dog</h3>
                    <p className="text-sm text-muted-foreground">Select a rescued dog you'd like to support from our available dogs</p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-primary mb-2">2</div>
                    <h3 className="text-lg font-semibold mb-2">Set your contribution</h3>
                    <p className="text-sm text-muted-foreground">Choose a monthly amount starting from ₹5,000 or set a custom amount</p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-primary mb-2">3</div>
                    <h3 className="text-lg font-semibold mb-2">Make a difference</h3>
                    <p className="text-sm text-muted-foreground">Receive monthly updates about your adopted dog's progress and well-being</p>
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

export default VirtualAdoptionPage;