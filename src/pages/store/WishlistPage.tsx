import { Heart, ChevronLeft, Trash2, ShoppingBag } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { navigate } from '@/lib/router';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { supabase } from '@/lib/supabase';

export function WishlistPage() {
  const { items, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { settings } = useSettings();

  async function moveToCart(productId: string) {
    const item = items.find((i) => i.product_id === productId);
    if (item?.product) {
      addToCart(item.product, 1, item.size || undefined, item.color || undefined);
      await toggleWishlist(item.product, item.size || undefined, item.color || undefined);
    }
  }

  return (
    <div className="pb-6">
      <div className="px-4 py-3">
        <button onClick={() => window.history.back()} className="flex items-center gap-1 text-zinc-400 text-sm mb-2">
          <ChevronLeft size={18} /> Back
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Heart className="text-amber-400" size={24} /> Wishlist
        </h1>
        <p className="text-sm text-zinc-500 mt-1">{items.length} saved items</p>
      </div>

      {items.length === 0 ? (
        <div className="py-10">
          <EmptyState icon={<Heart size={48} />} title="Your wishlist is empty" subtitle="Save items you love by tapping the heart icon" />
          <div className="text-center mt-4">
            <Button onClick={() => navigate('/shop')}>Browse Products</Button>
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 bg-zinc-900 rounded-xl p-3 border border-zinc-800">
              <button onClick={() => navigate(`/product/${item.product?.slug}`)} className="h-20 w-20 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                {item.product?.images[0] ? <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" /> : null}
              </button>
              <div className="flex-1 min-w-0">
                <button onClick={() => navigate(`/product/${item.product?.slug}`)} className="block w-full text-left">
                  <p className="text-sm font-medium text-white truncate">{item.product?.name}</p>
                  {(item.size || item.color) && <p className="text-xs text-zinc-500 mt-0.5">{[item.size, item.color].filter(Boolean).join(' / ')}</p>}
                  <p className="text-sm font-bold text-amber-400 mt-1">{formatPrice(item.product?.price ?? 0, settings.currency_symbol)}</p>
                </button>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => moveToCart(item.product_id)} className="flex items-center gap-1 bg-amber-500 text-black text-xs font-semibold px-3 py-1.5 rounded-lg">
                    <ShoppingBag size={14} /> Add to Cart
                  </button>
                  <button onClick={() => item.product && toggleWishlist(item.product, item.size || undefined, item.color || undefined)} className="flex items-center gap-1 bg-zinc-800 text-zinc-400 text-xs font-medium px-3 py-1.5 rounded-lg hover:text-red-400">
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
