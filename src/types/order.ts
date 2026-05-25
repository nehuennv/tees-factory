export type OrderStatus =
    | 'IN_REVIEW'
    | 'APPROVED'
    | 'IN_PREPARATION'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'ARCHIVED'
    | 'CANCELLED';

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING';

export type DispatchType =
    | 'PUNTO_PILAR'
    | 'CORREO'
    | 'ENCOMIENDA'
    | 'MOTOMENSAJERIA';

export interface OrderExtra {
    label: string;
    amount: number;
}

export interface OrderItem {
    id: string;
    variantId?: string;
    productName?: string;
    product_name?: string;
    quality?: string;
    quality_name?: string;
    color?: string;
    color_name?: string;
    size?: string;
    size_name?: string;
    quantity?: number;
    qty?: number;
    unitPrice?: number;
    unit_price?: number;
    rowSubtotal?: number;
    row_subtotal?: number;
    variant?: {
        product?: { name?: string; category?: string };
        color_name?: string;
        size_name?: string;
    };
}

export interface Order {
    id: string;
    orderNumber?: string | number;
    status: OrderStatus;
    clientId?: string;
    client_id?: string;
    client?: {
        id?: string;
        name?: string;
        company_name?: string;
        email?: string;
    };
    clientName?: string;
    client_name?: string;
    // Pricing
    subtotal?: number;
    extrasTotal?: number;
    extras_total?: number;
    discountPercentage?: number;
    discount_percentage?: number;
    discountAmount?: number;
    discount_amount?: number;
    taxRate?: number;
    tax_rate?: number;
    taxAmount?: number;
    tax_amount?: number;
    totalAmount?: number;
    total_amount?: number;
    extras?: OrderExtra[];
    // Metadata
    paymentStatus?: PaymentStatus;
    payment_status?: PaymentStatus;
    dispatchType?: DispatchType | null;
    dispatch_type?: DispatchType | null;
    deliveryDeadline?: string | null;
    delivery_deadline?: string | null;
    deliveredAt?: string | null;
    delivered_at?: string | null;
    cancelledAt?: string | null;
    cancelled_at?: string | null;
    cancellationReason?: string | null;
    cancellation_reason?: string | null;
    shippingAddress?: string | null;
    shipping_address?: string | null;
    observations?: string | null;
    isLockedByPayment?: boolean;
    // Items
    items?: OrderItem[];
    order_items?: OrderItem[];
    orderItems?: OrderItem[];
    // Counts
    itemCount?: number;
    item_count?: number;
    totalItems?: number;
    // Timestamps
    createdAt?: string;
    created_at?: string;
    date?: string;
}

/** Legal transition matrix */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    IN_REVIEW:      ['APPROVED'],
    APPROVED:       ['IN_PREPARATION', 'IN_REVIEW'],
    IN_PREPARATION: ['SHIPPED', 'APPROVED'],
    SHIPPED:        ['DELIVERED', 'IN_PREPARATION'],
    DELIVERED:      ['ARCHIVED', 'SHIPPED'],
    ARCHIVED:       ['DELIVERED'],
    CANCELLED:      [],
};

export const LOCKED_STATUSES: OrderStatus[] = ['SHIPPED', 'DELIVERED', 'ARCHIVED', 'CANCELLED'];

export const DISPATCH_LABELS: Record<DispatchType, string> = {
    PUNTO_PILAR:    'Punto Pilar',
    CORREO:         'Correo',
    ENCOMIENDA:     'Encomienda',
    MOTOMENSAJERIA: 'Motomensajería',
};
