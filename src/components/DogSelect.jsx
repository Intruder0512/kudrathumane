import { useDogs } from '@/lib/data';
import { Select } from './ui';

export default function DogSelect({ value, onChange, required, placeholder = 'Choose a dog', filter }) {
  const { data } = useDogs();
  const dogs = (data || []).filter(filter || (() => true));
  return (
    <Select
      value={value || ''}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      options={dogs.map((d) => [d.id, d.name])}
    />
  );
}
