import { useState } from 'react';
import { Shirt, ChevronLeft, Sparkles, Loader2, IndianRupee } from 'lucide-react';
import { navigate } from '@/lib/router';
import { Button, Input } from '@/components/ui';
import { classNames } from '@/lib/utils';

interface OutfitResult {
  outfitName: string;
  description: string;
  items: { category: string; name: string; estimatedPrice: string }[];
  totalEstimate: string;
  tips: string;
}

const OCCASIONS = ['Casual', 'Office', 'Party', 'Wedding', 'Date', 'Festival', 'Travel', 'Interview'];
const STYLES = ['Traditional', 'Western', 'Indo-Western', 'Streetwear', 'Formal', 'Bohemian'];

export function AIOutfitPage() {
  const [form, setForm] = useState({ budget: '', occasion: 'Casual', style: 'Traditional', season: 'summer', preferences: '' });
  const [result, setResult] = useState<OutfitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getOutfit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
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
          mode: 'outfit',
          budget: form.budget,
          occasion: form.occasion,
          style: form.style,
          season: form.season,
          preferences: form.preferences,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Request failed');
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data as OutfitResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to generate outfit. Please try again.';
      setError(msg === 'The operation was aborted.' ? 'The request took too long. Please try again.' : msg);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-4 py-3 flex items-center gap-2">
        <button onClick={() => navigate('/')} className="text-zinc-400">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">AI Outfit Planner</h1>
      </div>

      <div className="px-4 py-4 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Shirt className="text-amber-400" size={24} />
          </div>
          <div>
            <p className="font-bold text-white">Plan Your Perfect Outfit</p>
            <p className="text-xs text-zinc-500">Tell us your budget and occasion</p>
          </div>
        </div>

        <form onSubmit={getOutfit} className="space-y-4">
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Budget (₹)</label>
              <div className="relative">
                <IndianRupee size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="number"
                  required
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  placeholder="5000"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 pl-10 pr-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Occasion</label>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((occ) => (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => setForm({ ...form, occasion: occ })}
                    className={classNames(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition',
                      form.occasion === occ ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                    )}
                  >
                    {occ}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Style Preference</label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((stl) => (
                  <button
                    key={stl}
                    type="button"
                    onClick={() => setForm({ ...form, style: stl })}
                    className={classNames(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition',
                      form.style === stl ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                    )}
                  >
                    {stl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Season</label>
              <div className="grid grid-cols-4 gap-2">
                {['summer', 'winter', 'monsoon', 'spring'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, season: s })}
                    className={classNames(
                      'px-3 py-2 rounded-lg text-sm font-medium capitalize transition',
                      form.season === s ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Color / Other Preferences (optional)</label>
              <input
                value={form.preferences}
                onChange={(e) => setForm({ ...form, preferences: e.target.value })}
                placeholder="e.g. prefer dark colors, cotton fabric"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none transition"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Generate Outfit'}
          </Button>
        </form>

        {error && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3 text-center">{error}</p>
            <Button variant="outline" onClick={() => getOutfit({ preventDefault: () => {} } as React.FormEvent)} className="w-full" size="lg">
              Try Again
            </Button>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            <div className="bg-gradient-to-br from-amber-500/20 to-transparent rounded-2xl p-5 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={20} className="text-amber-400" />
                <span className="text-sm text-amber-400 font-medium">AI Outfit Plan</span>
              </div>
              <p className="text-2xl font-bold text-white mb-2">{result.outfitName}</p>
              <p className="text-sm text-zinc-400">{result.description}</p>
            </div>

            {result.items && result.items.length > 0 && (
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <h3 className="text-sm font-bold text-white mb-3">Outfit Items</h3>
                <div className="space-y-2">
                  {result.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
                      <div>
                        <p className="text-xs text-zinc-500">{item.category}</p>
                        <p className="text-sm font-medium text-white">{item.name}</p>
                      </div>
                      <span className="text-sm font-bold text-amber-400">{item.estimatedPrice}</span>
                    </div>
                  ))}
                </div>
                {result.totalEstimate && (
                  <div className="border-t border-zinc-800 mt-3 pt-3 flex justify-between">
                    <span className="text-sm font-bold text-white">Total Estimate</span>
                    <span className="text-sm font-bold text-amber-400">{result.totalEstimate}</span>
                  </div>
                )}
              </div>
            )}

            {result.tips && (
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <h3 className="text-sm font-bold text-white mb-2">Styling Tips</h3>
                <p className="text-sm text-zinc-400">{result.tips}</p>
              </div>
            )}

            <Button onClick={() => navigate('/shop')} className="w-full" size="lg">
              Find These Items
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
