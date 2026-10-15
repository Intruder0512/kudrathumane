import React from 'react';
import { Heart, Users, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const ImpactStats = () => {
  const stats = [
    { icon: Heart, value: '25+', label: 'Dogs rescued' },
    { icon: Users, value: '18', label: 'Virtual adoptions' },
    { icon: Home, value: '12', label: 'Dogs fostered' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-card rounded-xl p-6 text-center shadow-lg"
        >
          <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
          <div className="text-3xl font-bold text-card-foreground mb-1">{stat.value}</div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
};

export default ImpactStats;