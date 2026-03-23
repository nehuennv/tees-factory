export interface Client {
    id: string;
    name: string;
    cuit: string;
    phone: string;
    email: string;
    address: string;
    birthDate?: string;
    gender?: string;
    notes?: string;
    balance: number; // Saldo deudor: negativo, Saldo a favor/cero: positivo
}

export const MOCK_CLIENTS: Client[] = [
    {
        id: "1",
        name: "Distribuidora Los Andes S.A.",
        cuit: "30-71234567-8",
        phone: "+5491144556677",
        email: "compras@losandes.com.ar",
        address: "Av. San Martín 1500, Mendoza",
        birthDate: "1980-05-12",
        gender: "Empresa",
        notes: "Cliente vip. Entregas solo por la mañana.",
        balance: -150000,
    },
    {
        id: "2",
        name: "Tienda de Ropa 'La Moda'",
        cuit: "27-25412356-9",
        phone: "+5493415556677",
        email: "contacto@lamoda.com",
        address: "Peatonal Córdoba 1200, Rosario",
        birthDate: "1992-08-24",
        gender: "Femenino",
        balance: 25000,
    },
    {
        id: "3",
        name: "Juan Pérez - Mayorista Independiente",
        cuit: "20-18765432-1",
        phone: "+5491133221144",
        email: "juan.perez.ventas@gmail.com",
        address: "Calle Falsa 123, CABA",
        birthDate: "1975-11-03",
        gender: "Masculino",
        notes: "Suele pedir contrareembolso.",
        balance: 0,
    },
    {
        id: "4",
        name: "Supermercados El Sol",
        cuit: "30-55554444-2",
        phone: "+5493512223344",
        email: "proveedores@elsol.com.ar",
        address: "Bv. San Juan 400, Córdoba",
        birthDate: "1990-01-01",
        gender: "Empresa",
        notes: "Requiere factura A sí o sí. Cuidado con los límites de crédito.",
        balance: -320500,
    },
    {
        id: "5",
        name: "Boutique Urbana",
        cuit: "23-30123456-4",
        phone: "+5492214445566",
        email: "info@boutiqueurbana.com",
        address: "Calle 8 1000, La Plata",
        birthDate: "1988-07-19",
        gender: "Femenino",
        balance: 10500,
    }
];
