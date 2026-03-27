export interface Transaction {
    id: string;
    date: string; // ISO string
    description: string;
    type: 'ORDER' | 'PAYMENT';
    status: 'COMPLETED' | 'PENDING' | 'REJECTED';
    amount: number;
}

export const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 'tx_1', date: '2024-03-01T10:00:00Z', description: 'Pedido #0045', type: 'ORDER', status: 'COMPLETED', amount: 500000 },
    { id: 'tx_2', date: '2024-03-05T14:30:00Z', description: 'Transferencia Banco Galicia', type: 'PAYMENT', status: 'COMPLETED', amount: 250000 },
    { id: 'tx_3', date: '2024-03-10T09:15:00Z', description: 'Pedido #0052', type: 'ORDER', status: 'COMPLETED', amount: 350000 },
    { id: 'tx_4', date: '2024-03-12T11:45:00Z', description: 'Depósito Santander', type: 'PAYMENT', status: 'REJECTED', amount: 150000 },
    { id: 'tx_5', date: '2024-03-15T16:20:00Z', description: 'Transferencia MercadoPago', type: 'PAYMENT', status: 'PENDING', amount: 150000 },
    { id: 'tx_6', date: '2024-03-18T08:00:00Z', description: 'Pedido #0060', type: 'ORDER', status: 'COMPLETED', amount: 150000 },
];

export const MOCK_CURRENT_BALANCE = -450000;
