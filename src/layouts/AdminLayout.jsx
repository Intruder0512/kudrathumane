import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Dog, Stethoscope, Siren, DoorOpen, HeartHandshake, IndianRupee, Package, Boxes, Users,
  Home, Search, Cpu, Award, Megaphone, BarChart3, QrCode, Settings, Mail, UserCog, Menu, X, LogOut, Globe,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Spinner, cx } from '@/components/ui';

const GROUPS = [
  ['Shelter', [
    ['/admin', 'Overview', LayoutDashboard, true, 'staff'],
    ['/admin/dogs', 'Dogs', Dog, false, 'staff'],
    ['/admin/medical', 'Medical records', Stethoscope, false, 'staff'],
    ['/admin/rescues', 'Rescue operations', Siren, false, 'staff'],
    ['/admin/releases', 'Release & discharge', DoorOpen, false, 'staff'],
    ['/admin/microchips', 'Microchip registry', Cpu, false, 'staff'],
  ]],
  ['People', [
    ['/admin/fostering', 'Fostering', Home, false, 'admin'],
    ['/admin/volunteers', 'Volunteers', Users, false, 'admin'],
    ['/admin/lost-found', 'Lost & found', Search, false, 'staff'],
    ['/admin/messages', 'Messages', Mail, false, 'admin'],
    ['/admin/users', 'Logins & roles', UserCog, false, 'admin'],
  ]],
  ['Money & supplies', [
    ['/admin/adoptions', 'Virtual adoptions', HeartHandshake, false, 'admin'],
    ['/admin/payments', 'Payments & donations', IndianRupee, false, 'admin'],
    ['/admin/in-kind', 'In-kind donations', Package, false, 'admin'],
    ['/admin/inventory', 'Inventory', Boxes, false, 'admin'],
    ['/admin/qr-codes', 'Payment QR codes', QrCode, false, 'admin'],
  ]],
  ['Outreach', [
    ['/admin/certificates', 'Certificates & receipts', Award, false, 'admin'],
    ['/admin/social', 'Social media', Megaphone, false, 'admin'],
    ['/admin/reports', 'Reports', BarChart3, false, 'admin'],
    ['/admin/settings', 'Site settings', Settings, false, 'admin'],
  ]],
];

export default function AdminLayout() {
  const { user, ready, isAdmin, isStaff, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  if (!ready) return <Spinner />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
  if (!isStaff)
    return (
      <div className="wrap py-24 text-center">
        <h1 className="text-3xl font-bold">This area is for shelter staff</h1>
        <p className="mt-2 text-ink-400">You’re logged in as {user.email}. Ask the admin to give your login the admin or volunteer role.</p>
        <Link to="/account" className="mt-6 inline-block font-semibold underline">Go to my account</Link>
      </div>
    );

  const linkCls = ({ isActive }) =>
    cx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-marigold text-ink' : 'text-ink-100 hover:bg-ink-500 hover:text-white');

  const nav = (
    <nav className="space-y-6" aria-label="Admin">
      {GROUPS.map(([g, items]) => {
        const visible = items.filter((i) => i[4] === 'staff' || isAdmin);
        if (!visible.length) return null;
        return (
          <div key={g}>
            <p className="px-3 pb-1.5 text-xs font-semibold text-ink-300">{g}</p>
            <div className="space-y-0.5">
              {visible.map(([to, l, Icon, end]) => (
                <NavLink key={to} to={to} end={end} className={linkCls}>
                  <Icon className="h-4 w-4 flex-none" /> {l}
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-wall lg:grid lg:grid-cols-[250px_1fr]">
      <aside className={cx('fixed inset-y-0 left-0 z-50 w-[260px] overflow-y-auto bg-ink px-3 py-5 transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="mb-6 flex items-center justify-between px-2">
          <Link to="/" className="flex items-center gap-2 text-white">
            <img src="/images/tag.svg" alt="" className="h-8 w-8" />
            <span className="font-display font-extrabold leading-tight">Kudrat admin</span>
          </Link>
          <button className="text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
        </div>
        {nav}
        <div className="mt-8 space-y-1 border-t border-ink-500 pt-4">
          <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-100 hover:bg-ink-500"><Globe className="h-4 w-4" /> View website</Link>
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-100 hover:bg-ink-500"><LogOut className="h-4 w-4" /> Log out</button>
          <p className="truncate px-3 pt-2 text-xs text-ink-300">{user.email} · {user.role}</p>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-ink-900/50 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-wall-3 bg-wall/95 px-4 py-3 backdrop-blur-sm lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
          <span className="font-display font-bold">Kudrat admin</span>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function AdminOnly({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <p className="rounded-xl bg-marigold-50 p-4">Only admins can open this page.</p>;
  return children;
}

export function PageTitle({ title, children, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold">{title}</h1>
        {children && <p className="mt-1 max-w-prose text-ink-400">{children}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
