import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { friendlyError } from '@/lib/data';
import { Button, Field, Input, cx } from './ui';

export default function AuthBox({ initialMode = 'login', onDone, compact }) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === 'login') {
        const u = await signIn(form.email.trim(), form.password);
        onDone?.(u);
      } else if (mode === 'signup') {
        if (form.password.length < 8) throw new Error('Use at least 8 characters for your password.');
        const r = await signUp({ ...form, email: form.email.trim() });
        if (r.needsConfirmation) setMsg({ ok: true, text: `We’ve sent a confirmation link to ${form.email}. Open it, then log in here.` });
        else onDone?.(r.user);
      } else {
        await resetPassword(form.email.trim());
        setMsg({ ok: true, text: 'If that email has an account, a reset link is on its way.' });
      }
    } catch (err) {
      setMsg({ ok: false, text: friendlyError(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={cx('space-y-4', !compact && 'rounded-2xl bg-white p-6 ring-1 ring-wall-3')}>
      {!compact && <h2 className="text-2xl font-bold">{mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create your account' : 'Reset your password'}</h2>}
      {mode === 'signup' && (
        <>
          <Field label="Your name" required><Input value={form.full_name} onChange={set('full_name')} required autoComplete="name" /></Field>
          <Field label="Phone"><Input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" /></Field>
        </>
      )}
      <Field label="Email" required><Input type="email" value={form.email} onChange={set('email')} required autoComplete="email" /></Field>
      {mode !== 'reset' && (
        <Field label="Password" required hint={mode === 'signup' ? 'At least 8 characters' : undefined}>
          <Input type="password" value={form.password} onChange={set('password')} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </Field>
      )}
      {msg && <p className={cx('rounded-lg px-3 py-2 text-sm font-medium', msg.ok ? 'bg-neem-50 text-neem' : 'bg-sindoor-50 text-sindoor')} role="status">{msg.text}</p>}
      <Button type="submit" loading={busy} className="w-full">
        {mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
      </Button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        {mode === 'login' ? (
          <>
            <button type="button" className="font-semibold underline" onClick={() => setMode('signup')}>New here? Create an account</button>
            <button type="button" className="text-ink-400 underline" onClick={() => setMode('reset')}>Forgot password?</button>
          </>
        ) : (
          <button type="button" className="font-semibold underline" onClick={() => setMode('login')}>I already have an account</button>
        )}
      </div>
    </form>
  );
}
