import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input, Toggle } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Spinner, EmptyState } from '@/components/ui/Feedback';
import type { Banner } from '@/types';

export function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '', sort_order: 0, is_active: true });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('banners').select('*').order('sort_order');
    setBanners((data as Banner[]) ?? []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ title: '', subtitle: '', image_url: '', link_url: '', sort_order: 0, is_active: true });
    setShowForm(true);
  }

  function openEdit(b: Banner) {
    setEditing(b);
    setForm({ title: b.title, subtitle: b.subtitle ?? '', image_url: b.image_url, link_url: b.link_url ?? '', sort_order: b.sort_order, is_active: b.is_active });
    setShowForm(true);
  }

  async function save() {
    if (editing) {
      await supabase.from('banners').update(form).eq('id', editing.id);
    } else {
      await supabase.from('banners').insert(form);
    }
    setShowForm(false);
    load();
  }

  async function del(id: string) {
    if (!confirm('Delete this banner?')) return;
    await supabase.from('banners').delete().eq('id', id);
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-500">{banners.length} banners</p>
        <Button onClick={openNew} size="sm"><Plus size={16} /> Add Banner</Button>
      </div>

      {banners.length === 0 ? (
        <EmptyState icon={<Plus size={40} />} title="No banners yet" subtitle="Add your first home banner" />
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b.id} className="flex gap-3 bg-zinc-900 rounded-xl border border-zinc-800 p-3">
              <div className="h-20 w-32 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{b.title || 'Untitled'}</p>
                <p className="text-xs text-zinc-500 truncate">{b.subtitle}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.is_active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                    {b.is_active ? 'Active' : 'Hidden'}
                  </span>
                  <span className="text-[10px] text-zinc-600">Order: {b.sort_order}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => openEdit(b)} className="p-2 text-zinc-400 hover:text-amber-400"><Pencil size={16} /></button>
                <button onClick={() => del(b.id)} className="p-2 text-zinc-400 hover:text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Banner' : 'Add Banner'}>
        <div className="space-y-4">
          <ImageUpload value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} />
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <Input label="Link URL (e.g. /shop)" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
          <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          <Toggle label="Active" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          <Button onClick={save} className="w-full">{editing ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
    </div>
  );
}
