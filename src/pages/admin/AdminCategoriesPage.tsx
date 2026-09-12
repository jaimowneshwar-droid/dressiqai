import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input, Toggle } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Spinner, EmptyState } from '@/components/ui/Feedback';
import { slugify } from '@/lib/utils';
import type { Category } from '@/types';

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', icon_name: 'Tag', image_url: '', sort_order: 0, is_active: true });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories((data as Category[]) ?? []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ name: '', slug: '', icon_name: 'Tag', image_url: '', sort_order: 0, is_active: true });
    setShowForm(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, icon_name: c.icon_name, image_url: c.image_url ?? '', sort_order: c.sort_order, is_active: c.is_active });
    setShowForm(true);
  }

  async function save() {
    const payload = { ...form, slug: form.slug || slugify(form.name) };
    if (editing) {
      await supabase.from('categories').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('categories').insert(payload);
    }
    setShowForm(false);
    load();
  }

  async function del(id: string) {
    if (!confirm('Delete this category? Products in it will be uncategorized.')) return;
    await supabase.from('categories').delete().eq('id', id);
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-500">{categories.length} categories</p>
        <Button onClick={openNew} size="sm"><Plus size={16} /> Add Category</Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={<Plus size={40} />} title="No categories yet" subtitle="Add your first category" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((c) => (
            <div key={c.id} className="flex gap-3 bg-zinc-900 rounded-xl border border-zinc-800 p-3">
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center">
                {c.image_url ? <img src={c.image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-amber-500">{c.name[0]}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{c.name}</p>
                <p className="text-xs text-zinc-500">/{c.slug}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>{c.is_active ? 'Active' : 'Hidden'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => openEdit(c)} className="p-2 text-zinc-400 hover:text-amber-400"><Pencil size={16} /></button>
                <button onClick={() => del(c.id)} className="p-2 text-zinc-400 hover:text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Slug (leave empty to auto-generate)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" />
          <Input label="Icon Name (lucide-react)" value={form.icon_name} onChange={(e) => setForm({ ...form, icon_name: e.target.value })} />
          <ImageUpload value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} />
          <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          <Toggle label="Active" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          <Button onClick={save} className="w-full">{editing ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
    </div>
  );
}
