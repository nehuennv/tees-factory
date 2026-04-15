import { useState, useEffect, useMemo } from "react";
import type { Product } from "@/types/product";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit2, ChevronDown, MoreHorizontal, Trash2, Package, Eye, EyeOff } from "lucide-react";
import { ProductImage } from "@/components/shared/ProductImage";
import { toast } from "sonner";
import { ProductStockDrawer } from "../components/ProductStockDrawer";
import { Modal } from "@/components/shared/Modal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatPrice } from "@/lib/formatters";
import { CreateProductModal } from "../components/CreateProductModal";

interface AdminProduct extends Product {
    isActive: boolean;
}

export function CatalogManagementPage() {
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [_isLoadingProducts, setIsLoadingProducts] = useState(true);

    useEffect(() => {
        setIsLoadingProducts(true);
        apiClient.get('/products')
            .then(res => {
                // Normalizar image_url → image para compatibilidad con el tipo Product
                const mapped = res.data.map((p: any) => ({
                    ...p,
                    image: p.image || p.image_url || p.imageUrl || undefined,
                }));
                setProducts(mapped);
            })
            .catch(err => {
                console.error(err);
            })
            .finally(() => setIsLoadingProducts(false));
    }, []);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);

    const handleRequestDelete = (productId: string) => {
        setProductToDelete(productId);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        try {
            await apiClient.delete(`/products/${productToDelete}`);
            setProducts(prev => prev.filter(p => p.id !== productToDelete));
            toast.success("Producto eliminado");
        } catch {
            toast.error("Error al eliminar el producto");
        } finally {
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
        }
    };

    const filteredProducts = useMemo(() => {
        let result = products;

        if (categoryFilter !== "ALL") {
            result = result.filter(p => p.category === categoryFilter);
        }

        if (statusFilter !== "ALL") {
            const isActive = statusFilter === 'ACTIVE';
            result = result.filter(p => p.isActive === isActive);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.id.toLowerCase().includes(query)
            );
        }

        return result;
    }, [products, searchQuery, categoryFilter, statusFilter]);

    const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;

        // Optimistic UI updates
        setProducts(prev =>
            prev.map(p => p.id === productId ? { ...p, isActive: newStatus } : p)
        );

        try {
            await apiClient.patch(`/products/${productId}/status`, { isActive: newStatus });
            toast.success(newStatus ? "Producto Activado" : "Producto Desactivado", {
                description: `El estado del producto ha sido actualizado en la base de datos.`,
            });
        } catch (error) {
            // Revert optimistic update on failure
            setProducts(prev =>
                prev.map(p => p.id === productId ? { ...p, isActive: currentStatus } : p)
            );
            toast.error("Error", {
                description: "No se pudo actualizar el estado.",
            });
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-zinc-50 p-6">
            <div className="w-full mx-auto space-y-6 pb-20">
                {/* Toolbar Estandarizada */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all placeholder:text-zinc-400 text-zinc-800 shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="rounded-xl h-10 px-4 text-zinc-600 border-zinc-200 bg-white hover:bg-zinc-50 whitespace-nowrap shrink-0">
                                    {categoryFilter === 'ALL' ? 'Categoría' : categoryFilter} <ChevronDown className="w-3 h-3 ml-2 text-zinc-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 bg-white border border-zinc-200 rounded-xl shadow-lg p-1">
                                <DropdownMenuItem onClick={() => setCategoryFilter('ALL')} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 py-2 px-3 outline-none">Todas</DropdownMenuItem>
                                {Array.from(new Set(products.map(p => p.category))).map(cat => (
                                    <DropdownMenuItem key={cat} onClick={() => setCategoryFilter(cat)} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 py-2 px-3 outline-none">{cat}</DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="rounded-xl h-10 px-4 text-zinc-600 border-zinc-200 bg-white hover:bg-zinc-50 whitespace-nowrap shrink-0">
                                    {statusFilter === 'ALL' ? 'Estado' : statusFilter === 'ACTIVE' ? 'Activos' : 'Pausados'} <ChevronDown className="w-3 h-3 ml-2 text-zinc-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 bg-white border border-zinc-200 rounded-xl shadow-lg p-1">
                                <DropdownMenuItem onClick={() => setStatusFilter('ALL')} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 py-2 px-3 outline-none">Todos</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('ACTIVE')} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 py-2 px-3 outline-none">Activos</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('PAUSED')} className="cursor-pointer rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 py-2 px-3 outline-none">Pausados</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="w-px h-6 bg-zinc-200 mx-1 hidden sm:block shrink-0"></div>
                        <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-xl h-10 px-4 bg-zinc-900 text-white hover:bg-zinc-800 whitespace-nowrap shrink-0 shadow-sm font-semibold ml-2">
                            + Nuevo Producto
                        </Button>
                    </div>
                </div>

                {/* Catalog Table */}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Precio Base</TableHead>
                            <TableHead>Stock Total</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="w-[80px] text-right pr-6">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product) => (
                            <TableRow key={product.id} className="hover:bg-zinc-50/50 transition-colors group">
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200/50 overflow-hidden flex-shrink-0">
                                            <ProductImage
                                                src={product.image}
                                                alt={product.name}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-zinc-900">{product.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-zinc-500 text-xs font-medium bg-zinc-100 px-2 py-0.5 rounded-full">{product.category}</span>
                                                <span className="text-zinc-400 text-xs">{product.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-medium text-zinc-900">{formatPrice(product.basePrice)}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-zinc-500">
                                        <Package className="w-4 h-4 text-zinc-400" />
                                        <span>{product.totalStock} uds.</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {product.isActive ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200 uppercase tracking-wider">
                                            Pausado
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right pr-4">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-100 transition-colors">
                                                <span className="sr-only">Abrir menú</span>
                                                <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 bg-white rounded-xl border-zinc-200 shadow-lg">
                                            <DropdownMenuItem
                                                onClick={() => setSelectedProduct(product)}
                                                className="cursor-pointer font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 focus:bg-zinc-50"
                                            >
                                                <Edit2 className="mr-2 h-4 w-4" />
                                                <span>Editar / Gestionar Matriz</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-zinc-100" />
                                            <DropdownMenuItem
                                                onClick={() => handleToggleStatus(product.id, product.isActive)}
                                                className="cursor-pointer font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 focus:bg-zinc-50"
                                            >
                                                {product.isActive ? (
                                                    <>
                                                        <EyeOff className="mr-2 h-4 w-4" />
                                                        <span>Pausar Producto</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        <span>Publicar Producto</span>
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleRequestDelete(product.id)}
                                                className="cursor-pointer font-medium text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Eliminar Producto</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}

                        {filteredProducts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-sm text-zinc-500">
                                    No se encontraron productos coincidentes.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <ProductStockDrawer
                isOpen={!!selectedProduct}
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onProductSaved={(updatedProduct) => {
                    setProducts(prev =>
                        prev.map(p => p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p)
                    );
                }}
            />
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setProductToDelete(null); }}
                title="Eliminar Producto"
                description="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
                maxWidth="sm"
                hideCloseButton
                primaryAction={{
                    label: 'Sí, eliminar',
                    variant: 'destructive',
                    onClick: handleConfirmDelete,
                }}
                secondaryAction={{
                    label: 'Cancelar',
                    onClick: () => { setIsDeleteModalOpen(false); setProductToDelete(null); },
                }}
            />
            <CreateProductModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onProductCreated={(newProduct) => {
                    setProducts(prev => [...prev, {
                        ...newProduct,
                        isActive: newProduct.isActive ?? true,
                        basePrice: newProduct.basePrice ?? 0,
                        totalStock: newProduct.totalStock ?? 0,
                    }]);
                }}
            />
        </div>
    );
}
