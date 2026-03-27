export interface PaymentReport {
    id: string;
    orderId: string;
    clientName: string;
    method: 'Transferencia' | 'Cheque' | 'Depósito' | 'MercadoPago';
    date: string;
    transactionId: string;
    observation?: string;
    receiptUrl?: string;
    approvedAmount?: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const MOCK_PAYMENTS: PaymentReport[] = [
    // PENDING (Aún no conciliados, no tienen approvedAmount)
    {
        id: 'PAY-001',
        orderId: '#ORD-1042',
        clientName: 'Distribuidora Norte',
        method: 'Transferencia',
        date: '2026-03-24T10:00:00Z',
        transactionId: 'TR-89312048X',
        observation: 'Pago de la factura A-0001-00045231',
        receiptUrl: undefined,
        status: 'PENDING'
    },
    {
        id: 'PAY-002',
        orderId: '#ORD-1045',
        clientName: 'Boutique Sur',
        method: 'MercadoPago',
        date: '2026-03-24T11:30:00Z',
        transactionId: 'MP-988319201',
        receiptUrl: undefined, // Sin comprobante adjunto
        status: 'PENDING'
    },
    {
        id: 'PAY-003',
        orderId: '#ORD-1046',
        clientName: 'Tiendas Centro',
        method: 'Cheque',
        date: '2026-03-23T15:45:00Z',
        transactionId: 'CHQ-581023',
        observation: 'Se entregará en mano',
        receiptUrl: undefined,
        status: 'PENDING'
    },
    {
        id: 'PAY-004',
        orderId: '#ORD-1048',
        clientName: 'Indumentaria VIP',
        method: 'Transferencia',
        date: '2026-03-23T16:20:00Z',
        transactionId: 'TR-10023491',
        receiptUrl: undefined,
        status: 'PENDING'
    },
    {
        id: 'PAY-005',
        orderId: '#ORD-1050',
        clientName: 'Local Random',
        method: 'Depósito',
        date: '2026-03-23T09:15:00Z',
        transactionId: 'DEP-891238',
        receiptUrl: undefined,
        status: 'PENDING'
    },

    // APPROVED (Conciliados, tienen approvedAmount definido)
    {
        id: 'PAY-006',
        orderId: '#ORD-1020',
        clientName: 'Grandes Almacenes',
        method: 'Transferencia',
        date: '2026-03-20T11:00:00Z',
        transactionId: 'TR-5029192',
        receiptUrl: undefined,
        approvedAmount: 550000,
        status: 'APPROVED'
    },
    {
        id: 'PAY-007',
        orderId: '#ORD-1022',
        clientName: 'Moda Actual',
        method: 'Cheque',
        date: '2026-03-20T12:15:00Z',
        transactionId: 'CHQ-882190',
        receiptUrl: undefined,
        approvedAmount: 110000,
        status: 'APPROVED'
    },
    {
        id: 'PAY-008',
        orderId: '#ORD-1025',
        clientName: 'Distribuidora Norte',
        method: 'Transferencia',
        date: '2026-03-19T09:45:00Z',
        transactionId: 'TR-1919293',
        receiptUrl: undefined,
        approvedAmount: 200000,
        status: 'APPROVED'
    },
    {
        id: 'PAY-009',
        orderId: '#ORD-1030',
        clientName: 'Ropa x Mayor',
        method: 'Depósito',
        date: '2026-03-18T14:20:00Z',
        transactionId: 'DEP-510001',
        receiptUrl: undefined,
        approvedAmount: 75000,
        status: 'APPROVED'
    },

    // REJECTED (Rechazados porque no se encontró la plata o el número era falso, etc.)
    {
        id: 'PAY-010',
        orderId: '#ORD-1015',
        clientName: 'Tiendas Centro',
        method: 'Transferencia',
        date: '2026-03-15T10:00:00Z',
        transactionId: 'TR-FALSO-001',
        receiptUrl: undefined,
        status: 'REJECTED'
    },
    {
        id: 'PAY-011',
        orderId: '#ORD-1018',
        clientName: 'Comercial Oeste',
        method: 'Cheque',
        date: '2026-03-16T11:20:00Z',
        transactionId: 'CHQ-SINFONDOS',
        receiptUrl: undefined,
        status: 'REJECTED'
    },
];
