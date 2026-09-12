import { useEffect, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import type { Category, Product } from '@/types';
import { ProductCard } from '@/pages/store/HomePage';
import { Spinner, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { classNames } from '@/lib/utils';

const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 - ₹2,500', min: 1000, max: 2500 },
  { label: '₹2,500 - ₹5,000', min: 2500, max: 5000 },
  { label: 'Over ₹5,000', min: 5000, max: 999999 },
];

export function ShopPage() {
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const query = params.get('q') || '';
  const catSlug = params.get('cat') || '';
  const filter = params.get('filter') || '';

  const [sortBy, setSortBy] = useState('newest');
  const [activeCat, setActiveCat] = useState(catSlug);
  const [onlyFeatured, setOnlyFeatured] = useState(filter === 'featured');
  const [priceRange, setPriceRange] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        supabase.from('products').select('*, category:categories(*)').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      ]);
      setProducts((pRes.data as Product[]) ?? []);
      setCategories((cRes.data as Category[]) ?? []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    setActiveCat(catSlug);
    setOnlyFeatured(filter === 'featured');
  }, [catSlug, filter]);

  let filtered = products;
  if (query) {
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase())
    );
  }
  if (activeCat) {
    filtered = filtered.filter((p) => p.category?.slug === activeCat);
  }
  if (onlyFeatured) {
    filtered = filtered.filter((p) => p.is_featured);
  }
  if (priceRange !== null) {
    const range = PRICE_RANGES[priceRange];
    filtered = filtered.filter((p) => p.price >= range.min && p.price < range.max);
  }
  if (sortBy === 'price-low') filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === 'price-high') filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sortBy === 'rating') filtered = [...filtered].sort((a, b) => b.rating - a.rating);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 py-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {query ? `Search: "${query}"` : activeCat ? categories.find(c => c.slug === activeCat)?.name ?? 'Shop' : 'Shop All'}
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">{filtered.length} products</p>
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          <button
            onClick={() => setActiveCat('')}
            className={classNames(
              'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition',
              !activeCat ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.slug)}
              className={classNames(
                'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition',
                activeCat === cat.slug ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Products grid */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<SlidersHorizontal size={40} />} title="No products found" subtitle="Try changing filters" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} currency={settings.currency_symbol} />
            ))}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {filterOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setFilterOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-800 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Filters & Sort</h3>
              <button onClick={() => setFilterOpen(false)} className="text-zinc-400"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-zinc-300 mb-2">Sort By</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'newest', label: 'Newest' },
                    { val: 'price-low', label: 'Price: Low to High' },
                    { val: 'price-high', label: 'Price: High to Low' },
                    { val: 'rating', label: 'Top Rated' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setSortBy(opt.val)}
                      className={classNames(
                        'px-3 py-2 rounded-lg text-sm transition',
                        sortBy === opt.val ? 'bg-amber-500 text-black font-semibold' : 'bg-zinc-800 text-zinc-400'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-300 mb-2">Price Range</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setPriceRange(null)}
                    className={classNames(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition',
                      priceRange === null ? 'bg-amber-500/20 text-amber-400 font-medium' : 'bg-zinc-800 text-zinc-400'
                    )}
                  >
                    All Prices
                  </button>
                  {PRICE_RANGES.map((range, i) => (
                    <button
                      key={i}
                      onClick={() => setPriceRange(i)}
                      className={classNames(
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition',
                        priceRange === i ? 'bg-amber-500/20 text-amber-400 font-medium' : 'bg-zinc-800 text-zinc-400'
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-300 mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveCat('')}
                    className={classNames(
                      'px-3 py-1.5 rounded-full text-sm transition',
                      !activeCat ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                    )}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCat(cat.slug)}
                      className={classNames(
                        'px-3 py-1.5 rounded-full text-sm transition',
                        activeCat === cat.slug ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyFeatured}
                  onChange={(e) => setOnlyFeatured(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                Featured only
              </label>
              <Button className="w-full" onClick={() => setFilterOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
