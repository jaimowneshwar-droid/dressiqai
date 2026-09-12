import { useState } from 'react';
import { Save, Phone, MessageCircle, Instagram } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Form';
import { Spinner } from '@/components/ui/Feedback';

export function AdminContactPage() {
  const { settings, refresh } = useSettings();
  const [form, setForm] = useState({
    contact_email: settings.contact_email,
    contact_phone: settings.contact_phone,
    contact_phone_2: settings.contact_phone_2 ?? '',
    whatsapp_number: settings.whatsapp_number ?? '',
    instagram_url: settings.instagram_url ?? '',
    contact_address: settings.contact_address,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await supabase.from('app_settings').update({
      contact_email: form.contact_email,
      contact_phone: form.contact_phone,
      contact_phone_2: form.contact_phone_2 || null,
      whatsapp_number: form.whatsapp_number || null,
      instagram_url: form.instagram_url || null,
      contact_address: form.contact_address,
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
        <Phone size={20} />
        <h2 className="text-base font-bold text-white">Contact Details</h2>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
        <Input label="Contact Email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
        <Input label="Primary Phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
        <Input label="Secondary Phone (optional)" value={form.contact_phone_2} onChange={(e) => setForm({ ...form, contact_phone_2: e.target.value })} />
        <Textarea label="Address" value={form.contact_address} onChange={(e) => setForm({ ...form, contact_address: e.target.value })} />
      </div>

      <div className="flex items-center gap-2 text-amber-400">
        <MessageCircle size={20} />
        <h2 className="text-base font-bold text-white">WhatsApp & Social</h2>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
        <div>
          <Input
            label="WhatsApp Number"
            placeholder="919876543210"
            value={form.whatsapp_number}
            onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
          />
          <p className="text-xs text-zinc-500 mt-1">Digits only with country code. This opens a direct chat on the Contact page.</p>
        </div>
        <div>
          <Input
            label="Instagram Profile URL"
            placeholder="https://instagram.com/yourstore"
            value={form.instagram_url}
            onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
          />
          <p className="text-xs text-zinc-500 mt-1">Full URL to your Instagram profile.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? <Spinner size={16} /> : <><Save size={16} /> Save Changes</>}</Button>
        {saved && <span className="text-sm text-green-400">Saved successfully!</span>}
      </div>
    </div>
  );
}
