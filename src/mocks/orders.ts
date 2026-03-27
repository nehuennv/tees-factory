export type OrderStatus = 'NEW' | 'PAID' | 'PREPARING' | 'DISPATCHED';

export interface OrderItem {
    id: string;
    productName: string;
    quality: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
}

export interface Order {
    id: string;
    clientName: string;
    date: string;
    totalItems: number;
    totalAmount: number;
    status: OrderStatus;
    items: OrderItem[];
}

export const MOCK_ORDERS: Order[] = [
    {
        id: "#ORD-1050",
        clientName: "Distribuidora Once Textil",
        date: "2026-03-01",
        status: "PAID",
        totalItems: 80,
        totalAmount: 1120000,
        items: [
            { id: "5001", productName: "Remera Classic", quality: "Algodón 24/1", color: "Negro", size: "L", quantity: 50, unitPrice: 12000 },
            { id: "5002", productName: "Buzo Canguro", quality: "Frisa Invisible", color: "Gris Melange", size: "XL", quantity: 30, unitPrice: 17333.333333333336 } // Adjusted for exactness
        ]
    },
    {
        id: "#ORD-1051",
        clientName: "Showroom Las Juanas",
        date: "2026-03-01",
        status: "NEW",
        totalItems: 45,
        totalAmount: 645000,
        items: [
            { id: "5003", productName: "Remera Oversize", quality: "Algodón Peinado 20/1", color: "Blanco", size: "M", quantity: 30, unitPrice: 14500 },
            { id: "5004", productName: "Jogging", quality: "Rústico", color: "Azul Marino", size: "L", quantity: 15, unitPrice: 14000 }
        ]
    },
    {
        id: "#ORD-1052",
        clientName: "Local Flores Centro",
        date: "2026-03-02",
        status: "PREPARING",
        totalItems: 110,
        totalAmount: 1840000,
        items: [
            { id: "5005", productName: "Remera Classic", quality: "Algodón 24/1", color: "Gris Melange", size: "S", quantity: 60, unitPrice: 12000 },
            { id: "5006", productName: "Campera Bomber", quality: "Frisa Invisible", color: "Negro", size: "XXL", quantity: 50, unitPrice: 22400 }
        ]
    },
    {
        id: "#ORD-1053",
        clientName: "Distribuidora Norte",
        date: "2026-03-02",
        status: "DISPATCHED",
        totalItems: 150,
        totalAmount: 2250000,
        items: [
            { id: "5007", productName: "Remera Oversize", quality: "Algodón 24/1", color: "Verde Seco", size: "XL", quantity: 100, unitPrice: 14000 },
            { id: "5008", productName: "Buzo Canguro", quality: "Frisa Invisible", color: "Azul Marino", size: "L", quantity: 50, unitPrice: 17000 }
        ]
    },
    {
        id: "#ORD-1054",
        clientName: "Tienda Palermo Soho",
        date: "2026-03-03",
        status: "PAID",
        totalItems: 65,
        totalAmount: 1090000,
        items: [
            { id: "5009", productName: "Jogging", quality: "Rústico", color: "Gris Melange", size: "M", quantity: 40, unitPrice: 16000 },
            { id: "5010", productName: "Remera Classic", quality: "Algodón Peinado 20/1", color: "Negro", size: "S", quantity: 25, unitPrice: 18000 }
        ]
    },
    {
        id: "#ORD-1055",
        clientName: "Textil Avellaneda Mayorista",
        date: "2026-03-03",
        status: "NEW",
        totalItems: 120,
        totalAmount: 1560000,
        items: [
            { id: "5011", productName: "Remera Classic", quality: "Algodón 24/1", color: "Blanco", size: "L", quantity: 80, unitPrice: 11500 },
            { id: "5012", productName: "Remera Classic", quality: "Algodón 24/1", color: "Negro", size: "L", quantity: 40, unitPrice: 16000 }
        ]
    },
    {
        id: "#ORD-1056",
        clientName: "Boutique Córdoba Alta",
        date: "2026-03-04",
        status: "PREPARING",
        totalItems: 90,
        totalAmount: 1620000,
        items: [
            { id: "5013", productName: "Buzo Canguro", quality: "Frisa Invisible", color: "Verde Seco", size: "M", quantity: 45, unitPrice: 18000 },
            { id: "5014", productName: "Jogging", quality: "Rústico", color: "Negro", size: "L", quantity: 45, unitPrice: 18000 }
        ]
    },
    {
        id: "#ORD-1057",
        clientName: "Liniers Mayorista Ropa",
        date: "2026-03-05",
        status: "DISPATCHED",
        totalItems: 180,
        totalAmount: 2340000,
        items: [
            { id: "5015", productName: "Remera Classic", quality: "Algodón 24/1", color: "Blanco", size: "XL", quantity: 100, unitPrice: 12000 },
            { id: "5016", productName: "Remera Classic", quality: "Algodón 24/1", color: "Azul Marino", size: "XL", quantity: 80, unitPrice: 14250 }
        ]
    },
    {
        id: "#ORD-1058",
        clientName: "Rosario Modas",
        date: "2026-03-05",
        status: "PAID",
        totalItems: 70,
        totalAmount: 1260000,
        items: [
            { id: "5017", productName: "Remera Oversize", quality: "Algodón Peinado 20/1", color: "Gris Melange", size: "S", quantity: 35, unitPrice: 15000 },
            { id: "5018", productName: "Buzo Canguro", quality: "Frisa Invisible", color: "Negro", size: "M", quantity: 35, unitPrice: 21000 }
        ]
    },
    {
        id: "#ORD-1059",
        clientName: "Mendoza Indumentaria",
        date: "2026-03-06",
        status: "NEW",
        totalItems: 55,
        totalAmount: 935000,
        items: [
            { id: "5019", productName: "Jogging", quality: "Rústico", color: "Verde Seco", size: "XXL", quantity: 25, unitPrice: 17000 },
            { id: "5020", productName: "Remera Classic", quality: "Algodón 24/1", color: "Negro", size: "L", quantity: 30, unitPrice: 17000 }
        ]
    },
    {
        id: "#ORD-1060",
        clientName: "Tucumán Sports",
        date: "2026-03-06",
        status: "PREPARING",
        totalItems: 140,
        totalAmount: 2240000,
        items: [
            { id: "5021", productName: "Remera Oversize", quality: "Algodón Peinado 20/1", color: "Blanco", size: "XL", quantity: 70, unitPrice: 14000 },
            { id: "5022", productName: "Buzo Canguro", quality: "Frisa Invisible", color: "Gris Melange", size: "L", quantity: 70, unitPrice: 18000 }
        ]
    },
    {
        id: "#ORD-1061",
        clientName: "Bahía Blanca Outfits",
        date: "2026-03-07",
        status: "DISPATCHED",
        totalItems: 85,
        totalAmount: 1445000,
        items: [
            { id: "5023", productName: "Campera Bomber", quality: "Frisa Invisible", color: "Azul Marino", size: "M", quantity: 40, unitPrice: 25000 },
            { id: "5024", productName: "Remera Classic", quality: "Algodón 24/1", color: "Blanco", size: "S", quantity: 45, unitPrice: 9888.888888888889 } // Adjusted
        ]
    },
    {
        id: "#ORD-1062",
        clientName: "La Plata Kids & Teens",
        date: "2026-03-08",
        status: "PAID",
        totalItems: 100,
        totalAmount: 1350000,
        items: [
            { id: "5025", productName: "Remera Classic", quality: "Algodón 24/1", color: "Gris Melange", size: "M", quantity: 60, unitPrice: 12000 },
            { id: "5026", productName: "Jogging", quality: "Rústico", color: "Negro", size: "S", quantity: 40, unitPrice: 15750 }
        ]
    },
    {
        id: "#ORD-1063",
        clientName: "Mar del Plata Surf Shop",
        date: "2026-03-08",
        status: "NEW",
        totalItems: 40,
        totalAmount: 880000,
        items: [
            { id: "5027", productName: "Buzo Canguro", quality: "Frisa Invisible", color: "Blanco", size: "L", quantity: 20, unitPrice: 22000 },
            { id: "5028", productName: "Remera Oversize", quality: "Algodón Peinado 20/1", color: "Negro", size: "XL", quantity: 20, unitPrice: 22000 }
        ]
    },
    {
        id: "#ORD-1064",
        clientName: "Salta Tradición Textil",
        date: "2026-03-09",
        status: "PREPARING",
        totalItems: 125,
        totalAmount: 1812500,
        items: [
            { id: "5029", productName: "Remera Classic", quality: "Algodón 24/1", color: "Azul Marino", size: "XXL", quantity: 75, unitPrice: 13500 },
            { id: "5030", productName: "Jogging", quality: "Rústico", color: "Gris Melange", size: "L", quantity: 50, unitPrice: 16000 }
        ]
    },
    {
        id: "#ORD-1065",
        clientName: "Corrientes Textil",
        date: "2026-03-10",
        status: "DISPATCHED",
        totalItems: 95,
        totalAmount: 1472500,
        items: [
            { id: "5031", productName: "Buzo Canguro", quality: "Frisa Invisible", color: "Negro", size: "M", quantity: 45, unitPrice: 19000 },
            { id: "5032", productName: "Remera Classic", quality: "Algodón 24/1", color: "Verde Seco", size: "S", quantity: 50, unitPrice: 12350 }
        ]
    },
    {
        id: "#ORD-1066",
        clientName: "San Juan Elegance",
        date: "2026-03-11",
        status: "PAID",
        totalItems: 110,
        totalAmount: 1980000,
        items: [
            { id: "5033", productName: "Campera Bomber", quality: "Frisa Invisible", color: "Gris Melange", size: "L", quantity: 55, unitPrice: 24000 },
            { id: "5034", productName: "Jogging", quality: "Rústico", color: "Negro", size: "XL", quantity: 55, unitPrice: 12000 }
        ]
    },
    {
        id: "#ORD-1067",
        clientName: "Neuquén Urbana",
        date: "2026-03-12",
        status: "NEW",
        totalItems: 60,
        totalAmount: 960000,
        items: [
            { id: "5035", productName: "Remera Oversize", quality: "Algodón Peinado 20/1", color: "Blanco", size: "M", quantity: 30, unitPrice: 16000 },
            { id: "5036", productName: "Buzo Canguro", quality: "Frisa Invisible", color: "Azul Marino", size: "S", quantity: 30, unitPrice: 16000 }
        ]
    },
    {
        id: "#ORD-1068",
        clientName: "Santa Fe Estilo",
        date: "2026-03-12",
        status: "PREPARING",
        totalItems: 130,
        totalAmount: 1755000,
        items: [
            { id: "5037", productName: "Remera Classic", quality: "Algodón 24/1", color: "Negro", size: "XL", quantity: 80, unitPrice: 12500 },
            { id: "5038", productName: "Jogging", quality: "Rústico", color: "Gris Melange", size: "L", quantity: 50, unitPrice: 15100 }
        ]
    },
    {
        id: "#ORD-1069",
        clientName: "Entre Ríos Sport",
        date: "2026-03-13",
        status: "DISPATCHED",
        totalItems: 75,
        totalAmount: 1312500,
        items: [
            { id: "5039", productName: "Buzo Canguro", quality: "Frisa Invisible", color: "Verde Seco", size: "XXL", quantity: 35, unitPrice: 20000 },
            { id: "5040", productName: "Remera Classic", quality: "Algodón 24/1", color: "Blanco", size: "M", quantity: 40, unitPrice: 15312.5 }
        ]
    },
    {
        id: "#ORD-1070",
        clientName: "Jujuy Tejidos y Ropa",
        date: "2026-03-14",
        status: "PAID",
        totalItems: 105,
        totalAmount: 1680000,
        items: [
            { id: "5041", productName: "Remera Oversize", quality: "Algodón Peinado 20/1", color: "Azul Marino", size: "L", quantity: 60, unitPrice: 16000 },
            { id: "5042", productName: "Jogging", quality: "Rústico", color: "Negro", size: "M", quantity: 45, unitPrice: 16000 }
        ]
    },
    {
        id: "#ORD-1071",
        clientName: "Chaco Algodón S.R.L.",
        date: "2026-03-15",
        status: "NEW",
        totalItems: 150,
        totalAmount: 2100000,
        items: [
            { id: "5043", productName: "Remera Classic", quality: "Algodón 24/1", color: "Blanco", size: "S", quantity: 100, unitPrice: 11000 },
            { id: "5044", productName: "Buzo Canguro", quality: "Frisa Invisible", color: "Gris Melange", size: "XL", quantity: 50, unitPrice: 20000 }
        ]
    },
    {
        id: "#ORD-1072",
        clientName: "Misiones Naturaleza",
        date: "2026-03-15",
        status: "PREPARING",
        totalItems: 80,
        totalAmount: 1400000,
        items: [
            { id: "5045", productName: "Campera Bomber", quality: "Frisa Invisible", color: "Negro", size: "L", quantity: 40, unitPrice: 23000 },
            { id: "5046", productName: "Remera Oversize", quality: "Algodón Peinado 20/1", color: "Verde Seco", size: "M", quantity: 40, unitPrice: 12000 }
        ]
    },
    {
        id: "#ORD-1073",
        clientName: "San Luis Diseño",
        date: "2026-03-16",
        status: "DISPATCHED",
        totalItems: 120,
        totalAmount: 1860000,
        items: [
            { id: "5047", productName: "Jogging", quality: "Rústico", color: "Azul Marino", size: "XL", quantity: 60, unitPrice: 15500 },
            { id: "5048", productName: "Remera Classic", quality: "Algodón 24/1", color: "Gris Melange", size: "XXL", quantity: 60, unitPrice: 15500 }
        ]
    },
    {
        id: "#ORD-1074",
        clientName: "Formosa Variedades",
        date: "2026-03-17",
        status: "PAID",
        totalItems: 90,
        totalAmount: 1215000,
        items: [
            { id: "5049", productName: "Remera Classic", quality: "Algodón 24/1", color: "Blanco", size: "M", quantity: 50, unitPrice: 11000 },
            { id: "5050", productName: "Jogging", quality: "Rústico", color: "Negro", size: "S", quantity: 40, unitPrice: 16625 }
        ]
    },
    {
        id: "#ORD-1075",
        clientName: "La Pampa Campo y Ciudad",
        date: "2026-03-17",
        status: "NEW",
        totalItems: 70,
        totalAmount: 1330000,
        items: [
            { id: "5051", productName: "Buzo Canguro", quality: "Frisa Invisible", color: "Gris Melange", size: "L", quantity: 35, unitPrice: 20000 },
            { id: "5052", productName: "Remera Oversize", quality: "Algodón Peinado 20/1", color: "Azul Marino", size: "XL", quantity: 35, unitPrice: 18000 }
        ]
    },
    {
        id: "#ORD-1076",
        clientName: "Santa Cruz Frío Extremo",
        date: "2026-03-18",
        status: "PREPARING",
        totalItems: 110,
        totalAmount: 2420000,
        items: [
            { id: "5053", productName: "Campera Bomber", quality: "Frisa Invisible", color: "Negro", size: "XXL", quantity: 70, unitPrice: 26000 },
            { id: "5054", productName: "Jogging", quality: "Rústico", color: "Azul Marino", size: "L", quantity: 40, unitPrice: 15000 }
        ]
    },
    {
        id: "#ORD-1077",
        clientName: "Tierra del Fuego Wear",
        date: "2026-03-19",
        status: "DISPATCHED",
        totalItems: 140,
        totalAmount: 2170000,
        items: [
            { id: "5055", productName: "Buzo Canguro", quality: "Frisa Invisible", color: "Blanco", size: "M", quantity: 70, unitPrice: 18500 },
            { id: "5056", productName: "Remera Classic", quality: "Algodón 24/1", color: "Negro", size: "S", quantity: 70, unitPrice: 12500 }
        ]
    },
    {
        id: "#ORD-1078",
        clientName: "Catamarca Calidad Textil",
        date: "2026-03-19",
        status: "PAID",
        totalItems: 60,
        totalAmount: 930000,
        items: [
            { id: "5057", productName: "Remera Oversize", quality: "Algodón Peinado 20/1", color: "Verde Seco", size: "L", quantity: 30, unitPrice: 15500 },
            { id: "5058", productName: "Jogging", quality: "Rústico", color: "Gris Melange", size: "M", quantity: 30, unitPrice: 15500 }
        ]
    },
    {
        id: "#ORD-1079",
        clientName: "La Rioja Sol y Estilo",
        date: "2026-03-20",
        status: "NEW",
        totalItems: 100,
        totalAmount: 1400000,
        items: [
            { id: "5059", productName: "Remera Classic", quality: "Algodón 24/1", color: "Blanco", size: "XL", quantity: 60, unitPrice: 12000 },
            { id: "5060", productName: "Buzo Canguro", quality: "Frisa Invisible", color: "Azul Marino", size: "L", quantity: 40, unitPrice: 17000 }
        ]
    },
    {
        id: "#ORD-1080",
        clientName: "Santiago Modas Mayorista",
        date: "2026-03-21",
        status: "PREPARING",
        totalItems: 160,
        totalAmount: 2240000,
        items: [
            { id: "5061", productName: "Remera Classic", quality: "Algodón 24/1", color: "Negro", size: "M", quantity: 100, unitPrice: 12000 },
            { id: "5062", productName: "Jogging", quality: "Rústico", color: "Verde Seco", size: "S", quantity: 60, unitPrice: 17333.333333333332 }
        ]
    },
    {
        id: "#ORD-1081",
        clientName: "Pilar Chic Showroom",
        date: "2026-03-21",
        status: "DISPATCHED",
        totalItems: 50,
        totalAmount: 1100000,
        items: [
            { id: "5063", productName: "Campera Bomber", quality: "Frisa Invisible", color: "Blanco", size: "XL", quantity: 25, unitPrice: 25000 },
            { id: "5064", productName: "Remera Oversize", quality: "Algodón Peinado 20/1", color: "Negro", size: "L", quantity: 25, unitPrice: 19000 }
        ]
    },
    {
        id: "#ORD-1082",
        clientName: "Tigre Deco & Wear",
        date: "2026-03-22",
        status: "PAID",
        totalItems: 115,
        totalAmount: 1667500,
        items: [
            { id: "5065", productName: "Remera Classic", quality: "Algodón 24/1", color: "Gris Melange", size: "M", quantity: 65, unitPrice: 12500 },
            { id: "5066", productName: "Jogging", quality: "Rústico", color: "Azul Marino", size: "S", quantity: 50, unitPrice: 17100 }
        ]
    },
    {
        id: "#ORD-1083",
        clientName: "Quilmes Centro Distribuidora",
        date: "2026-03-22",
        status: "NEW",
        totalItems: 90,
        totalAmount: 1440000,
        items: [
            { id: "5067", productName: "Buzo Canguro", quality: "Frisa Invisible", color: "Negro", size: "XXL", quantity: 45, unitPrice: 20000 },
            { id: "5068", productName: "Remera Classic", quality: "Algodón 24/1", color: "Blanco", size: "XL", quantity: 45, unitPrice: 12000 }
        ]
    },
    {
        id: "#ORD-1084",
        clientName: "Morón Mayorista Ropa",
        date: "2026-03-23",
        status: "PREPARING",
        totalItems: 135,
        totalAmount: 1957500,
        items: [
            { id: "5069", productName: "Remera Oversize", quality: "Algodón Peinado 20/1", color: "Verde Seco", size: "M", quantity: 70, unitPrice: 14500 },
            { id: "5070", productName: "Jogging", quality: "Rústico", color: "Gris Melange", size: "L", quantity: 65, unitPrice: 14500 }
        ]
    },
    {
        id: "#ORD-1085",
        clientName: "Lanús Ropa y Accesorios",
        date: "2026-03-23",
        status: "DISPATCHED",
        totalItems: 85,
        totalAmount: 1530000,
        items: [
            { id: "5071", productName: "Campera Bomber", quality: "Frisa Invisible", color: "Azul Marino", size: "S", quantity: 35, unitPrice: 24000 },
            { id: "5072", productName: "Buzo Canguro", quality: "Frisa Invisible", color: "Negro", size: "M", quantity: 50, unitPrice: 13800 }
        ]
    },
    {
        id: "#ORD-1086",
        clientName: "Avellaneda Jeans S.A.",
        date: "2026-03-24",
        status: "PAID",
        totalItems: 200,
        totalAmount: 2600000,
        items: [
            { id: "5073", productName: "Remera Classic", quality: "Algodón 24/1", color: "Blanco", size: "L", quantity: 100, unitPrice: 12000 },
            { id: "5074", productName: "Remera Classic", quality: "Algodón 24/1", color: "Negro", size: "XL", quantity: 100, unitPrice: 14000 }
        ]
    },
    {
        id: "#ORD-1087",
        clientName: "Belgrano Boutique",
        date: "2026-03-24",
        status: "NEW",
        totalItems: 40,
        totalAmount: 840000,
        items: [
            { id: "5075", productName: "Buzo Canguro", quality: "Frisa Invisible", color: "Gris Melange", size: "S", quantity: 20, unitPrice: 22000 },
            { id: "5076", productName: "Jogging", quality: "Rústico", color: "Azul Marino", size: "M", quantity: 20, unitPrice: 20000 }
        ]
    },
    {
        id: "#ORD-1088",
        clientName: "San Isidro Luxury Wear",
        date: "2026-03-24",
        status: "PREPARING",
        totalItems: 75,
        totalAmount: 1425000,
        items: [
            { id: "5077", productName: "Remera Oversize", quality: "Algodón Peinado 20/1", color: "Blanco", size: "XXL", quantity: 40, unitPrice: 19000 },
            { id: "5078", productName: "Campera Bomber", quality: "Frisa Invisible", color: "Negro", size: "L", quantity: 35, unitPrice: 19000 }
        ]
    },
    {
        id: "#ORD-1089",
        clientName: "Vicente López Urban Shop",
        date: "2026-03-24",
        status: "DISPATCHED",
        totalItems: 110,
        totalAmount: 1760000,
        items: [
            { id: "5079", productName: "Remera Classic", quality: "Algodón 24/1", color: "Azul Marino", size: "M", quantity: 60, unitPrice: 14000 },
            { id: "5080", productName: "Jogging", quality: "Rústico", color: "Verde Seco", size: "L", quantity: 50, unitPrice: 18400 }
        ]
    }
];
