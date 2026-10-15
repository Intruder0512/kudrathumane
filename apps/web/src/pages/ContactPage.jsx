import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContactForm from '@/components/ContactForm';
import LocationMap from '@/components/LocationMap';

const ContactPage = () => {
  return (
    <>
      <Helmet>
        <title>Contact Us - Kudrat Humane Living Trust</title>
        <meta name="description" content="Get in touch with Kudrat Humane Living Trust. Visit our shelter, call us, or send us a message. We're here to help." />
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
                  Get in touch
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Have questions about adoption, fostering, or volunteering? We'd love to hear from you.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-3xl font-bold mb-6">Contact information</h2>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-1">Address</h3>
                          <p className="text-muted-foreground">Kudrat Humane Living Trust<br />India</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Phone className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-1">Phone</h3>
                          <p className="text-muted-foreground">+91 98765 43210</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Mail className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-1">Email</h3>
                          <p className="text-muted-foreground">info@kudrathumane.org</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Clock className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-1">Visiting hours</h3>
                          <p className="text-muted-foreground">Monday - Saturday: 9:00 AM - 6:00 PM<br />Sunday: 10:00 AM - 4:00 PM</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-card rounded-2xl p-8 shadow-lg"
                >
                  <h2 className="text-2xl font-bold mb-6 text-card-foreground">Send us a message</h2>
                  <ContactForm />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl font-bold mb-6 text-center">Visit our shelter</h2>
                <LocationMap />
              </motion.div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ContactPage;