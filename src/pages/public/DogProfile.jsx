import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShieldCheck, Syringe, Scissors, Cpu, MapPin, CalendarDays } from 'lucide-react';
import { getOne, list, useAsync, useSettings } from '@/lib/data';
import { dogPhoto, onImgError } from '@/lib/images';
import { ageLabel, fmtDate, inr, daysUntil } from '@/lib/format';
import { RESCUE_TYPE, SPAY, label } from '@/lib/constants';
import DogTag from '@/components/DogTag';
import { DogStatus } from '@/components/StatusBadge';
import { LinkButton, Spinner, Empty, cx } from '@/components/ui';

export default function DogProfile() {
  const { id } = useParams();
  const settings = useSettings();
  const { data, loading } = useAsync(async () => {
    const dog = await getOne('dogs', id);
    if (!dog) return null;
    const [vacc, rescues] = await Promise.all([
      list('vaccinations', { eq: { dog_id: id }, order: ['date_administered', false] }).catch(() => []),
      list('rescues', { eq: { dog_id: id }, order: ['rescue_date', true] }).catch(() => []),
    ]);
    return { dog, vacc, rescue: rescues[0] };
  }, [id]);
  const [photo, setPhoto] = useState(0);

  if (loading) return <Spinner />;
  if (!data) return <div className="wrap py-20"><Empty title="We couldn’t find this dog" action={<LinkButton to="/dogs">See all dogs</LinkButton>} /></div>;
  const { dog, vacc, rescue } = data;
  const photos = [dogPhoto(dog, 1200), ...(dog.gallery || [])];
  const vaccinated = vacc.length > 0 && vacc.every((v) => !v.next_due_date || daysUntil(v.next_due_date) >= 0);
  const home = ['adopted', 'released', 'deceased'].includes(dog.status);

  return (
    <div className="wrap pt-8">
      <Link to="/dogs" className="text-sm font-semibold text-ink-400 hover:text-ink">← All dogs</Link>
      <div className="mt-4 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-wall-2">
            <img src={photos[photo]} onError={onImgError} alt={`${dog.name}`} className="h-full w-full object-cover" />
          </div>
          {photos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {photos.map((p, i) => (
                <button key={p} onClick={() => setPhoto(i)} className={cx('h-20 w-20 flex-none overflow-hidden rounded-xl ring-2', i === photo ? 'ring-marigold' : 'ring-transparent')} aria-label={`Photo ${i + 1}`}>
                  <img src={p} onError={onImgError} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <DogTag name={dog.name} size="xl" />
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-ink-500">
            <span className="capitalize">{dog.sex || 'Sex unknown'}</span>
            <span>{ageLabel(dog.age_years)}</span>
            <span>{dog.breed || 'Indie'}</span>
            {dog.colour && <span>{dog.colour}</span>}
            <DogStatus status={dog.status} />
          </div>

          {dog.personality && <p className="mt-6 font-display text-2xl font-bold leading-snug">{dog.personality}</p>}
          {dog.story && <p className="mt-4 max-w-prose text-lg text-ink-500">{dog.story}</p>}

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            <Fact icon={Syringe} ok={vaccinated}>{vacc.length ? (vaccinated ? 'Vaccinations up to date' : 'Vaccination due soon') : 'Vaccinations being scheduled'}</Fact>
            <Fact icon={Scissors} ok={dog.spay_neuter === 'done'}>{label(SPAY, dog.spay_neuter)}</Fact>
            <Fact icon={ShieldCheck} ok={['ready', 'adopted', 'fostered'].includes(dog.status)}>{['rescued', 'under_assessment', 'under_treatment'].includes(dog.status) ? 'Still being treated' : 'Healthy and settled'}</Fact>
            {dog.microchip_number && <Fact icon={Cpu} ok>Microchipped</Fact>}
          </ul>

          {!home && dog.open_for_virtual_adoption && (
            <div className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-wall-3">
              <p className="font-display text-xl font-bold">Become {dog.name}’s virtual parent</p>
              <p className="mt-1 text-ink-500">From {inr(settings.min_monthly_amount || 5000)} a month. {dog.name} stays safe at the shelter; you cover their care and get updates.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <LinkButton to={`/adopt?dog=${dog.id}`}>Virtually adopt {dog.name}</LinkButton>
                {dog.status === 'ready' && <LinkButton to="/foster" variant="outline">Foster {dog.name}</LinkButton>}
              </div>
            </div>
          )}
        </div>
      </div>

      {(rescue || dog.rescued_from_area) && (
        <section className="mt-16 max-w-3xl">
          <h2 className="text-3xl font-extrabold">How {dog.name} came to us</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <Info icon={MapPin} t="Found at">{rescue?.location_text || rescue?.area || dog.rescued_from_area}</Info>
            {rescue?.rescue_date && <Info icon={CalendarDays} t="Rescued on">{fmtDate(rescue.rescue_date)}</Info>}
            {rescue?.rescue_type && <Info t="What happened">{label(RESCUE_TYPE, rescue.rescue_type)}</Info>}
          </dl>
          {rescue?.notes && <p className="mt-4 text-ink-500">{rescue.notes}</p>}
        </section>
      )}

      {vacc.length > 0 && (
        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-extrabold">Vaccinations</h2>
          <ul className="mt-4 divide-y divide-wall-3 rounded-xl bg-white ring-1 ring-wall-3">
            {vacc.map((v) => (
              <li key={v.id} className="flex flex-wrap justify-between gap-2 px-4 py-3">
                <span className="font-semibold">{v.vaccine}</span>
                <span className="text-sm text-ink-400">Given {fmtDate(v.date_administered)}{v.next_due_date ? ` · next ${fmtDate(v.next_due_date)}` : ''}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Fact({ icon: Icon, ok, children }) {
  return (
    <li className={cx('flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold', ok ? 'bg-neem-50 text-neem' : 'bg-marigold-50 text-marigold-700')}>
      <Icon className="h-5 w-5 flex-none" /> {children}
    </li>
  );
}
function Info({ icon: Icon, t, children }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-wall-3">
      <dt className="flex items-center gap-1.5 text-sm text-ink-400">{Icon && <Icon className="h-4 w-4" />}{t}</dt>
      <dd className="mt-1 font-semibold">{children}</dd>
    </div>
  );
}
