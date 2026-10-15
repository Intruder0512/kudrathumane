import { onImgError } from '@/lib/images';
import { cx } from './ui';

// Shows the whole photo inside its frame (nothing cropped). The empty space around it is
// filled with a soft, blurred copy of the same photo so the frame never has bare bars.
export default function FramedPhoto({ src, alt, className, imgClassName, eager }) {
  return (
    <div className={cx('relative h-full w-full overflow-hidden bg-ink', className)}>
      <img src={src} alt="" aria-hidden onError={onImgError} className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl" loading={eager ? 'eager' : 'lazy'} />
      <img src={src} alt={alt} onError={onImgError} className={cx('relative h-full w-full object-contain', imgClassName)} loading={eager ? 'eager' : 'lazy'} fetchpriority={eager ? 'high' : 'auto'} />
    </div>
  );
}
