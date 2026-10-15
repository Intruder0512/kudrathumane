import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { uploadFile } from '@/lib/data';
import { onImgError } from '@/lib/images';
import { useToast } from './ui';

// value: string (single) or string[] (multiple)
export default function ImageUpload({ value, onChange, multiple = false, folder = 'misc', label = 'Add photo' }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const urls = multiple ? value || [] : value ? [value] : [];

  const pick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    try {
      const uploaded = [];
      for (const f of files) uploaded.push(await uploadFile(f, folder));
      onChange(multiple ? [...urls, ...uploaded] : uploaded[0]);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const drop = (u) => onChange(multiple ? urls.filter((x) => x !== u) : '');

  return (
    <div className="flex flex-wrap gap-3">
      {urls.map((u) => (
        <div key={u} className="relative h-24 w-24 overflow-hidden rounded-xl bg-wall-2">
          <img src={u} alt="" onError={onImgError} className="h-full w-full object-cover" />
          <button type="button" onClick={() => drop(u)} className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-white" aria-label="Remove photo">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {(multiple || urls.length === 0) && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-wall-3 text-xs font-semibold text-ink-400 hover:border-ink-300 hover:text-ink"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          {busy ? 'Uploading' : label}
        </button>
      )}
      {!multiple && urls.length > 0 && (
        <button type="button" className="self-end text-sm font-semibold underline" onClick={() => input.current?.click()}>
          Change
        </button>
      )}
      <input ref={input} type="file" accept="image/*" multiple={multiple} hidden onChange={pick} />
    </div>
  );
}
