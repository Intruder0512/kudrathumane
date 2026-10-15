import { useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import AuthBox from '@/components/AuthBox';
import { stock, onImgError } from '@/lib/images';

export default function Login({ mode = 'login' }) {
  const { user, ready } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const next = params.get('next');
  const where = (u) => next || (u?.role === 'admin' || u?.role === 'volunteer' ? '/admin' : '/account');
  useEffect(() => {}, []);
  if (ready && user) return <Navigate to={where(user)} replace />;
  return (
    <div className="wrap grid gap-10 pt-12 md:grid-cols-2 md:items-center">
      <div className="max-w-md">
        <AuthBox key={mode} initialMode={mode} onDone={(u) => nav(where(u), { replace: true })} />
      </div>
      <img src={stock(1, 900)} onError={onImgError} alt="An Indie dog looking at the camera" className="hidden aspect-square w-full rounded-[28px] object-cover md:block" />
    </div>
  );
}
