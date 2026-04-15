import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '@/types/product';
import { CatalogToolbar } from '../components/CatalogToolbar';
import { CatalogGrid } from '../components/CatalogGrid';
import { OrderSummaryBar } from '../components/OrderSummaryBar';
import { OrderDraftBanner } from '../components/OrderDraftBanner';
import { useCartStore } from '@/store/cartStore';
import { useOrderDraftStore } from '@/store/orderDraftStore';
import { formatPrice } from '@/lib/formatters';
import apiClient from '@/lib/apiClient';

/**
 * CatalogPage — Página orquestadora del catálogo mayorista.
 *
 * Responsabilidad única: conectar estado local de búsqueda con los
 * componentes de presentación (Toolbar, Grid, SummaryBar).
 *
 * Soporta dos contextos:
 *   1. Cliente navegando su propio catálogo (/portal/catalogo)
 *   2. Vendedor armando un pedido para un cliente (/ventas/pedido/:clientId)
 *
 * La detección del contexto es automática vía `orderDraftStore`.
 */
export function CatalogPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [_isLoading, setIsLoading] = useState(true);

    const { totalUnits, totalPrice, items } = useCartStore();
    const draftIsActive = useOrderDraftStore((s) => s.isActive);
    const draftClientId = useOrderDraftStore((s) => s.clientId);

    useEffect(() => {
        const handler = setTimeout(() => {
            setIsLoading(true);
            const params: any = {};
            if (searchTerm.trim()) params.search = searchTerm;
            
            apiClient.get('/products', { params })
                .then(res => {
                    const fetchedProducts = res.data
                        .filter((p: any) => p.isActive !== false)
                        .map((p: any) => ({
                            ...p,
                            image: p.image || p.image_url || p.imageUrl || undefined,
                        }));
                    setProducts(fetchedProducts);
                })
                .catch(err => console.error("Error fetching products:", err))
                .finally(() => setIsLoading(false));
        }, 300);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    const navigate = useNavigate();

    const handleProductAction = (product: Product) => {
        if (draftIsActive && draftClientId) {
            // Seller armando pedido → detalle dentro del flujo de pedido
            navigate(`/ventas/pedido/${draftClientId}/${product.id}`);
        } else {
            // Cliente normal → detalle del catálogo
            navigate(`/portal/catalogo/${product.id}`);
        }
    };

    const handleCheckout = () => {
        if (draftIsActive) {
            navigate('/ventas/checkout');
        } else {
            navigate('/portal/checkout');
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Banner contextual: solo se muestra si el seller tiene un draft activo */}
            <OrderDraftBanner />

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto pb-6 px-6 lg:px-8 pt-6">
                <CatalogToolbar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                />

                <CatalogGrid
                    products={products}
                    onProductAction={handleProductAction}
                />
            </div>

            {/* Footer de resumen (sticky) */}
            {totalUnits > 0 && (
                <OrderSummaryBar
                    totalItems={items.length}
                    totalUnits={`${totalUnits} un.`}
                    subtotal={formatPrice(totalPrice)}
                    onAction={handleCheckout}
                    actionLabel={draftIsActive ? 'CONFIRMAR PEDIDO' : 'REVISAR PEDIDO'}
                />
            )}
        </div>
    );
}