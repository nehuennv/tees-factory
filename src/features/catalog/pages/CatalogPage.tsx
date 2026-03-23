import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import type { Product } from '@/types/product';
import { CatalogToolbar } from '../components/CatalogToolbar';
import { CatalogGrid } from '../components/CatalogGrid';
import { OrderSummaryBar } from '../components/OrderSummaryBar';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/formatters';

/**
 * CatalogPage — Página orquestadora del catálogo mayorista.
 *
 * Responsabilidad única: conectar estado local de búsqueda con los
 * componentes de presentación (Toolbar, Grid, SummaryBar).
 * Toda la lógica visual vive en los sub-componentes extraídos.
 */
export function CatalogPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const { totalUnits, totalPrice, items } = useCartStore();

    const filteredProducts: Product[] = MOCK_PRODUCTS.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const navigate = useNavigate();

    const handleProductAction = (product: Product) => {
        navigate(`/portal/catalogo/${product.id}`);
    };

    const handleCheckout = () => {
        navigate('/portal/checkout');
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto pb-6 px-6 lg:px-8 pt-6">
                <CatalogToolbar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                />

                <CatalogGrid
                    products={filteredProducts}
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
                />
            )}
        </div>
    );
}