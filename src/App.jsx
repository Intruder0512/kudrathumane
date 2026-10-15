import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider, Spinner } from '@/components/ui';
import SiteLayout from '@/layouts/SiteLayout';
import Home from '@/pages/public/Home';
import Dogs from '@/pages/public/Dogs';
import DogProfile from '@/pages/public/DogProfile';
import Adopt from '@/pages/public/Adopt';
import Foster from '@/pages/public/Foster';
import Donate from '@/pages/public/Donate';
import Volunteer from '@/pages/public/Volunteer';
import LostFound from '@/pages/public/LostFound';
import Contact from '@/pages/public/Contact';
import Login from '@/pages/public/Login';
import Credits from '@/pages/public/Credits';
import NotFound from '@/pages/public/NotFound';
import Account from '@/pages/account/Account';

const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const A = {
  Overview: lazy(() => import('@/pages/admin/Overview')),
  Dogs: lazy(() => import('@/pages/admin/Dogs')),
  DogFile: lazy(() => import('@/pages/admin/DogFile')),
  Medical: lazy(() => import('@/pages/admin/Medical')),
  Rescues: lazy(() => import('@/pages/admin/Rescues')),
  Releases: lazy(() => import('@/pages/admin/Releases')),
  Microchips: lazy(() => import('@/pages/admin/Microchips')),
  Fostering: lazy(() => import('@/pages/admin/Fostering')),
  Volunteers: lazy(() => import('@/pages/admin/Volunteers')),
  LostFound: lazy(() => import('@/pages/admin/LostFoundAdmin')),
  Messages: lazy(() => import('@/pages/admin/Messages')),
  Users: lazy(() => import('@/pages/admin/Users')),
  Adoptions: lazy(() => import('@/pages/admin/Adoptions')),
  Payments: lazy(() => import('@/pages/admin/Payments')),
  InKind: lazy(() => import('@/pages/admin/InKind')),
  Inventory: lazy(() => import('@/pages/admin/Inventory')),
  QrCodes: lazy(() => import('@/pages/admin/QrCodes')),
  Certificates: lazy(() => import('@/pages/admin/Certificates')),
  Social: lazy(() => import('@/pages/admin/Social')),
  Reports: lazy(() => import('@/pages/admin/Reports')),
  Settings: lazy(() => import('@/pages/admin/SiteSettings')),
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<Home />} />
              <Route path="dogs" element={<Dogs />} />
              <Route path="dogs/:id" element={<DogProfile />} />
              <Route path="adopt" element={<Adopt />} />
              <Route path="foster" element={<Foster />} />
              <Route path="donate" element={<Donate />} />
              <Route path="volunteer" element={<Volunteer />} />
              <Route path="lost-and-found" element={<LostFound />} />
              <Route path="contact" element={<Contact />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Login mode="signup" />} />
              <Route path="account" element={<Account />} />
              <Route path="credits" element={<Credits />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<A.Overview />} />
              <Route path="dogs" element={<A.Dogs />} />
              <Route path="dogs/:id" element={<A.DogFile />} />
              <Route path="medical" element={<A.Medical />} />
              <Route path="rescues" element={<A.Rescues />} />
              <Route path="releases" element={<A.Releases />} />
              <Route path="microchips" element={<A.Microchips />} />
              <Route path="fostering" element={<A.Fostering />} />
              <Route path="volunteers" element={<A.Volunteers />} />
              <Route path="lost-found" element={<A.LostFound />} />
              <Route path="messages" element={<A.Messages />} />
              <Route path="users" element={<A.Users />} />
              <Route path="adoptions" element={<A.Adoptions />} />
              <Route path="payments" element={<A.Payments />} />
              <Route path="in-kind" element={<A.InKind />} />
              <Route path="inventory" element={<A.Inventory />} />
              <Route path="qr-codes" element={<A.QrCodes />} />
              <Route path="certificates" element={<A.Certificates />} />
              <Route path="social" element={<A.Social />} />
              <Route path="reports" element={<A.Reports />} />
              <Route path="settings" element={<A.Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}
