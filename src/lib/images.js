// Freely licensed Indie (Indian pariah) dog photos from Wikimedia Commons, used until the
// shelter uploads its own. Credits: /credits page and IMAGE_CREDITS.md.
const commons = (file, width = 1200) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;

export const STOCK_FILES = [
  'The_Indian_Pariah_Dog.jpg',
  'Indian_pariah_dog_07905.jpg',
  'An_Indian_Pariah_Dog.jpg',
  'A_Pet_Indian_Pariah_Dog.jpg',
  'Indian_pariah_dog_07904.jpg',
  'Pariah_Dog.jpg',
];
export const STOCK = STOCK_FILES.map((f) => commons(f));
export const stock = (i, width) => commons(STOCK_FILES[i % STOCK_FILES.length], width);
export const PLACEHOLDER = '/images/dog-placeholder.svg';

const hash = (s = '') => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const dogPhoto = (dog, width = 800) =>
  dog?.photo_url || (dog ? stock(hash(dog.id || dog.name), width) : PLACEHOLDER);

export const onImgError = (e) => {
  if (e.currentTarget.dataset.fallback) return;
  e.currentTarget.dataset.fallback = '1';
  e.currentTarget.src = PLACEHOLDER;
};
