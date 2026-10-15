import { useMemo, useState } from 'react';
import { list, rpc, useAsync } from '@/lib/data';
import { SEX } from '@/lib/constants';
import DogCard from '@/components/DogCard';
import { Select, Spinner, Empty, ErrorNote, cx } from '@/components/ui';

const GROUPS = [
  ['all', 'All in our care', (d) => !['adopted', 'released', 'deceased'].includes(d.status)],
  ['ready', 'Ready for a home', (d) => d.status === 'ready'],
  ['recovering', 'Recovering', (d) => ['rescued', 'under_assessment', 'under_treatment', 'recovering'].includes(d.status)],
  ['fostered', 'In foster homes', (d) => d.status === 'fostered'],
  ['adopted', 'Found homes', (d) => d.status === 'adopted'],
];

export default function Dogs() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [dogs, counts] = await Promise.all([list('dogs', { order: ['intake_date', false] }), rpc('adopter_counts').catch(() => [])]);
    const byDog = Object.fromEntries((counts || []).map((c) => [c.dog_id, Number(c.adopters)]));
    return dogs.map((d) => ({ ...d, adopters: byDog[d.id] || 0 }));
  }, []);
  const [group, setGroup] = useState('all');
  const [sex, setSex] = useState('');
  const [q, setQ] = useState('');

  const dogs = useMemo(() => {
    const test = GROUPS.find((g) => g[0] === group)[2];
    return (data || []).filter(test).filter((d) => !sex || d.sex === sex).filter((d) => !q || `${d.name} ${d.rescued_from_area} ${d.colour}`.toLowerCase().includes(q.toLowerCase()));
  }, [data, group, sex, q]);

  return (
    <div className="wrap pt-12">
      <h1 className="text-5xl font-extrabold">Meet the dogs</h1>
      <p className="mt-3 max-w-prose text-lg text-ink-500">Almost all of them are Indies rescued from roads and markets around Delhi NCR. Open a profile to read their story and see how they’re doing.</p>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1" role="tablist" aria-label="Filter dogs">
          {GROUPS.map(([v, l]) => (
            <button key={v} role="tab" aria-selected={group === v} onClick={() => setGroup(v)}
              className={cx('whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold', group === v ? 'bg-ink text-white' : 'bg-white text-ink-500 hover:text-ink')}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input w-40" placeholder="Search name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search by name" />
          <Select className="w-32" value={sex} onChange={(e) => setSex(e.target.value)} placeholder="Any sex" options={SEX} aria-label="Sex" />
        </div>
      </div>

      <div className="mt-10">
        <ErrorNote error={error} onRetry={reload} />
        {loading ? <Spinner label="Fetching the dogs" /> : !error && dogs.length === 0 ? (
          <Empty title="No dogs match">Try another filter.</Empty>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {dogs.map((d) => <DogCard key={d.id} dog={d} adopters={d.adopters} />)}
          </div>
        )}
      </div>
    </div>
  );
}
