import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { WishlistItem, Product } from '@/types';

interface WishlistContextValue {
  items: WishlistItem[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product, size?: string, color?: string) => void;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextValue>({
  items: [],
  isInWishlist: () => false,
  toggleWishlist: () => {},
  loading: true,
});

const SESSION_KEY = 'dressiq_session_id';

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `ws_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const sessionId = getSessionId();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('wishlists')
        .select('*, product:products(*)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });
      setItems((data as WishlistItem[]) ?? []);
      setLoading(false);
    })();
  }, [sessionId]);

  function isInWishlist(productId: string): boolean {
    return items.some((i) => i.product_id === productId);
  }

  async function toggleWishlist(product: Product, size?: string, color?: string) {
    const existing = items.find((i) => i.product_id === product.id);
    if (existing) {
      setItems((prev) => prev.filter((i) => i.id !== existing.id));
      await supabase.from('wishlists').delete().eq('id', existing.id);
    } else {
      const { data } = await supabase
        .from('wishlists')
        .insert({
          session_id: sessionId,
          product_id: product.id,
          size: size ?? null,
          color: color ?? null,
        })
        .select('*, product:products(*)')
        .single();
      if (data) {
        setItems((prev) => [data as WishlistItem, ...prev]);
      }
    }
  }

  return (
    <WishlistContext.Provider value={{ items, isInWishlist, toggleWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
