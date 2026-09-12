import { createContext, useContext, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '@/types';

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, size?: string, color?: string) => void;
  removeFromCart: (productId: string, size?: string, color?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  subtotal: 0,
});

const CART_KEY = 'dressiq_cart';

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  function persist(newItems: CartItem[]) {
    setItems(newItems);
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(newItems));
    } catch { /* ignore */ }
  }

  function findIndex(list: CartItem[], productId: string, size?: string, color?: string) {
    return list.findIndex(
      (i) =>
        i.product.id === productId &&
        i.size === size &&
        i.color === color
    );
  }

  function addToCart(product: Product, quantity = 1, size?: string, color?: string) {
    const next = [...items];
    const idx = findIndex(next, product.id, size, color);
    if (idx >= 0) {
      next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
    } else {
      next.push({ product, quantity, size, color });
    }
    persist(next);
  }

  function removeFromCart(productId: string, size?: string, color?: string) {
    const idx = findIndex(items, productId, size, color);
    if (idx >= 0) {
      const next = items.filter((_, i) => i !== idx);
      persist(next);
    }
  }

  function updateQuantity(productId: string, quantity: number, size?: string, color?: string) {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    const next = [...items];
    const idx = findIndex(next, product.id, size, color);
    if (idx >= 0) {
      next[idx] = { ...next[idx], quantity };
      persist(next);
    }
  }

  function clearCart() {
    persist([]);
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
