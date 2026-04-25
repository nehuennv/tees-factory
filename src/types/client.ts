export interface Client {
    id: string;
    name: string;
    cuit: string;
    email: string;
    phone: string;
    address: string;
    balance: number;
    sellerId: string;
    isActive: boolean;
    notes?: string;
    gender?: string;
    location?: string;
}
