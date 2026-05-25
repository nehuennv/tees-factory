import apiClient from './apiClient';
import type { OrderStatus, DispatchType, PaymentStatus, OrderExtra, Order } from '@/types/order';

export interface GetOrdersParams {
    status?: OrderStatus;
    deliveredWithinDays?: number;
    dispatchType?: DispatchType;
    paymentStatus?: PaymentStatus;
    minMonto?: number;
}

export function getOrders(params?: GetOrdersParams): Promise<Order[]> {
    return apiClient.get('/orders', { params }).then(r => r.data);
}

export function getOrder(id: string): Promise<Order> {
    return apiClient.get(`/orders/${id}`).then(r => r.data);
}

export function patchOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return apiClient.patch(`/orders/${id}/status`, { status }).then(r => r.data);
}

export interface PatchOrderPayload {
    observations?: string;
    deliveryDeadline?: string | null;
    dispatchType?: DispatchType | null;
    paymentStatus?: PaymentStatus;
    shippingAddress?: string | null;
    extras?: OrderExtra[];
    taxRate?: number;
    discountPercentage?: number;
}

export function patchOrder(id: string, payload: PatchOrderPayload): Promise<Order> {
    return apiClient.patch(`/orders/${id}`, payload).then(r => r.data);
}

export interface PutOrderItemsPayload {
    items: { variantId: string; quantity: number }[];
}

export interface PutOrderItemsResult {
    id: string;
    itemCount: number;
    subtotal: number;
    taxAmount: number;
    extrasTotal: number;
    totalAmount: number;
    delta: number;
}

export function putOrderItems(id: string, payload: PutOrderItemsPayload): Promise<PutOrderItemsResult> {
    return apiClient.put(`/orders/${id}/items`, payload).then(r => r.data);
}

export function cancelOrder(id: string, reason: string): Promise<void> {
    return apiClient.post(`/orders/${id}/cancel`, { reason }).then(r => r.data);
}

/** Replicates pricingService.js formula — use for real-time preview */
export function calcPricing(
    subtotal: number,
    extras: OrderExtra[],
    discountPercentage: number,
    taxRate: number
) {
    const extrasTotal = extras.reduce((s, e) => s + (e.amount || 0), 0);
    const base = subtotal + extrasTotal;
    const discountClamped = Math.min(100, Math.max(0, discountPercentage));
    const discountAmount = base * (discountClamped / 100);
    const baseImponible = base - discountAmount;
    const taxAmount = baseImponible * (taxRate / 100);
    const totalAmount = baseImponible + taxAmount;
    return {
        extrasTotal: round2(extrasTotal),
        discountAmount: round2(discountAmount),
        taxAmount: round2(taxAmount),
        totalAmount: round2(totalAmount),
    };
}

function round2(n: number) {
    return Math.round(n * 100) / 100;
}
