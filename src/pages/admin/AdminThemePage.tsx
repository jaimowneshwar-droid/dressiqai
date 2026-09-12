import { useState } from 'react';
import { Save, Palette } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Form';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Spinner } from '@/components/ui/Feedback';

export function AdminThemePage() {
  const { settings, refresh } = useSettings();
  const [form, setForm] = useState({
    store_name: settings.store_name,
    logo_url: settings.logo_url ?? '',
    app_icon_url: settings.app_icon_url ?? '',
    primary_color: settings.primary_color,
    secondary_color: settings.secondary_color,
    accent_color: settings.accent_color,
    hero_title: settings.hero_title,
    hero_subtitle: settings.hero_subtitle,
    free_shipping_threshold: settings.free_shipping_threshold,
    shipping_flat_rate: settings.shipping_flat_rate,
    currency_symbol: settings.currency_symbol,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await supabase.from('app_settings').update({
      store_name: form.store_name,
      logo_url: form.logo_url || null,
      app_icon_url: form.app_icon_url || null,
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
      accent_color: form.accent_color,
      hero_title: form.hero_title,
      hero_subtitle: form.hero_subtitle,
      free_shipping_threshold: form.free_shipping_threshold,
      shipping_flat_rate: form.shipping_flat_rate,
      currency_symbol: form.currency_symbol,
    }).eq('id', settings.id);
    setSaving(false);
    setSaved(true);
    refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings.id) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-2 text-amber-400">
        <Palette size={20} />
        <h2 className="text-base font-bold text-white">Theme & Branding</h2>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
        <Input label="Store Name" value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} />
        <ImageUpload value={form.logo_url} onChange={(v) => setForm({ ...form, logo_url: v })} label="Logo" />
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">App Icon</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Used as the browser favicon and the installed PWA / home-screen icon. Upload a square image (512x512 or larger recommended). Separate from the store logo above.</p>
        </div>
        <ImageUpload value={form.app_icon_url} onChange={(v) => setForm({ ...form, app_icon_url: v })} label="App Icon" />
        {form.app_icon_url && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-16 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800">
                <img src={form.app_icon_url} alt="App icon preview" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs text-zinc-600">Favicon / 192px</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-20 w-20 rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-800">
                <img src={form.app_icon_url} alt="App icon preview" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs text-zinc-600">PWA / 512px</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Colors</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'primary_color', label: 'Primary (Gold)' },
            { key: 'secondary_color', label: 'Secondary (Black)' },
            { key: 'accent_color', label: 'Accent' },
          ].map((c) => (
            <div key={c.key} className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-300">{c.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(form as any)[c.key]}
                  onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                  className="h-10 w-12 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
                />
                <input
                  value={(form as any)[c.key]}
                  onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Hero Section</h3>
        <Input label="Hero Title" value={form.hero_title} onChange={(e) => setForm({ ...form, hero_title: e.target.value })} />
        <Textarea label="Hero Subtitle" value={form.hero_subtitle} onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })} />
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Shipping & Currency</h3>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Free Shipping Threshold" type="number" step="0.01" value={form.free_shipping_threshold} onChange={(e) => setForm({ ...form, free_shipping_threshold: Number(e.target.value) })} />
          <Input label="Flat Shipping Rate" type="number" step="0.01" value={form.shipping_flat_rate} onChange={(e) => setForm({ ...form, shipping_flat_rate: Number(e.target.value) })} />
        </div>
        <Input label="Currency Symbol" value={form.currency_symbol} onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })} />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? <Spinner size={16} /> : <><Save size={16} /> Save Changes</>}</Button>
        {saved && <span className="text-sm text-green-400">Saved successfully!</span>}
      </div>
    </div>
  );
}
