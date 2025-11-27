import { create } from 'zustand';

export interface CartItem {
    id: string;
    symbol: string;
    strike: number;
    type: 'CE' | 'PE';
    action: 'BUY' | 'SELL';
    quantity: number;
    ltp: number;
    exchange: string;
}

interface CartStore {
    items: CartItem[];
    addToCart: (item: Omit<CartItem, 'id'>) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    getTotalValue: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
    items: [],

    addToCart: (item) => {
        const id = `${item.symbol}-${item.strike}-${item.type}-${item.action}-${Date.now()}`;
        set((state) => ({
            items: [...state.items, { ...item, id }],
        }));
    },

    removeFromCart: (id) => {
        set((state) => ({
            items: state.items.filter((item) => item.id !== id),
        }));
    },

    updateQuantity: (id, quantity) => {
        set((state) => ({
            items: state.items.map((item) =>
                item.id === id ? { ...item, quantity } : item
            ),
        }));
    },

    clearCart: () => {
        set({ items: [] });
    },

    getTotalValue: () => {
        const { items } = get();
        return items.reduce((total, item) => {
            const value = item.ltp * item.quantity;
            return item.action === 'BUY' ? total + value : total - value;
        }, 0);
    },
}));
