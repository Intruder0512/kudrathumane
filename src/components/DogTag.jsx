import { cx } from './ui';
export default function DogTag({ name, size = 'md', className }) {
  const sizes = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl sm:text-3xl', xl: 'text-4xl sm:text-5xl' };
  return <span className={cx('tag', sizes[size], className)}>{name}</span>;
}
