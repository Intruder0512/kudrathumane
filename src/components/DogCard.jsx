import { Link } from 'react-router-dom';
import DogTag from './DogTag';
import { DogStatus } from './StatusBadge';
import { dogPhoto, onImgError } from '@/lib/images';
import { ageLabel } from '@/lib/format';

export default function DogCard({ dog, adopters = 0 }) {
  return (
    <Link to={`/dogs/${dog.id}`} className="group block focus-visible:outline-offset-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-wall-2">
        <img
          src={dogPhoto(dog, 700)}
          onError={onImgError}
          alt={`${dog.name}, ${dog.sex || ''} Indie dog`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <DogTag name={dog.name} className="absolute bottom-4 left-0" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-400">
        <span className="font-semibold capitalize text-ink">{dog.sex || 'Unknown'}</span>
        <span>{ageLabel(dog.age_years)}</span>
        {dog.rescued_from_area && <span>From {dog.rescued_from_area}</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <DogStatus status={dog.status} />
        {adopters > 0 && <span className="text-xs font-semibold text-neem">{adopters} virtual {adopters === 1 ? 'parent' : 'parents'}</span>}
      </div>
    </Link>
  );
}
