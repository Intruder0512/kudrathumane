import { Link } from 'react-router-dom';
import { Stethoscope, Soup, Home as HomeIcon, Ambulance, HeartHandshake, House, PackageOpen } from 'lucide-react';
import { list, rpc, useAsync, useSettings } from '@/lib/data';
import { IN_CARE } from '@/lib/constants';
import { dogPhoto, onImgError, stock } from '@/lib/images';
import { inr, num } from '@/lib/format';
import DogTag from '@/components/DogTag';
import DogCard from '@/components/DogCard';
import { LinkButton } from '@/components/ui';

export default function Home() {
  const settings = useSettings();
  const { data: stats } = useAsync(() => rpc('impact_stats').catch(() => null), []);
  const { data: dogs } = useAsync(() => list('dogs', { inValues: { status: IN_CARE }, order: ['intake_date', false] }).catch(() => []), []);

  const all = dogs || [];
  const featured = all.find((d) => d.id === settings.featured_dog_id) || all.find((d) => d.status === 'ready') || all[0];
  const others = all.filter((d) => d !== featured).slice(0, 4);
  const inCare = stats?.in_care || all.length;
  const min = settings.min_monthly_amount || 5000;

  return (
    <>
      {/* Hero: one dog, by name */}
      <section className="wrap grid items-center gap-10 pb-16 pt-10 md:grid-cols-[1.05fr_1fr] md:pt-16">
        <div>
          <h1 className="text-[2.6rem] font-extrabold leading-[1.02] sm:text-6xl lg:text-[4.4rem]">
            {inCare > 0 ? `${inCare} dogs live at our shelter.` : 'Our shelter dogs.'} Every one of them has a name.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg text-ink-500">
            Kudrat Humane Living Trust rescues Indie street dogs that are hit by vehicles, beaten, or left behind — then treats them, feeds them and keeps them safe until someone is ready to love them.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton to="/adopt" size="lg">Virtually adopt a dog</LinkButton>
            <LinkButton to="/donate" size="lg" variant="outline">Give once</LinkButton>
          </div>
        </div>
        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-wall-2 sm:aspect-[5/6]">
            <img
              src={featured ? dogPhoto(featured, 1200) : stock(0, 1200)}
              onError={onImgError}
              alt={featured ? `${featured.name}, one of our shelter dogs` : 'An Indie dog at the shelter'}
              className="h-full w-full object-cover"
              fetchpriority="high"
            />
          </div>
          {featured && (
            <Link to={`/dogs/${featured.id}`} className="absolute -left-2 bottom-8 block sm:-left-6">
              <DogTag name={featured.name} size="xl" className="shadow-xl" />
              <span className="mt-2 block w-max max-w-[16rem] rounded-xl bg-white px-4 py-2.5 text-sm shadow-lg">
                {featured.personality || featured.story?.slice(0, 80) || `Rescued from ${featured.rescued_from_area || 'the streets'}.`}
                <span className="mt-1 block font-semibold underline">Meet {featured.name}</span>
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* Impact, said as a sentence */}
      <section className="border-y border-wall-3 bg-white">
        <p className="wrap py-8 font-display text-2xl font-bold leading-snug sm:text-3xl">
          So far we have rescued <Mark>{num(stats?.dogs_rescued || Math.max(all.length, 25))} dogs</Mark>.{' '}
          <Mark>{num(stats?.virtual_adoptions || 0)}</Mark> have a virtual parent paying for their care, and{' '}
          <Mark>{num(stats?.fostered || 0)}</Mark> have gone to foster homes.
        </p>
      </section>

      {/* Dogs */}
      {others.length > 0 && (
        <section className="wrap pt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-xl text-4xl font-extrabold">Waiting for someone like you</h2>
            <Link to="/dogs" className="font-semibold underline">See all {all.length} dogs</Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {others.map((d) => <DogCard key={d.id} dog={d} />)}
          </div>
        </section>
      )}

      {/* Ways to help */}
      <section className="wrap pt-24">
        <h2 className="text-4xl font-extrabold">Three ways to help a dog</h2>
        <div className="mt-8 divide-y divide-wall-3 border-y border-wall-3">
          <HelpRow icon={HeartHandshake} title="Virtually adopt" to="/adopt" cta="Choose a dog">
            Pick a dog and give {inr(min)} or more each month. It covers their food, medicine and vet visits. The dog stays safe at the shelter and you get an adoption certificate and updates.
          </HelpRow>
          <HelpRow icon={House} title="Foster at home" to="/foster" cta="Apply to foster">
            Give a recovering dog a quiet home for a few weeks or months. We cover vet costs and stay with you every step.
          </HelpRow>
          <HelpRow icon={PackageOpen} title="Donate money or supplies" to="/donate" cta="Ways to give">
            Pay once by UPI, or send food, medicines and bedding. Every item is logged and used at the shelter.
          </HelpRow>
        </div>
      </section>

      {/* Where donations go */}
      <section className="mt-24 bg-ink py-20 text-white">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-4xl font-extrabold text-white">Where your money goes</h2>
            <p className="mt-4 max-w-md text-ink-100">We are a new shelter run on donations. Every rupee goes to the dogs in our care.</p>
          </div>
          <ul className="grid gap-8 sm:grid-cols-2">
            <Use icon={Stethoscope} title="Medical care">Surgery, fracture care, vaccinations, deworming and medicines for injured and sick dogs.</Use>
            <Use icon={Soup} title="Food">Two cooked meals a day and special diets for dogs who are recovering.</Use>
            <Use icon={HomeIcon} title="Shelter">Clean kennels, bedding, rain cover and a safe space to heal.</Use>
            <Use icon={Ambulance} title="Rescue operations">Transport and emergency first aid when a call comes in about a dog in trouble.</Use>
          </ul>
        </div>
      </section>

      {/* Founder */}
      <section className="wrap grid items-center gap-10 pt-24 md:grid-cols-[0.9fr_1.1fr]">
        <img src={stock(4, 900)} onError={onImgError} alt="An Indie dog resting at the shelter" className="aspect-[4/3] w-full rounded-[28px] object-cover" loading="lazy" />
        <div>
          <h2 className="text-4xl font-extrabold">Started by {settings.founder_name || 'Pooja Prasad'}</h2>
          <div className="mt-5 max-w-prose space-y-4 text-lg text-ink-500">
            <p>
              {settings.founder_name || 'Pooja Prasad'} founded Kudrat Humane Living Trust to stop cruelty to animals and to give street dogs who are injured, abused or abandoned a place to recover.
            </p>
            <p>
              The shelter is newly set up and already cares for more than 25 dogs. Most are Indies — the dogs who live on our streets, guard our lanes and ask for very little. We think they deserve care, a name, and people who show up for them.
            </p>
          </div>
          <LinkButton to="/contact" variant="outline" className="mt-7">Visit or call the shelter</LinkButton>
        </div>
      </section>
    </>
  );
}

const Mark = ({ children }) => <span className="whitespace-nowrap bg-marigold-200 px-1.5">{children}</span>;

function HelpRow({ icon: Icon, title, children, to, cta }) {
  return (
    <div className="grid gap-4 py-7 sm:grid-cols-[48px_220px_1fr_auto] sm:items-center">
      <Icon className="h-8 w-8 text-ink-400" aria-hidden />
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="max-w-prose text-ink-500">{children}</p>
      <Link to={to} className="font-semibold underline sm:justify-self-end">{cta}</Link>
    </div>
  );
}

function Use({ icon: Icon, title, children }) {
  return (
    <li>
      <Icon className="h-7 w-7 text-marigold" aria-hidden />
      <h3 className="mt-3 text-xl font-bold text-white">{title}</h3>
      <p className="mt-1 text-ink-100">{children}</p>
    </li>
  );
}
