import { Minus, Plus, Trash2, ShoppingBag, ChevronLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { navigate } from '@/lib/router';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';

export function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal, totalItems } = useCart();
  const { settings } = useSettings();

  const shipping = subtotal >= settings.free_shipping_threshold || subtotal === 0 ? 0 : settings.shipping_flat_rate;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="py-20">
        <EmptyState icon={<ShoppingBag size={48} />} title="Your cart is empty" subtitle="Start shopping to add items" />
        <div className="text-center mt-4">
          <Button onClick={() => navigate('/shop')}>Browse Products</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="px-4 py-3">
        <button onClick={() => window.history.back()} className="flex items-center gap-1 text-zinc-400 text-sm">
          <ChevronLeft size={18} /> Continue Shopping
        </button>
      </div>

      <div className="px-4">
        <h1 className="text-xl font-bold text-white mb-4">Cart ({totalItems})</h1>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 bg-zinc-900 rounded-xl p-3 border border-zinc-800">
              <button onClick={() => navigate(`/product/${item.product.slug}`)} className="h-20 w-20 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                {item.product.images[0] ? (
                  <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No img</div>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <button onClick={() => navigate(`/product/${item.product.slug}`)} className="text-sm font-medium text-white truncate block text-left">{item.product.name}</button>
                {(item.size || item.color) && (
                  <p className="text-xs text-zinc-500 mt-0.5">{[item.size, item.color].filter(Boolean).join(' / ')}</p>
                )}
                <p className="text-sm font-bold text-amber-400 mt-1">{formatPrice(item.product.price, settings.currency_symbol)}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center bg-zinc-800 rounded-lg">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size, item.color)} className="p-1.5 text-zinc-400 hover:text-white"><Minus size={16} /></button>
                    <span className="px-3 text-sm text-white font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size, item.color)} className="p-1.5 text-zinc-400 hover:text-white"><Plus size={16} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id, item.size, item.color)} className="text-red-500/70 hover:text-red-500 p-1"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-zinc-400">Subtotal</span><span className="text-white font-medium">{formatPrice(subtotal, settings.currency_symbol)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-zinc-400">Shipping</span><span className="text-white font-medium">{shipping === 0 ? 'FREE' : formatPrice(shipping, settings.currency_symbol)}</span></div>
          {shipping > 0 && <p className="text-xs text-amber-500/80">Add {formatPrice(settings.free_shipping_threshold - subtotal, settings.currency_symbol)} more for free shipping</p>}
          <div className="border-t border-zinc-800 pt-2 flex justify-between"><span className="text-base font-bold text-white">Total</span><span className="text-base font-bold text-amber-400">{formatPrice(total, settings.currency_symbol)}</span></div>
        </div>

        <Button onClick={() => navigate('/checkout')} className="w-full mt-4" size="lg">Proceed to Checkout</Button>
      </div>
    </div>
  );
}
