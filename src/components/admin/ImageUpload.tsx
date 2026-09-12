import { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label = 'Image' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('dressiq-assets')
      .upload(fileName, file, { contentType: file.type });
    if (!error) {
      const { data: urlData } = supabase.storage
        .from('dressiq-assets')
        .getPublicUrl(fileName);
      onChange(urlData.publicUrl);
    }
    setUploading(false);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-300">{label}</label>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800">
          <img src={value} alt="" className="w-full h-32 object-cover" />
          <button
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-black/80 text-white rounded-lg p-1.5 hover:bg-black"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800/50 cursor-pointer hover:border-amber-500 transition">
          {uploading ? (
            <Loader2 size={24} className="animate-spin text-amber-500" />
          ) : (
            <>
              <Upload size={24} className="text-zinc-500" />
              <span className="text-sm text-zinc-500">Click to upload</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      )}
      <div className="flex gap-2">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="or paste image URL"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => { if (urlInput) { onChange(urlInput); setUrlInput(''); } }}
          className="px-3 py-2 rounded-lg bg-zinc-700 text-white text-sm hover:bg-zinc-600"
        >
          Set
        </button>
      </div>
    </div>
  );
}

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}

export function MultiImageUpload({ value, onChange, label = 'Images' }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('dressiq-assets').upload(fileName, file, { contentType: file.type });
      if (!error) {
        const { data: urlData } = supabase.storage.from('dressiq-assets').getPublicUrl(fileName);
        urls.push(urlData.publicUrl);
      }
    }
    onChange([...value, ...urls]);
    setUploading(false);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-300">{label}</label>
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute top-0.5 right-0.5 bg-black/80 text-white rounded p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <label className="flex items-center justify-center h-20 w-20 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 cursor-pointer hover:border-amber-500 transition">
          {uploading ? (
            <Loader2 size={20} className="animate-spin text-amber-500" />
          ) : (
            <Upload size={20} className="text-zinc-500" />
          )}
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
        </label>
      </div>
    </div>
  );
}
