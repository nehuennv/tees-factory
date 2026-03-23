import { create } from 'zustand';

export interface CartItem {
    id: string; // productId-quality-color-size
    productId: string;
    productName: string;
    quality: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

interface CartState {
    items: CartItem[];
    totalUnits: number;
    totalPrice: number;
    addItems: (newItems: CartItem[]) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
    items: [],
    totalUnits: 0,
    totalPrice: 0,
    addItems: (newItems) => {
        set((state) => {
            const updatedItems = [...state.items];

            newItems.forEach(newItem => {
                const existingIndex = updatedItems.findIndex(item => item.id === newItem.id);
                if (existingIndex >= 0) {
                    updatedItems[existingIndex].quantity += newItem.quantity;
                    updatedItems[existingIndex].subtotal += newItem.subtotal;
                } else {
                    updatedItems.push(newItem);
                }
            });

            const totalUnits = updatedItems.reduce((acc, item) => acc + item.quantity, 0);
            const totalPrice = updatedItems.reduce((acc, item) => acc + item.subtotal, 0);

            return { items: updatedItems, totalUnits, totalPrice };
        });
    },
    removeItem: (id) => {
        set((state) => {
            const updatedItems = state.items.filter(item => item.id !== id);
            const totalUnits = updatedItems.reduce((acc, item) => acc + item.quantity, 0);
            const totalPrice = updatedItems.reduce((acc, item) => acc + item.subtotal, 0);

            return { items: updatedItems, totalUnits, totalPrice };
        });
    },
    clearCart: () => {
        set({ items: [], totalUnits: 0, totalPrice: 0 });
    }
}));
