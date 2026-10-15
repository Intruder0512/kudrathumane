import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Phone, Mail, MapPin, Instagram, Facebook } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useSettings } from '@/lib/data';
import { cx } from '@/components/ui';

const NAV = [
  ['/dogs', 'Meet the dogs'],
  ['/adopt', 'Virtually adopt'],
  ['/foster', 'Foster'],
  ['/volunteer', 'Volunteer'],
  ['/lost-and-found', 'Lost & found'],
  ['/contact', 'Contact'],
];

export function Logo({ light }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Kudrat Humane Living Trust — home">
      <img src="/images/tag.svg" alt="" className="h-9 w-9" />
      <span className={cx('font-display text-[17px] font-extrabold leading-[1.05]', light ? 'text-white' : 'text-ink')}>
        Kudrat Humane
        <span className={cx('block text-[12px] font-medium tracking-normal', light ? 'text-ink-200' : 'text-ink-400')}>Living Trust</span>
      </span>
    </Link>
  );
}

export default function SiteLayout() {
  const [open, setOpen] = useState(false);
  const { user, isStaff } = useAuth();
  const s = useSettings();
  const { pathname } = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  const navCls = ({ isActive }) =>
    cx('rounded-lg px-3 py-2 text-[15px] font-semibold', isActive ? 'bg-white text-ink' : 'text-ink-500 hover:text-ink');

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-wall-3/70 bg-wall/90 backdrop-blur-sm">
        <div className="wrap flex h-16 items-center justify-between gap-4">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map(([to, l]) => (
              <NavLink key={to} to={to} className={navCls}>{l}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to={user ? (isStaff ? '/admin' : '/account') : '/login'}
              className="hidden rounded-lg px-3 py-2 text-[15px] font-semibold text-ink-500 hover:text-ink sm:block"
            >
              {user ? (isStaff ? 'Admin' : 'My account') : 'Log in'}
            </Link>
            <Link to="/donate" className="rounded-xl bg-marigold px-4 py-2.5 text-[15px] font-bold text-ink hover:bg-marigold-300">
              Donate
            </Link>
            <button className="rounded-lg p-2 lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-wall-3 bg-wall lg:hidden" aria-label="Mobile">
            <div className="wrap flex flex-col py-3">
              {NAV.map(([to, l]) => (
                <NavLink key={to} to={to} className={navCls}>{l}</NavLink>
              ))}
              <NavLink to={user ? (isStaff ? '/admin' : '/account') : '/login'} className={navCls}>
                {user ? (isStaff ? 'Admin' : 'My account') : 'Log in'}
              </NavLink>
            </div>
          </nav>
        )}
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-24 bg-ink text-ink-100">
        <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink-200">
              A registered trust preventing cruelty to animals. We rescue injured and abandoned street dogs, treat them, and find them people who care.
            </p>
            <div className="mt-5 flex gap-3">
              {s.instagram_url && <a href={s.instagram_url} aria-label="Instagram" className="rounded-lg bg-ink-500 p-2 hover:bg-marigold hover:text-ink"><Instagram className="h-5 w-5" /></a>}
              {s.facebook_url && <a href={s.facebook_url} aria-label="Facebook" className="rounded-lg bg-ink-500 p-2 hover:bg-marigold hover:text-ink"><Facebook className="h-5 w-5" /></a>}
            </div>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-white">Help a dog</p>
            <ul className="mt-3 space-y-2 text-[15px]">
              <li><Link to="/adopt" className="hover:text-marigold">Virtually adopt</Link></li>
              <li><Link to="/foster" className="hover:text-marigold">Foster at home</Link></li>
              <li><Link to="/donate" className="hover:text-marigold">Donate money or supplies</Link></li>
              <li><Link to="/volunteer" className="hover:text-marigold">Volunteer</Link></li>
              <li><Link to="/lost-and-found" className="hover:text-marigold">Report a lost or found dog</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-white">Reach us</p>
            <ul className="mt-3 space-y-3 text-[15px]">
              {s.phone && <li className="flex gap-2"><Phone className="mt-1 h-4 w-4 flex-none" /><a href={`tel:${s.phone}`} className="hover:text-marigold">{s.phone}</a></li>}
              <li className="flex gap-2"><Mail className="mt-1 h-4 w-4 flex-none" /><a href={`mailto:${s.email || 'info@kudrathumane.org'}`} className="hover:text-marigold">{s.email || 'info@kudrathumane.org'}</a></li>
              <li className="flex gap-2"><MapPin className="mt-1 h-4 w-4 flex-none" /><a href={s.map_link || '/contact'} className="hover:text-marigold">{s.address || 'Find the shelter on Google Maps'}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-ink-500">
          <div className="wrap flex flex-col gap-2 py-5 text-sm text-ink-300 sm:flex-row sm:justify-between">
            <p>© {new Date().getFullYear()} {s.trust_name || 'Kudrat Humane Living Trust'}{s.registration_number ? ` · Reg. ${s.registration_number}` : ''}</p>
            <p>
              <Link to="/credits" className="underline hover:text-white">Photo credits</Link>
              {' · '}
              <Link to="/login" className="underline hover:text-white">Staff login</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
