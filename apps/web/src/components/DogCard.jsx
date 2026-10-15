import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import pb from '@/lib/pocketbaseClient';
import { getDeterministicDogImage } from '@/lib/imageUtils';

const DogCard = ({ dog }) => {
  const imageUrl = dog.photo ? pb.files.getUrl(dog, dog.photo) : getDeterministicDogImage(dog.id);
  
  const getHealthBadgeStyle = (status) => {
    const slug = status?.replace(/ /g, '-');
    return `bg-[hsl(var(--status-${slug}))] text-white`;
  };

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full border">
      <Link to={`/dogs/${dog.id}`} className="relative h-64 overflow-hidden block group">
        <img
          src={imageUrl}
          alt={`${dog.name} - ${dog.breed}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold shadow-sm ${getHealthBadgeStyle(dog.health_status)}`}>
            {dog.health_status}
          </span>
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-bold text-card-foreground">{dog.name}</h3>
          <span className="text-xs flex items-center bg-muted px-2 py-1 rounded-md text-muted-foreground">
            <Activity className="w-3 h-3 mr-1" /> Vax ✅
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{dog.breed} • {dog.age} yrs • {dog.sex}</p>

        <div className="mt-auto pt-4 space-y-2">
          <Link to={`/dogs/${dog.id}`}>
            <Button variant="outline" className="w-full">View Medical Profile</Button>
          </Link>
          {dog.status === 'Available' && (
            <Link to="/adoption" state={{ selectedDog: dog }}>
              <Button className="w-full">
                <Heart className="w-4 h-4 mr-2" /> Virtually Adopt
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default DogCard;