import { useEffect, useState } from 'react';
import { ChevronRight, Star, Sparkles, Truck, ShieldCheck, RefreshCw, Heart, Ruler, Shirt, Camera, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import { useWishlist } from '@/context/WishlistContext';
import { navigate } from '@/lib/router';
import { formatPrice, classNames } from '@/lib/utils';
import type { Banner, Category, Product } from '@/types';
import { Spinner } from '@/components/ui/Feedback';

export function HomePage() {
  const { settings } = useSettings();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const [bRes, cRes, fRes, pRes] = await Promise.all([
        supabase.from('banners').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('products').select('*, category:categories(*)').eq('is_active', true).eq('is_featured', true).order('created_at', { ascending: false }).limit(8),
        supabase.from('products').select('*, category:categories(*)').eq('is_active', true).order('created_at', { ascending: false }).limit(8),
      ]);
      setBanners((bRes.data as Banner[]) ?? []);
      setCategories((cRes.data as Category[]) ?? []);
      setFeatured((fRes.data as Product[]) ?? []);
      setNewArrivals((pRes.data as Product[]) ?? []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setBannerIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const aiFeatures = [
    { icon: Ruler, title: 'AI Size Finder', desc: 'Find your perfect fit', path: '/ai-size' },
    { icon: Shirt, title: 'AI Outfit Planner', desc: 'Budget + occasion based', path: '/ai-outfit' },
    { icon: Camera, title: 'Virtual Try-On', desc: 'See it before you buy', path: '/virtual-tryon' },
    { icon: MessageCircle, title: 'Style Assistant', desc: 'Chat on WhatsApp', path: '/ai-stylist' },
  ];

  return (
    <div className="pb-4">
      {/* Hero Banner Carousel */}
      {banners.length > 0 ? (
        <div className="relative h-64 sm:h-80 overflow-hidden">
          {banners.map((banner, i) => (
            <div
              key={banner.id}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === bannerIndex ? 1 : 0 }}
            >
              <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2 className="text-2xl font-bold text-white mb-1">{banner.title}</h2>
                {banner.subtitle && <p className="text-zinc-300 text-sm">{banner.subtitle}</p>}
                {banner.link_url && (
                  <button
                    onClick={() => navigate(banner.link_url!)}
                    className="mt-3 inline-flex items-center gap-1 bg-amber-500 text-black px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Shop Now <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {banners.length > 1 && (
            <div className="absolute bottom-2 right-4 flex gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === bannerIndex ? 'w-6 bg-amber-500' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-64 sm:h-80 overflow-hidden bg-gradient-to-br from-zinc-900 via-black to-zinc-900">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <Sparkles className="text-amber-500 mb-3" size={40} />
            <h1 className="text-3xl font-bold text-white mb-2">{settings.hero_title}</h1>
            <p className="text-zinc-400">{settings.hero_subtitle}</p>
            <button
              onClick={() => navigate('/shop')}
              className="mt-4 inline-flex items-center gap-1 bg-amber-500 text-black px-6 py-2.5 rounded-xl text-sm font-semibold"
            >
              Shop Collection <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Feature badges */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Truck, label: 'Free Shipping', sub: `Over ${formatPrice(settings.free_shipping_threshold, settings.currency_symbol)}` },
            { icon: ShieldCheck, label: 'Secure Pay', sub: 'COD & Razorpay' },
            { icon: RefreshCw, label: 'Easy Returns', sub: '7-Day Return' },
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-1 bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
              <f.icon size={20} className="text-amber-500" />
              <span className="text-xs font-semibold text-white">{f.label}</span>
              <span className="text-[10px] text-zinc-500">{f.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Features Grid */}
      {settings.ai_enabled && (
        <div className="px-4 py-4">
          <h3 className="text-lg font-bold text-white mb-3">AI Powered</h3>
          <div className="grid grid-cols-2 gap-3">
            {aiFeatures.map((feat, i) => (
              <button
                key={i}
                onClick={() => navigate(feat.path)}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 p-4 text-left active:scale-95 transition"
              >
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center mb-2">
                  <feat.icon className="text-amber-400" size={20} />
                </div>
                <p className="text-sm font-bold text-white">{feat.title}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{feat.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">Categories</h3>
            <button onClick={() => navigate('/shop')} className="text-amber-400 text-sm font-medium">
              See All
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/shop?cat=${cat.slug}`)}
                className="flex flex-col items-center gap-2 shrink-0"
              >
                <div className="h-20 w-20 rounded-2xl bg-zinc-900 border border-amber-500/20 flex items-center justify-center overflow-hidden">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-amber-500">{cat.name[0]}</span>
                  )}
                </div>
                <span className="text-xs font-medium text-zinc-300 max-w-[80px] text-center truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">Featured</h3>
            <button onClick={() => navigate('/shop?filter=featured')} className="text-amber-400 text-sm font-medium">
              See All
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featured.map((p) => <ProductCard key={p.id} product={p} currency={settings.currency_symbol} />)}
          </div>
        </div>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">New Arrivals</h3>
            <button onClick={() => navigate('/shop')} className="text-amber-400 text-sm font-medium">
              See All
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {newArrivals.map((p) => (
              <div key={p.id} className="w-40 shrink-0">
                <ProductCard product={p} currency={settings.currency_symbol} compact />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductCard({ product, currency, compact }: { product: Product; currency: string; compact?: boolean }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);
  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <div className="group relative">
      <button
        onClick={() => navigate(`/product/${product.slug}`)}
        className="block w-full text-left"
      >
        <div className={`relative ${compact ? 'aspect-[3/4]' : 'aspect-square'} rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800`}>
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-zinc-700 text-xs">No image</span>
            </div>
          )}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute top-2 right-8 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Out of stock
            </span>
          )}
        </div>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
        className={classNames(
          'absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center transition',
          inWishlist ? 'bg-red-500/90' : 'bg-black/60 backdrop-blur-sm'
        )}
      >
        <Heart size={16} className={inWishlist ? 'fill-white text-white' : 'text-white'} />
      </button>
      <button onClick={() => navigate(`/product/${product.slug}`)} className="block w-full text-left mt-2">
        <p className="text-sm font-medium text-white truncate">{product.name}</p>
        {!compact && product.category && (
          <p className="text-xs text-zinc-500 truncate">{product.category.name}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-sm font-bold text-amber-400">{formatPrice(product.price, currency)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-xs text-zinc-600 line-through">{formatPrice(product.compare_at_price, currency)}</span>
          )}
        </div>
        {!compact && product.rating > 0 && (
          <div className="flex items-center gap-0.5 mt-1">
            <Star size={12} className="fill-amber-500 text-amber-500" />
            <span className="text-xs text-zinc-400">{product.rating.toFixed(1)} ({product.review_count})</span>
          </div>
        )}
      </button>
    </div>
  );
}
