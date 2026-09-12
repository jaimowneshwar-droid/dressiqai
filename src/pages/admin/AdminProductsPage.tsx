import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Toggle } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { MultiImageUpload } from '@/components/admin/ImageUpload';
import { Spinner, EmptyState } from '@/components/ui/Feedback';
import { slugify, formatPrice } from '@/lib/utils';
import { useSettings } from '@/context/SettingsContext';
import type { Product, Category } from '@/types';

export function AdminProductsPage() {
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: 0, compare_at_price: null as number | null,
    stock: 0, sku: '', category_id: '' as string, images: [] as string[],
    sizes: [] as string[], colors: [] as string[], is_featured: false, is_active: true,
  });
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      supabase.from('products').select('*, category:categories(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ]);
    setProducts((pRes.data as Product[]) ?? []);
    setCategories((cRes.data as Category[]) ?? []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', price: 0, compare_at_price: null, stock: 0, sku: '', category_id: '', images: [], sizes: [], colors: [], is_featured: false, is_active: true });
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, description: p.description, price: p.price,
      compare_at_price: p.compare_at_price, stock: p.stock, sku: p.sku,
      category_id: p.category_id ?? '', images: p.images, sizes: p.sizes, colors: p.colors,
      is_featured: p.is_featured, is_active: p.is_active,
    });
    setShowForm(true);
  }

  async function save() {
    const payload = { ...form, slug: form.slug || slugify(form.name), compare_at_price: form.compare_at_price || null, category_id: form.category_id || null };
    if (editing) {
      await supabase.from('products').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('products').insert(payload);
    }
    setShowForm(false);
    load();
  }

  async function del(id: string) {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    load();
  }

  function addSize() { if (sizeInput.trim()) { setForm({ ...form, sizes: [...form.sizes, sizeInput.trim()] }); setSizeInput(''); } }
  function addColor() { if (colorInput.trim()) { setForm({ ...form, colors: [...form.colors, colorInput.trim()] }); setColorInput(''); } }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 bg-zinc-900 rounded-xl border border-zinc-800 px-3 py-2 flex-1 max-w-xs">
          <Search size={16} className="text-zinc-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="flex-1 bg-transparent text-white text-sm outline-none" />
        </div>
        <Button onClick={openNew} size="sm"><Plus size={16} /> Add Product</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Plus size={40} />} title="No products yet" subtitle="Add your first product" />
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="flex gap-3 bg-zinc-900 rounded-xl border border-zinc-800 p-3">
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center">
                {p.images[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-zinc-600">No img</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{p.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-bold text-amber-400">{formatPrice(p.price, settings.currency_symbol)}</span>
                  {p.compare_at_price && <span className="text-xs text-zinc-600 line-through">{formatPrice(p.compare_at_price, settings.currency_symbol)}</span>}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.stock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</span>
                  {p.is_featured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Featured</span>}
                  {!p.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">Hidden</span>}
                  {p.category && <span className="text-[10px] text-zinc-500">{p.category.name}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => openEdit(p)} className="p-2 text-zinc-400 hover:text-amber-400"><Pencil size={16} /></button>
                <button onClick={() => del(p.id)} className="p-2 text-zinc-400 hover:text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Product' : 'Add Product'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Slug (auto if empty)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            <Input label="Compare-at Price (optional)" type="number" step="0.01" value={form.compare_at_price ?? ''} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
            <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Category</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none">
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <MultiImageUpload value={form.images} onChange={(urls) => setForm({ ...form, images: urls })} />

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Sizes</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.sizes.map((s) => (
                <span key={s} className="flex items-center gap-1 bg-zinc-800 text-zinc-300 text-sm px-2 py-1 rounded-lg">
                  {s}
                  <button onClick={() => setForm({ ...form, sizes: form.sizes.filter(x => x !== s) })} className="text-zinc-500 hover:text-red-400">x</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSize(); } }} placeholder="e.g. S, M, L" className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none" />
              <button type="button" onClick={addSize} className="px-3 py-2 rounded-lg bg-zinc-700 text-white text-sm">Add</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Colors</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.colors.map((c) => (
                <span key={c} className="flex items-center gap-1 bg-zinc-800 text-zinc-300 text-sm px-2 py-1 rounded-lg">
                  {c}
                  <button onClick={() => setForm({ ...form, colors: form.colors.filter(x => x !== c) })} className="text-zinc-500 hover:text-red-400">x</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={colorInput} onChange={(e) => setColorInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }} placeholder="e.g. Black, Gold" className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none" />
              <button type="button" onClick={addColor} className="px-3 py-2 rounded-lg bg-zinc-700 text-white text-sm">Add</button>
            </div>
          </div>

          <Toggle label="Featured" checked={form.is_featured} onChange={(v) => setForm({ ...form, is_featured: v })} />
          <Toggle label="Active (visible in store)" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          <Button onClick={save} className="w-full">{editing ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
    </div>
  );
}
