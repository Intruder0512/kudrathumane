import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Stethoscope, Home, Utensils } from 'lucide-react';

const DonationBreakdown = () => {
  const categories = [
    {
      icon: Stethoscope,
      title: 'Medical care',
      description: 'Veterinary treatments, vaccinations, surgeries, and emergency care for injured dogs.',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      icon: Utensils,
      title: 'Food and nutrition',
      description: 'Quality dog food, supplements, and special diets for recovering dogs.',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      icon: Home,
      title: 'Shelter maintenance',
      description: 'Safe housing, bedding, cleaning supplies, and facility upkeep.',
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      icon: Heart,
      title: 'Rescue operations',
      description: 'Transportation, rescue equipment, and emergency response for street dogs.',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }
  ];

  return (
    <div className="mt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Where your donations go</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Every contribution directly impacts the lives of street dogs. Here is how we utilize your generous support.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category, index) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-card rounded-2xl p-6 shadow-lg border border-border/50 hover:-translate-y-1 transition-transform duration-300"
          >
            <div className={`w-12 h-12 ${category.bgColor} rounded-xl flex items-center justify-center mb-4`}>
              <category.icon className={`w-6 h-6 ${category.color}`} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-card-foreground">{category.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {category.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DonationBreakdown;