import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { dogPhoto, onImgError } from '@/lib/images';
import { ageLabel } from '@/lib/format';
import DogTag from './DogTag';
import { cx } from './ui';

const INTERVAL = 6000;

// Home page hero: one dog at a time, cross-fading, with thumbnails to jump between them.
export default function HeroCarousel({ dogs }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const touch = useRef(null);
  const n = dogs.length;
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const go = useCallback((to) => setI(((to % n) + n) % n), [n]);

  useEffect(() => {
    if (n < 2 || paused || userPaused || reduced) return undefined;
    const t = setTimeout(() => go(i + 1), INTERVAL);
    return () => clearTimeout(t);
  }, [i, n, paused, userPaused, reduced, go]);

  // Preload the next photo so the fade never shows a blank frame
  useEffect(() => {
    if (n > 1) {
      const img = new Image();
      img.src = dogPhoto(dogs[(i + 1) % n], 1400);
    }
  }, [i, n, dogs]);

  if (!n) return null;
  const dog = dogs[i];

  return (
    <div
      className="relative min-w-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(i + 1);
        if (e.key === 'ArrowLeft') go(i - 1);
      }}
      aria-roledescription="carousel"
      aria-label="Dogs at our shelter"
    >
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-ink shadow-[0_30px_60px_-30px_rgba(30,42,90,0.55)] sm:aspect-[5/6]"
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
          touch.current = null;
        }}
      >
        {dogs.map((d, k) => (
          <div
            key={d.id}
            className={cx('absolute inset-0 transition-opacity duration-700 ease-out', k === i ? 'opacity-100' : 'pointer-events-none opacity-0')}
            role="group"
            aria-roledescription="slide"
            aria-label={`${k + 1} of ${n}: ${d.name}`}
            aria-hidden={k !== i}
          >
            <img
              src={dogPhoto(d, 1400)}
              onError={onImgError}
              alt={`${d.name}, ${d.sex === 'female' ? 'a female' : d.sex === 'male' ? 'a male' : 'an'} Indie dog at our shelter`}
              className={cx('h-full w-full object-cover', k === i && !reduced && 'animate-[heroZoom_9s_ease-out_forwards]')}
              style={{ objectPosition: 'center 30%' }}
              loading={k === 0 ? 'eager' : 'lazy'}
              fetchpriority={k === 0 ? 'high' : 'auto'}
            />
          </div>
        ))}

        {/* shading so the text stays readable on any photo */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/25 to-transparent" />

        {/* caption */}
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7" aria-live="polite">
          <DogTag key={dog.id} name={dog.name} size="xl" className="-ml-5 sm:-ml-7" />
          <p className="mt-3 text-sm font-semibold text-marigold-200">
            <span className="capitalize">{dog.sex || 'Indie'}</span> · {ageLabel(dog.age_years)}
            {dog.rescued_from_area ? ` · rescued from ${dog.rescued_from_area}` : ''}
          </p>
          <p className="mt-2 max-w-md text-lg leading-snug text-white sm:text-xl">
            {dog.personality || dog.story?.split('.').slice(0, 1).join('.') || 'Safe at the shelter and waiting to meet you.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={`/dogs/${dog.id}`} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-ink hover:bg-marigold-100">
              Meet {dog.name}
            </Link>
            <Link to={`/adopt?dog=${dog.id}`} className="rounded-xl bg-marigold px-4 py-2.5 text-sm font-bold text-ink hover:bg-marigold-300">
              Virtually adopt {dog.name}
            </Link>
          </div>
        </div>

        {n > 1 && (
          <div className="absolute right-3 top-3 flex gap-1.5 sm:right-4 sm:top-4">
            <button onClick={() => setUserPaused((p) => !p)} className="rounded-full bg-ink-900/55 p-2 text-white backdrop-blur hover:bg-ink-900/80" aria-label={userPaused ? 'Play slideshow' : 'Pause slideshow'}>
              {userPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button onClick={() => go(i - 1)} className="rounded-full bg-ink-900/55 p-2 text-white backdrop-blur hover:bg-ink-900/80" aria-label="Previous dog">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => go(i + 1)} className="rounded-full bg-ink-900/55 p-2 text-white backdrop-blur hover:bg-ink-900/80" aria-label="Next dog">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* progress bar for the current slide */}
        {n > 1 && !reduced && (
          <div className="absolute inset-x-0 top-0 h-1 bg-white/15">
            <div key={`${i}-${paused || userPaused}`} className="h-full bg-marigold" style={{ width: paused || userPaused ? '0%' : undefined, animation: paused || userPaused ? 'none' : `heroProgress ${INTERVAL}ms linear forwards` }} />
          </div>
        )}
      </div>

      {/* thumbnails */}
      {n > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto px-1 pb-1 pt-1" role="tablist" aria-label="Choose a dog">
          {dogs.map((d, k) => (
            <button
              key={d.id}
              role="tab"
              aria-selected={k === i}
              onClick={() => go(k)}
              className={cx('group flex flex-none flex-col items-center gap-1.5', k === i ? '' : 'opacity-70 hover:opacity-100')}
            >
              <span className={cx('block h-14 w-14 overflow-hidden rounded-full ring-[3px] ring-offset-2 ring-offset-wall transition', k === i ? 'ring-marigold' : 'ring-transparent')}>
                <img src={dogPhoto(d, 160)} onError={onImgError} alt="" className="h-full w-full object-cover" style={{ objectPosition: 'center 30%' }} loading="lazy" />
              </span>
              <span className={cx('text-xs font-semibold', k === i ? 'text-ink' : 'text-ink-400')}>{d.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
