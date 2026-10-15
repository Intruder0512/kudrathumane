// Indian street dog (Indie / Indian pariah dog) photos.
// Source: Wikimedia Commons — freely licensed. Full credits in /IMAGE_CREDITS.md.
// Special:FilePath gives a stable link that resizes to the requested width.
const commons = (file, width = 1200) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;

export const INDIAN_STREET_DOG_FILES = [
  'The_Indian_Pariah_Dog.jpg',
  'Indian_pariah_dog_07905.jpg',
  'An_Indian_Pariah_Dog.jpg',
  'A_Pet_Indian_Pariah_Dog.jpg',
  'Indian_pariah_dog_07904.jpg',
  'Pariah_Dog.jpg',
];

export const INDIAN_STREET_DOGS = INDIAN_STREET_DOG_FILES.map((f) => commons(f));

// Shown if a remote photo ever fails to load.
export const DOG_IMAGE_FALLBACK = '/images/indie-dog-placeholder.svg';

export const getDeterministicDogImage = (id) => {
  if (!id) return INDIAN_STREET_DOGS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % INDIAN_STREET_DOGS.length;
  return INDIAN_STREET_DOGS[index];
};

// Swap any broken <img> on the site for the local placeholder.
export const installImageFallback = () => {
  if (typeof window === 'undefined') return;
  window.addEventListener(
    'error',
    (e) => {
      const el = e.target;
      if (el && el.tagName === 'IMG' && !el.dataset.fallbackApplied) {
        el.dataset.fallbackApplied = 'true';
        el.src = DOG_IMAGE_FALLBACK;
      }
    },
    true
  );
};
