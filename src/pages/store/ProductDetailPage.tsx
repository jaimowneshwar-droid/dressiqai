import { useEffect, useState } from 'react';
import { Star, ShoppingBag, Minus, Plus, Truck, ShieldCheck, RefreshCw, ChevronLeft, Heart, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { navigate } from '@/lib/router';
import { formatPrice, classNames } from '@/lib/utils';
import type { Product, Review } from '@/types';
import { Spinner, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Form';
import { ProductCard } from '@/pages/store/HomePage';

export function ProductDetailPage({ slug }: { slug: string }) {
  const { settings } = useSettings();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageIdx, setImageIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [added, setAdded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ author_name: '', author_email: '', rating: 5, title: '', comment: '' });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: prod } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (prod) {
        setProduct(prod as Product);
        if ((prod as Product).sizes.length > 0) setSelectedSize((prod as Product).sizes[0]);
        if ((prod as Product).colors.length > 0) setSelectedColor((prod as Product).colors[0]);

        const [rRes, relRes] = await Promise.all([
          supabase.from('reviews').select('*').eq('product_id', prod.id).eq('is_approved', true).order('created_at', { ascending: false }),
          supabase.from('products').select('*, category:categories(*)').eq('is_active', true).eq('category_id', prod.category_id).neq('id', prod.id).limit(4),
        ]);
        setReviews((rRes.data as Review[]) ?? []);
        setRelated((relRes.data as Product[]) ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  function handleAddToCart() {
    if (!product) return;
    addToCart(product, qty, selectedSize || undefined, selectedColor || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    if (!product) return;
    addToCart(product, qty, selectedSize || undefined, selectedColor || undefined);
    navigate('/checkout');
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    const { error } = await supabase.from('reviews').insert({
      product_id: product.id,
      ...reviewForm,
    });
    if (!error) {
      setReviewSubmitted(true);
      setReviewForm({ author_name: '', author_email: '', rating: 5, title: '', comment: '' });
      setTimeout(() => { setShowReviewForm(false); setReviewSubmitted(false); }, 2500);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  if (!product) {
    return (
      <div className="py-20">
        <EmptyState icon={<ShoppingBag size={40} />} title="Product not found" />
        <div className="text-center">
          <Button onClick={() => navigate('/shop')}>Back to Shop</Button>
        </div>
      </div>
    );
  }

  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;
  const inWishlist = isInWishlist(product.id);

  return (
    <div className="pb-6">
      <div className="px-4 py-3">
        <button onClick={() => window.history.back()} className="flex items-center gap-1 text-zinc-400 text-sm">
          <ChevronLeft size={18} /> Back
        </button>
      </div>

      <div className="relative aspect-square bg-zinc-900 overflow-hidden">
        {product.images[imageIdx] ? (
          <img src={product.images[imageIdx]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700">No image</div>
        )}
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-amber-500 text-black text-xs font-bold px-2.5 py-1 rounded-full">
            -{discount}% OFF
          </span>
        )}
        <button
          onClick={() => toggleWishlist(product, selectedSize, selectedColor)}
          className={classNames(
            'absolute top-3 right-3 h-10 w-10 rounded-full flex items-center justify-center transition',
            inWishlist ? 'bg-red-500' : 'bg-black/60 backdrop-blur-sm'
          )}
        >
          <Heart size={20} className={inWishlist ? 'fill-white text-white' : 'text-white'} />
        </button>
      </div>
      {product.images.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setImageIdx(i)}
              className={classNames(
                'h-16 w-16 rounded-lg overflow-hidden border-2 shrink-0',
                i === imageIdx ? 'border-amber-500' : 'border-zinc-800'
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        <div>
          {product.category && (
            <button onClick={() => navigate(`/shop?cat=${product.category!.slug}`)} className="text-xs text-amber-400 font-medium">
              {product.category.name}
            </button>
          )}
          <h1 className="text-xl font-bold text-white mt-1">{product.name}</h1>
          {product.rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} className={s <= Math.round(product.rating) ? 'fill-amber-500 text-amber-500' : 'text-zinc-700'} />
                ))}
              </div>
              <span className="text-xs text-zinc-400">{product.rating.toFixed(1)} ({product.review_count} reviews)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-amber-400">{formatPrice(product.price, settings.currency_symbol)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <>
              <span className="text-base text-zinc-600 line-through">{formatPrice(product.compare_at_price, settings.currency_symbol)}</span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
                Save {formatPrice(product.compare_at_price - product.price, settings.currency_symbol)}
              </span>
            </>
          )}
        </div>

        {product.sizes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-zinc-300">Size</p>
              <button onClick={() => navigate('/ai-size')} className="text-xs text-amber-400 font-medium flex items-center gap-1">
                <Zap size={12} /> AI Size Finder
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button key={size} onClick={() => setSelectedSize(size)}
                  className={classNames('min-w-10 px-3 py-2 rounded-lg text-sm font-medium transition',
                    selectedSize === size ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800')}>{size}</button>
              ))}
            </div>
          </div>
        )}

        {product.colors.length > 0 && (
          <div>
            <p className="text-sm font-medium text-zinc-300 mb-2">Color</p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <button key={color} onClick={() => setSelectedColor(color)}
                  className={classNames('px-3 py-2 rounded-lg text-sm font-medium transition',
                    selectedColor === color ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800')}>{color}</button>
              ))}
            </div>
          </div>
        )}

        <div>
          {product.stock > 0 ? (
            <span className="text-sm text-green-500 font-medium">In Stock ({product.stock} available)</span>
          ) : (
            <span className="text-sm text-red-500 font-medium">Out of Stock</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-900 rounded-xl border border-zinc-800">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5 text-zinc-400 hover:text-white"><Minus size={18} /></button>
            <span className="px-4 text-white font-semibold">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="p-2.5 text-zinc-400 hover:text-white"><Plus size={18} /></button>
          </div>
          <Button onClick={handleAddToCart} disabled={product.stock === 0} className="flex-1" size="lg">{added ? 'Added!' : 'Add to Cart'}</Button>
        </div>
        <Button onClick={handleBuyNow} disabled={product.stock === 0} variant="secondary" className="w-full" size="lg">Buy Now</Button>

        {product.description && (
          <div className="pt-2">
            <h3 className="text-sm font-bold text-white mb-2">Description</h3>
            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-2">
          {[
            { icon: Truck, label: 'Fast Shipping' },
            { icon: ShieldCheck, label: 'Secure Payment' },
            { icon: RefreshCw, label: 'Easy Returns' },
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-1 bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
              <f.icon size={18} className="text-amber-500" />
              <span className="text-[10px] text-zinc-400 text-center">{f.label}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white">Reviews ({reviews.length})</h3>
            <button onClick={() => setShowReviewForm(!showReviewForm)} className="text-amber-400 text-sm font-medium">Write a Review</button>
          </div>

          {showReviewForm && (
            <form onSubmit={submitReview} className="mb-4 bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-3">
              {reviewSubmitted ? (
                <p className="text-green-500 text-sm text-center py-2">Thank you! Your review is pending approval.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Name" required value={reviewForm.author_name} onChange={(e) => setReviewForm({ ...reviewForm, author_name: e.target.value })} />
                    <Input label="Email" type="email" value={reviewForm.author_email} onChange={(e) => setReviewForm({ ...reviewForm, author_email: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: s })}>
                          <Star size={24} className={s <= reviewForm.rating ? 'fill-amber-500 text-amber-500' : 'text-zinc-700'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input label="Title" value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} />
                  <Textarea label="Comment" required value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} />
                  <Button type="submit" className="w-full">Submit Review</Button>
                </>
              )}
            </form>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-6">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">{rev.author_name}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} className={s <= rev.rating ? 'fill-amber-500 text-amber-500' : 'text-zinc-700'} />
                      ))}
                    </div>
                  </div>
                  {rev.title && <p className="text-sm font-medium text-zinc-300 mb-1">{rev.title}</p>}
                  <p className="text-sm text-zinc-400">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {related.length > 0 && (
          <div className="pt-4 border-t border-zinc-800">
            <h3 className="text-base font-bold text-white mb-3">You May Also Like</h3>
            <div className="grid grid-cols-2 gap-3">
              {related.map((p) => <ProductCard key={p.id} product={p} currency={settings.currency_symbol} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
