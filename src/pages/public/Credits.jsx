import { STOCK_FILES } from '@/lib/images';
export default function Credits() {
  return (
    <div className="wrap max-w-3xl pt-12">
      <h1 className="text-4xl font-extrabold">Photo credits</h1>
      <p className="mt-3 text-ink-500">Until we upload photos of our own dogs, some pages use freely licensed photos of Indian pariah (Indie) dogs from Wikimedia Commons. Each photo belongs to its photographer; open the link to see their name and licence.</p>
      <ul className="mt-6 list-disc space-y-2 pl-5">
        {STOCK_FILES.map((f) => (
          <li key={f}><a className="underline" href={`https://commons.wikimedia.org/wiki/File:${f}`} target="_blank" rel="noreferrer">{f.replace(/_/g, ' ')}</a></li>
        ))}
      </ul>
    </div>
  );
}
