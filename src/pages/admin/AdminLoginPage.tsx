import { useState } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Form';
import { Spinner } from '@/components/ui/Feedback';

export function AdminLoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <Sparkles className="text-amber-400" size={28} />
          </div>
          <h1 className="text-2xl font-bold">
            <span className="text-amber-400">Dress</span>
            <span className="text-white">IQ</span>
            <span className="text-zinc-500 text-sm block mt-1">Admin Panel</span>
          </h1>
        </div>

        <form onSubmit={handleSignIn} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
            <Lock size={16} /> Secure Login
          </div>
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@dressiq.ai"
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-2.5">{error}</p>
          )}
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? <Spinner size={18} /> : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
