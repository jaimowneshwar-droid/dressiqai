import { useState } from 'react';
import { Ruler, ChevronLeft, Sparkles, Loader2, Check } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { navigate } from '@/lib/router';
import { Button, Input } from '@/components/ui';
import { classNames } from '@/lib/utils';

interface SizeResult {
  recommendedSize: string;
  confidence: string;
  notes: string;
  measurements: { chest: string; waist: string; hip: string; shoulder: string };
}

export function AISizePage() {
  const { settings } = useSettings();
  const [form, setForm] = useState({ height: '', weight: '', age: '', gender: 'male', bodyType: 'regular' });
  const [result, setResult] = useState<SizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getRecommendation(e: React.FormEvent) {
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
          mode: 'size',
          height: form.height,
          weight: form.weight,
          age: form.age,
          gender: form.gender,
          bodyType: form.bodyType,
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
      setResult(data as SizeResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to get size recommendation. Please try again.';
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
        <h1 className="text-lg font-bold">AI Size Finder</h1>
      </div>

      <div className="px-4 py-4 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Ruler className="text-amber-400" size={24} />
          </div>
          <div>
            <p className="font-bold text-white">Find Your Perfect Fit</p>
            <p className="text-xs text-zinc-500">Enter your measurements for AI-powered size recommendation</p>
          </div>
        </div>

        <form onSubmit={getRecommendation} className="space-y-4">
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Height (cm)"
                type="number"
                required
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                placeholder="175"
              />
              <Input
                label="Weight (kg)"
                type="number"
                required
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="70"
              />
            </div>
            <Input
              label="Age (optional)"
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              placeholder="25"
            />
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {['male', 'female'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm({ ...form, gender: g })}
                    className={classNames(
                      'px-3 py-2.5 rounded-lg text-sm font-medium capitalize transition',
                      form.gender === g ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Body Type</label>
              <div className="grid grid-cols-3 gap-2">
                {['slim', 'regular', 'athletic'].map((bt) => (
                  <button
                    key={bt}
                    type="button"
                    onClick={() => setForm({ ...form, bodyType: bt })}
                    className={classNames(
                      'px-3 py-2.5 rounded-lg text-sm font-medium capitalize transition',
                      form.bodyType === bt ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                    )}
                  >
                    {bt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Get My Size'}
          </Button>
        </form>

        {error && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3 text-center">{error}</p>
            <Button variant="outline" onClick={() => getRecommendation({ preventDefault: () => {} } as React.FormEvent)} className="w-full" size="lg">
              Try Again
            </Button>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            <div className="bg-gradient-to-br from-amber-500/20 to-transparent rounded-2xl p-5 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Check size={20} className="text-amber-400" />
                <span className="text-sm text-amber-400 font-medium">Recommended Size</span>
              </div>
              <p className="text-5xl font-bold text-white mb-2">{result.recommendedSize}</p>
              <p className="text-sm text-zinc-400">Confidence: {result.confidence}</p>
            </div>

            {result.measurements && (
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <h3 className="text-sm font-bold text-white mb-3">Estimated Measurements (inches)</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(result.measurements).map(([key, val]) => (
                    <div key={key} className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-xs text-zinc-500 capitalize">{key}</p>
                      <p className="text-lg font-bold text-amber-400">{val}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.notes && (
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <h3 className="text-sm font-bold text-white mb-2">Style Notes</h3>
                <p className="text-sm text-zinc-400">{result.notes}</p>
              </div>
            )}

            <Button onClick={() => navigate('/shop')} className="w-full" size="lg">
              Shop Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
