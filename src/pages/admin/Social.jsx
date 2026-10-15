import { useEffect, useRef, useState } from 'react';
import { Copy, Download, Star, Save } from 'lucide-react';
import { PageTitle } from '@/layouts/AdminLayout';
import ResourceManager from '@/components/ResourceManager';
import { clearSettingsCache, getSettings, insert, list, update, useAsync, useDogs } from '@/lib/data';
import { RESCUE_TYPE, label } from '@/lib/constants';
import { ageLabel, fmtDate, inr } from '@/lib/format';
import { dogPhoto } from '@/lib/images';
import { Button, Field, Select, Tabs, Textarea, useToast } from '@/components/ui';

const TYPES = [
  ['rescue', 'Rescue story'], ['recovery', 'Medical recovery'], ['looking', 'Looking for a home'],
  ['adopted', 'Adoption / success story'], ['dog_of_week', 'Dog of the week'],
];
const TONES = [['heartwarming', 'Heartwarming'], ['urgent', 'Urgent'], ['celebratory', 'Celebratory'], ['inspiring', 'Inspiring'], ['educational', 'Educational']];
const TAGS = '#AdoptDontShop #IndieDogs #AdoptIndies #RescueDog #KudratHumane #StreetDogsOfIndia #DelhiNCR';

function write({ dog, rescue, type, tone, settings }) {
  const n = dog.name;
  const he = dog.sex === 'female' ? 'she' : dog.sex === 'male' ? 'he' : 'they';
  const his = dog.sex === 'female' ? 'her' : dog.sex === 'male' ? 'his' : 'their';
  const He = he[0].toUpperCase() + he.slice(1);
  const where = rescue?.area || dog.rescued_from_area || 'the streets';
  const what = rescue?.rescue_type ? label(RESCUE_TYPE, rescue.rescue_type).toLowerCase() : '';
  const min = inr(settings.min_monthly_amount || 5000);
  const opener = {
    heartwarming: `Meet ${n}.`,
    urgent: `${n} needs you today.`,
    celebratory: `Big news about ${n}!`,
    inspiring: `This is ${n}, and ${he} didn’t give up.`,
    educational: `Did you know Indie dogs like ${n} are among the healthiest, smartest dogs in India?`,
  }[tone];
  const body = {
    rescue: `We found ${n} in ${where}${what ? ` — a ${what} case` : ''}. ${dog.story || `${He} was scared and hurt, but ${he} let us help.`} ${He}’s safe at our shelter now.`,
    recovery: `When ${n} came to us from ${where}, ${he} could barely stand. ${dog.story || ''} Weeks of treatment later, ${he}’s eating well, playing again and getting stronger every day.`,
    looking: `${n} is a ${dog.age_years ? ageLabel(dog.age_years).replace(/ (year|month)s?$/, '-$1-old') + ' ' : ''}${dog.colour ? `${dog.colour.toLowerCase()} ` : ''}Indie${dog.personality ? ` — ${dog.personality.charAt(0).toLowerCase()}${dog.personality.slice(1).replace(/[.!\s]+$/, '')}` : ''}. ${He}’s healthy, vaccinated and ready for a family.`,
    adopted: `${n} has found ${his} people! From ${where} to a home of ${his} own — thank you to everyone who shared, donated and cheered ${his} recovery.`,
    dog_of_week: `Our Dog of the Week is ${n}. ${dog.personality || ''} ${dog.story ? dog.story.split('.').slice(0, 2).join('.') + '.' : ''}`,
  }[type];
  const cta = type === 'adopted' ? 'Help the next dog: kudrathumane.org/donate' : `Foster ${n}, or virtually adopt ${his} care from ${min}/month: kudrathumane.org/dogs/${dog.id}`;
  const headline = { rescue: `Rescued: ${n}`, recovery: `${n} is healing`, looking: `Adopt ${n}`, adopted: `${n} went home!`, dog_of_week: `Dog of the week: ${n}` }[type];
  const full = `${opener} ${body}`.replace(/\s+/g, ' ').trim();
  const tw = `${opener} ${body}`.replace(/\s+/g, ' ').trim();
  const twitter = `${tw.length > 200 ? `${tw.slice(0, 197).trim()}…` : tw} kudrathumane.org #AdoptIndies`;
  return {
    headline,
    body: full,
    instagram: `${full}\n\n${cta.replace(/kudrathumane\.org\S*/, 'Link in bio.')}\n\n${TAGS}`,
    facebook: `${full}\n\n${cta}`,
    twitter: twitter.slice(0, 280),
  };
}

// Draws a 1080×1350 story card with the dog's photo, a marigold name tag and the headline.
async function drawCard(canvas, dog, headline) {
  const ctx = canvas.getContext('2d');
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  ctx.fillStyle = '#1E2A5A';
  ctx.fillRect(0, 0, W, H);
  await document.fonts?.load('800 64px "Bricolage Grotesque"').catch(() => {});
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = dogPhoto(dog, 1200);
    });
    const ph = 960;
    const scale = Math.max(W / img.width, ph / img.height);
    ctx.drawImage(img, (W - img.width * scale) / 2, (ph - img.height * scale) / 2, img.width * scale, img.height * scale);
  } catch {
    ctx.fillStyle = '#34417A';
    ctx.fillRect(0, 0, W, 960);
  }
  // name tag
  ctx.font = '800 88px "Bricolage Grotesque", sans-serif';
  const tw = ctx.measureText(dog.name).width + 150;
  ctx.fillStyle = '#F2A93B';
  ctx.beginPath();
  ctx.moveTo(0, 840);
  ctx.lineTo(tw - 40, 840);
  ctx.lineTo(tw, 905);
  ctx.lineTo(tw - 40, 970);
  ctx.lineTo(0, 970);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#F2F4EE';
  ctx.beginPath();
  ctx.arc(55, 905, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1E2A5A';
  ctx.fillText(dog.name, 95, 935);
  // headline
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 72px "Bricolage Grotesque", sans-serif';
  const words = headline.split(' ');
  let line = '';
  let y = 1080;
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > W - 140) {
      ctx.fillText(line, 70, y);
      line = w;
      y += 84;
    } else line = t;
  }
  ctx.fillText(line, 70, y);
  ctx.font = '600 36px Figtree, sans-serif';
  ctx.fillStyle = '#F2A93B';
  ctx.fillText('kudrathumane.org', 70, H - 70);
}

export default function Social() {
  const toast = useToast();
  const { data: dogs } = useDogs();
  const [tab, setTab] = useState('create');
  const [form, setForm] = useState({ dog_id: '', type: 'looking', tone: 'heartwarming' });
  const [out, setOut] = useState(null);
  const [featured, setFeatured] = useState(null);
  const canvas = useRef(null);
  const dog = (dogs || []).find((d) => d.id === form.dog_id);
  const { data: rescue } = useAsync(() => (form.dog_id ? list('rescues', { eq: { dog_id: form.dog_id }, limit: 1 }).then((r) => r[0]) : Promise.resolve(null)), [form.dog_id]);

  useEffect(() => {
    getSettings().then((s) => setFeatured(s.featured_dog_id));
  }, []);
  useEffect(() => {
    if (!dog) return setOut(null);
    getSettings().then((settings) => setOut(write({ dog, rescue, type: form.type, tone: form.tone, settings })));
  }, [dog, rescue, form.type, form.tone]);
  useEffect(() => {
    if (dog && out && canvas.current) drawCard(canvas.current, dog, out.headline);
  }, [dog, out?.headline]);

  const copy = (t) => navigator.clipboard.writeText(t).then(() => toast('Copied'));
  const download = () => {
    try {
      const a = document.createElement('a');
      a.download = `${dog.name}-${form.type}.png`;
      a.href = canvas.current.toDataURL('image/png');
      a.click();
    } catch {
      toast('This photo can’t be exported. Upload the dog’s photo from their profile and try again.', 'error');
    }
  };
  const save = async () => {
    try {
      await insert('social_posts', { dog_id: dog.id, story_type: form.type, tone: form.tone, headline: out.headline, body: out.body, instagram: out.instagram, facebook: out.facebook, twitter: out.twitter });
      toast('Saved to the content library');
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const feature = async () => {
    try {
      await update('settings', 1, { featured_dog_id: dog.id });
      clearSettingsCache();
      setFeatured(dog.id);
      toast(`${dog.name} is now Dog of the Week on the home page`);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div>
      <PageTitle title="Social media">Write a post and make a shareable image card from any dog’s profile. Edit the text before you post — it’s a starting point.</PageTitle>
      <Tabs value={tab} onChange={setTab} tabs={[['create', 'Create a post'], ['library', 'Saved posts']]} />
      {tab === 'library' ? (
        <div className="mt-5">
          <ResourceManager table="social_posts" select="*, dogs(name)" noun="post" canAdd={false}
            fields={[{ name: 'headline', label: 'Headline', span: 2 }, { name: 'instagram', label: 'Instagram', type: 'textarea', rows: 5 }, { name: 'facebook', label: 'Facebook', type: 'textarea', rows: 5 }, { name: 'twitter', label: 'X / Twitter', type: 'textarea' }]}
            columns={[
              { label: 'Saved', key: 'created_at', render: (r) => fmtDate(r.created_at), csv: (r) => r.created_at },
              { label: 'Dog', text: (r) => r.dogs?.name, render: (r) => r.dogs?.name || '—' },
              { label: 'Headline', key: 'headline', render: (r) => <span className="font-semibold">{r.headline}</span> },
              { label: 'Instagram', key: 'instagram', className: 'max-w-sm whitespace-pre-line text-xs text-ink-500' },
            ]}
            search={['headline', 'body', (r) => r.dogs?.name]} csvName="social-posts"
            rowActions={(r) => <Button size="sm" variant="ghost" onClick={() => copy(r.instagram)}>Copy</Button>} />
        </div>
      ) : (
        <div className="mt-5 grid gap-8 xl:grid-cols-[1fr_420px]">
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Dog"><Select value={form.dog_id} onChange={(e) => setForm({ ...form, dog_id: e.target.value })} placeholder="Choose a dog" options={(dogs || []).map((d) => [d.id, d.name])} /></Field>
              <Field label="Story"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={TYPES} /></Field>
              <Field label="Tone"><Select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} options={TONES} /></Field>
            </div>
            {out && (
              <>
                {[['instagram', 'Instagram caption', 8], ['facebook', 'Facebook post', 6], ['twitter', `X / Twitter (${out.twitter.length}/280)`, 3]].map(([k, l, rows]) => (
                  <Field key={k} label={l}>
                    <Textarea rows={rows} value={out[k]} onChange={(e) => setOut({ ...out, [k]: e.target.value })} />
                    <button type="button" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold underline" onClick={() => copy(out[k])}><Copy className="h-4 w-4" /> Copy</button>
                  </Field>
                ))}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={save}><Save className="h-4 w-4" /> Save to library</Button>
                  <Button variant={featured === dog.id ? 'dark' : 'soft'} onClick={feature} disabled={featured === dog.id}><Star className="h-4 w-4" /> {featured === dog.id ? 'Dog of the Week' : 'Make Dog of the Week'}</Button>
                </div>
              </>
            )}
            {!dog && <p className="text-ink-400">Choose a dog to start. Posts use the dog’s story, personality and rescue details — the better the profile, the better the post.</p>}
          </div>
          {dog && (
            <div>
              <canvas ref={canvas} className="w-full rounded-2xl" style={{ aspectRatio: '1080/1350' }} aria-label="Story card preview" />
              <Button variant="dark" className="mt-3 w-full" onClick={download}><Download className="h-4 w-4" /> Download image (1080×1350)</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
