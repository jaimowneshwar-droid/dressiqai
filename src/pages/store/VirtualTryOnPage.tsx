import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, ChevronLeft, Upload, Loader2, Sparkles, X, ShieldCheck, Search, ShoppingBag, Check } from 'lucide-react';
import { navigate } from '@/lib/router';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { classNames, formatPrice } from '@/lib/utils';
import { useSettings } from '@/context/SettingsContext';
import type { Product } from '@/types';

interface TryOnResult {
  description: string;
  fitScore: string;
  recommendations: string;
  colorAnalysis: string;
}

type PermissionState = 'idle' | 'asking' | 'denied' | 'granted';
type Step = 'photo' | 'product' | 'result';

export function VirtualTryOnPage() {
  const { settings } = useSettings();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState>('idle');
  const [step, setStep] = useState<Step>('photo');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const { data, error: err } = await supabase
          .from('products')
          .select('*, category:categories(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (err) throw err;
        setProducts((data as Product[]) || []);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setProductsLoading(false);
      }
    }
    loadProducts();
  }, []);

  const filteredProducts = products.filter((p) =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function requestPhotoAccess() {
    setPermission('asking');
  }

  function handleAllow() {
    setPermission('granted');
    setError(null);
    setTimeout(() => fileRef.current?.click(), 50);
  }

  function handleDeny() {
    setPermission('denied');
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB. Please choose a smaller photo.');
      return;
    }
    setImageMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setResult(null);
      setError(null);
      setStep('product');
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    setUploadedImage(null);
    setImageMime('image/jpeg');
    setResult(null);
    setError(null);
    setPermission('idle');
    setSelectedProduct(null);
    setSelectedSize('');
    setSelectedColor('');
    setStep('photo');
  }

  function selectProduct(product: Product) {
    setSelectedProduct(product);
    setSelectedSize(product.sizes[0] || '');
    const rawColors = product.colors[0] || '';
    setSelectedColor(rawColors.split(',')[0]?.trim() || '');
    setResult(null);
    setError(null);
    setStep('result');
  }

  function changeProduct() {
    setSelectedProduct(null);
    setResult(null);
    setStep('product');
  }

  async function generateTryOn(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadedImage || !selectedProduct) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const base64Data = uploadedImage.split(',')[1];
      if (!base64Data) throw new Error('Invalid image data. Please try uploading again.');

      const productImage = selectedProduct.images[0] || undefined;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-stylist`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          mode: 'tryon',
          imageBase64: base64Data,
          imageMime,
          garment: selectedProduct.name,
          color: selectedColor || 'default',
          productImage,
          productName: selectedProduct.name,
          productPrice: selectedProduct.price,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Request failed. Please try again.');
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data as TryOnResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to analyze image. Please try again.';
      setError(msg === 'The operation was aborted.' ? 'The request took too long. Please try again.' : msg);
    }
    setLoading(false);
  }

  const steps = [
    { id: 'photo' as Step, label: 'Your Photo', done: !!uploadedImage },
    { id: 'product' as Step, label: 'Select Garment', done: !!selectedProduct },
    { id: 'result' as Step, label: 'Try-On Result', done: !!result },
  ];

  const goToStep = useCallback((s: Step) => {
    if (s === 'photo') setStep('photo');
    else if (s === 'product' && uploadedImage) setStep('product');
    else if (s === 'result' && uploadedImage && selectedProduct) setStep('result');
  }, [uploadedImage, selectedProduct]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-4 py-3 flex items-center gap-2">
        <button onClick={() => navigate('/')} className="text-zinc-400">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">Virtual Try-On</h1>
      </div>

      {/* Step Indicator */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => goToStep(s.id)}
                className={classNames(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition',
                  step === s.id ? 'bg-amber-500 text-black' :
                  s.done ? 'bg-amber-500/20 text-amber-400' :
                  'bg-zinc-900 text-zinc-500'
                )}
              >
                {s.done && step !== s.id ? <Check size={12} /> : <span>{i + 1}</span>}
                {s.label}
              </button>
              {i < steps.length - 1 && <div className="h-px flex-1 bg-zinc-800" />}
            </div>
          ))}
        </div>
      </div>

      {/* Permission Dialog */}
      {permission === 'asking' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-8">
          <div className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center">
                <ShieldCheck size={28} className="text-amber-400" />
              </div>
              <h2 className="text-base font-bold text-white mb-2">Photo Access</h2>
              <p className="text-sm text-zinc-400 mb-6">
                DressIQ AI needs access to your photo library to upload your photo for the virtual try-on. Your photo is only used for AI styling analysis and is not stored.
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={handleAllow} className="w-full">Allow Access</Button>
                <Button variant="secondary" onClick={handleDeny} className="w-full">Don't Allow</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Camera className="text-amber-400" size={24} />
          </div>
          <div>
            <p className="font-bold text-white">See Before You Buy</p>
            <p className="text-xs text-zinc-500">Upload your photo, pick a garment, and get an AI try-on analysis</p>
          </div>
        </div>

        {/* STEP 1: Photo Upload */}
        {step === 'photo' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              {uploadedImage ? (
                <div className="relative">
                  <img src={uploadedImage} alt="Your photo" className="w-full rounded-xl max-h-80 object-contain" />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70 flex items-center justify-center"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>
              ) : permission === 'denied' ? (
                <div className="w-full border-2 border-dashed border-red-500/40 rounded-xl py-10 flex flex-col items-center gap-3 px-4 text-center">
                  <ShieldCheck size={32} className="text-red-400" />
                  <p className="text-sm font-medium text-red-400">Photo Access Denied</p>
                  <p className="text-xs text-zinc-500">
                    You chose not to allow photo access. Tap below to allow access and upload your photo.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={requestPhotoAccess}>
                    Allow Access
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={requestPhotoAccess}
                  className="w-full border-2 border-dashed border-zinc-700 rounded-xl py-12 flex flex-col items-center gap-2 hover:border-amber-500 transition"
                >
                  <Upload size={32} className="text-zinc-600" />
                  <p className="text-sm text-zinc-400">Upload your photo</p>
                  <p className="text-xs text-zinc-600">JPG, PNG up to 5MB</p>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
            </div>

            {uploadedImage && (
              <Button onClick={() => setStep('product')} className="w-full" size="lg">
                Continue to Select Garment
              </Button>
            )}
          </div>
        )}

        {/* STEP 2: Product Selection */}
        {step === 'product' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
              <div className="flex items-center gap-2">
                <img src={uploadedImage!} alt="Your photo" className="h-12 w-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="text-xs text-zinc-500">Your photo</p>
                  <button onClick={clearPhoto} className="text-xs text-amber-400 font-medium">Change photo</button>
                </div>
              </div>
            </div>

            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none transition"
              />
            </div>

            {productsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={24} className="animate-spin text-amber-400" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
                <ShoppingBag size={32} className="text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">No products found. Try a different search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-amber-500 transition text-left"
                  >
                    {product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-zinc-800 flex items-center justify-center">
                        <ShoppingBag size={24} className="text-zinc-600" />
                      </div>
                    )}
                    <div className="p-2.5">
                      <p className="text-xs font-medium text-white truncate">{product.name}</p>
                      <p className="text-xs text-amber-400 font-bold mt-0.5">{formatPrice(product.price, settings.currency_symbol)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <Button variant="ghost" onClick={() => setStep('photo')} className="w-full">
              Back to Photo
            </Button>
          </div>
        )}

        {/* STEP 3: Try-On Generation */}
        {step === 'result' && selectedProduct && (
          <form onSubmit={generateTryOn} className="space-y-4">
            {/* User photo + Product preview side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">Your Photo</p>
                <div className="relative">
                  <img src={uploadedImage!} alt="Your photo" className="w-full rounded-lg max-h-48 object-contain" />
                  <button
                    type="button"
                    onClick={() => setStep('photo')}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              </div>
              <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">Selected Garment</p>
                <div className="relative">
                  {selectedProduct.images[0] ? (
                    <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-full rounded-lg max-h-48 object-contain" />
                  ) : (
                    <div className="w-full h-48 bg-zinc-800 rounded-lg flex items-center justify-center">
                      <ShoppingBag size={24} className="text-zinc-600" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={changeProduct}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product details */}
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedProduct.name}</h3>
                  <p className="text-lg font-bold text-amber-400 mt-1">{formatPrice(selectedProduct.price, settings.currency_symbol)}</p>
                </div>
                <button type="button" onClick={changeProduct} className="text-xs text-amber-400 font-medium">
                  Change
                </button>
              </div>

              {/* Size selection */}
              {selectedProduct.sizes.length > 0 && selectedProduct.sizes[0] && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Select Size</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.sizes[0].split(',').map((s) => {
                      const size = s.trim();
                      if (!size) return null;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={classNames(
                            'px-4 py-2 rounded-lg text-sm font-medium transition',
                            selectedSize === size ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color selection */}
              {selectedProduct.colors.length > 0 && selectedProduct.colors[0] && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Select Color</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.colors[0].split(',').map((c, idx) => {
                      const color = c.trim().replace(/\.$/, '');
                      if (!color) return null;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={classNames(
                            'px-3 py-2 rounded-lg text-sm font-medium transition',
                            selectedColor === color ? 'bg-amber-500/20 border border-amber-500 text-white' : 'bg-zinc-800 border border-transparent text-zinc-400'
                          )}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Generate button */}
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? (
                <><Loader2 size={18} className="animate-spin mr-2" />Generating Try-On...</>
              ) : (
                <><Sparkles size={18} className="mr-2" />Generate Try-On</>
              )}
            </Button>

            <Button variant="ghost" type="button" onClick={() => setStep('product')} className="w-full">
              Back to Products
            </Button>
          </form>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3 text-center">{error}</p>
            {step === 'result' && selectedProduct && (
              <Button variant="outline" onClick={() => generateTryOn({ preventDefault: () => {} } as React.FormEvent)} disabled={loading} className="w-full" size="lg">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Try Again'}
              </Button>
            )}
          </div>
        )}

        {/* Result */}
        {result && step === 'result' && (
          <div className="mt-6 space-y-4">
            <div className="bg-gradient-to-br from-amber-500/20 to-transparent rounded-2xl p-5 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={20} className="text-amber-400" />
                <span className="text-sm text-amber-400 font-medium">AI Try-On Analysis</span>
              </div>
              <p className="text-sm text-zinc-300">{result.description}</p>
            </div>

            {result.fitScore && (
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <h3 className="text-sm font-bold text-white mb-2">Fit Assessment</h3>
                <p className="text-sm text-amber-400 font-semibold">{result.fitScore}</p>
                {selectedSize && <p className="text-xs text-zinc-500 mt-1">Based on selected size: {selectedSize}</p>}
              </div>
            )}

            {result.colorAnalysis && (
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <h3 className="text-sm font-bold text-white mb-2">Color Compatibility</h3>
                <p className="text-sm text-zinc-400">{result.colorAnalysis}</p>
              </div>
            )}

            {result.recommendations && (
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <h3 className="text-sm font-bold text-white mb-2">Style Recommendations</h3>
                <p className="text-sm text-zinc-400">{result.recommendations}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => { setResult(null); }}
                className="flex-1"
                size="lg"
              >
                Regenerate
              </Button>
              <Button
                onClick={() => navigate(`/product/${selectedProduct?.slug}`)}
                className="flex-1"
                size="lg"
              >
                View Product
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
