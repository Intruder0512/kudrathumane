import { LinkButton } from '@/components/ui';
export default function NotFound() {
  return (
    <div className="wrap py-24">
      <h1 className="text-5xl font-extrabold">This page has wandered off</h1>
      <p className="mt-3 text-lg text-ink-500">The link may be old. The dogs are still here, though.</p>
      <div className="mt-8 flex gap-3"><LinkButton to="/">Home</LinkButton><LinkButton to="/dogs" variant="outline">Meet the dogs</LinkButton></div>
    </div>
  );
}
