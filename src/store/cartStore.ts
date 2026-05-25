import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string; // productId-quality-color-size
    variantId: string; // UUID from backend for precise checkout
    productId: string;
    productName: string;
    quality: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    image?: string;
}

interface CartState {
    items: CartItem[];
    totalUnits: number;
    totalPrice: number;
    addItems: (newItems: CartItem[]) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, newQty: number) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
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
            updateQuantity: (id, newQty) => {
                set((state) => {
                    if (newQty <= 0) {
                        const updatedItems = state.items.filter(item => item.id !== id);
                        return {
                            items: updatedItems,
                            totalUnits: updatedItems.reduce((a, i) => a + i.quantity, 0),
                            totalPrice: updatedItems.reduce((a, i) => a + i.subtotal, 0),
                        };
                    }
                    const updatedItems = state.items.map(item =>
                        item.id === id
                            ? { ...item, quantity: newQty, subtotal: newQty * item.unitPrice }
                            : item
                    );
                    return {
                        items: updatedItems,
                        totalUnits: updatedItems.reduce((a, i) => a + i.quantity, 0),
                        totalPrice: updatedItems.reduce((a, i) => a + i.subtotal, 0),
                    };
                });
            },
            clearCart: () => {
                set({ items: [], totalUnits: 0, totalPrice: 0 });
            },
        }),
        {
            name: 'tees-cart',
            partialize: (state) => ({ items: state.items }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.totalUnits = state.items.reduce((a, i) => a + i.quantity, 0);
                    state.totalPrice = state.items.reduce((a, i) => a + i.subtotal, 0);
                }
            },
        }
    )
);
