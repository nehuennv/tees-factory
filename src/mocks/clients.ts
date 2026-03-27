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
    balance: number;
    sellerId?: string;
}

export const MOCK_CLIENTS: Client[] = [
    {
        id: "6",
        name: "Indumentaria Avellaneda Mayorista",
        cuit: "30-71558421-9",
        phone: "+5491145882233",
        email: "ventas@avellanedamayorista.com.ar",
        address: "Av. Avellaneda 2940, CABA",
        gender: "Empresa",
        notes: "Solo factura A. Enviar por transporte privado.",
        balance: -450000.50,
        sellerId: "usr_seller"
    },
    {
        id: "7",
        name: "Boutique Las Juanas",
        cuit: "27-32445678-4",
        phone: "+5493415667788",
        email: "lasjuanasrosario@gmail.com",
        address: "Bv. Oroño 450, Rosario, Santa Fe",
        gender: "Femenino",
        notes: "Prefiere contacto por WhatsApp para confirmar pedidos.",
        balance: 0,
        sellerId: "usr_seller"
    },
    {
        id: "8",
        name: "Distribuidora El Rey del Jean",
        cuit: "30-66442211-5",
        phone: "+5491133224455",
        email: "contacto@elreydeljean.com.ar",
        address: "Bogotá 3100, CABA",
        gender: "Empresa",
        notes: "Mandar por Vía Cargo. Cliente VIP de temporada.",
        balance: -1250000.00,
        sellerId: "usr_seller"
    },
    {
        id: "9",
        name: "Estilo Córdoba Multimarca",
        cuit: "20-28556443-1",
        phone: "+5493514223344",
        email: "info@estilocordoba.com.ar",
        address: "9 de Julio 150, Córdoba Capital",
        gender: "Masculino",
        notes: "Entrega programada para los días martes por la mañana.",
        balance: -32000.00
    },
    {
        id: "10",
        name: "Showroom Mendoza Trends",
        cuit: "27-35441122-8",
        phone: "+5492614556677",
        email: "mendozatrends@hotmail.com",
        address: "Aristides Villanueva 420, Mendoza",
        gender: "Femenino",
        notes: "Cliente recurrente. No requiere revisión de stock previa.",
        balance: 15400.00
    },
    {
        id: "11",
        name: "Tienda Los Gallegos S.A.",
        cuit: "33-50001234-9",
        phone: "+5492234556677",
        email: "administracion@losgallegos.com.ar",
        address: "Rivadavia 3050, Mar del Plata",
        gender: "Empresa",
        notes: "Facturación a nombre de Tienda Los Gallegos S.A. Central.",
        balance: -890000.00
    },
    {
        id: "12",
        name: "Juan Carlos Pérez",
        cuit: "20-14556778-3",
        phone: "+5493814221100",
        email: "jcperez_tuc@gmail.com",
        address: "Muñecas 250, San Miguel de Tucumán",
        gender: "Masculino",
        notes: "Suele rebotar cheques. Operar solo con transferencia anticipada.",
        balance: -15000.00
    },
    {
        id: "13",
        name: "Modas del Sur Distribuciones",
        cuit: "30-71223344-5",
        phone: "+5492994433221",
        email: "ventas@modasdelsur.com",
        address: "Av. Argentina 300, Neuquén",
        gender: "Empresa",
        notes: "Pago mediante transferencia bancaria a principios de mes.",
        balance: 0
    },
    {
        id: "14",
        name: "Chicas de Salta Showroom",
        cuit: "27-28990011-2",
        phone: "+5493874558899",
        email: "chicasdesalta@yahoo.com.ar",
        address: "Caseros 600, Salta Capital",
        gender: "Femenino",
        notes: "Atención personalizada. Consultar disponibilidad de talles especiales.",
        balance: -210000.00
    },
    {
        id: "15",
        name: "Uniforme Global S.R.L.",
        cuit: "30-55667788-9",
        phone: "+5491122334455",
        email: "corporativo@uniformeglobal.com",
        address: "Av. Corrientes 4500, CABA",
        gender: "Empresa",
        balance: 0
    },
    {
        id: "16",
        name: "Boutique de Autor",
        cuit: "23-30554433-4",
        phone: "+5493516677889",
        email: "boutiqueautor@gmail.com",
        address: "Belgrano 800, Córdoba",
        gender: "Femenino",
        notes: "Interesada en nuevas colecciones cada temporada.",
        balance: -56000.00
    },
    {
        id: "17",
        name: "Textil Norte Mayorista",
        cuit: "30-68554432-1",
        phone: "+5493884221144",
        email: "nortetextil@gmail.com",
        address: "Belgrano 1200, San Salvador de Jujuy",
        gender: "Empresa",
        notes: "Enviar por Expreso Rivadavia sin falta.",
        balance: -340000.00
    },
    {
        id: "18",
        name: "Ricardo Indumentaria",
        cuit: "20-18443322-7",
        phone: "+5493424556611",
        email: "ricardoindu@gmail.com",
        address: "San Martín 2200, Santa Fe Capital",
        gender: "Masculino",
        balance: 0
    },
    {
        id: "19",
        name: "La Mansión del Vestido",
        cuit: "27-22334455-6",
        phone: "+5491166778899",
        email: "info@lamansion.com.ar",
        address: "Santa Fe 1800, CABA",
        gender: "Femenino",
        balance: 45000.00
    },
    {
        id: "20",
        name: "Todo Deporte San Juan",
        cuit: "30-71889922-3",
        phone: "+5492644223355",
        email: "ventas@tododeportesj.com",
        address: "Rivadavia Este 150, San Juan",
        gender: "Empresa",
        notes: "Dejó clavado un pedido en 2024. Pedir seña 50%.",
        balance: -120000.00
    },
    {
        id: "21",
        name: "Urban Style Mendoza",
        cuit: "20-33445566-7",
        phone: "+5492613322114",
        email: "urbanstyle@gmail.com",
        address: "Av. San Martín 1050, Mendoza",
        gender: "Masculino",
        balance: -88000.00
    },
    {
        id: "22",
        name: "Mia Moda",
        cuit: "27-38445566-1",
        phone: "+5493412233445",
        email: "miamoda@hotmail.com",
        address: "Pellegrini 1400, Rosario",
        gender: "Femenino",
        balance: 0
    },
    {
        id: "23",
        name: "Distribuidora del Centro",
        cuit: "30-55449988-2",
        phone: "+5493515566778",
        email: "distribuidoracentro@uol.com.ar",
        address: "Colon 350, Córdoba",
        gender: "Empresa",
        balance: -1500000.00
    },
    {
        id: "24",
        name: "Textiles del Chaco",
        cuit: "33-70884422-1",
        phone: "+5493624445566",
        email: "textilchaco@gmail.com",
        address: "Arturo Illia 250, Resistencia",
        gender: "Empresa",
        balance: 22000.00
    },
    {
        id: "25",
        name: "Catalina Rodriguez",
        cuit: "27-18445522-9",
        phone: "+5491155443322",
        email: "cata_rodriguez@gmail.com",
        address: "Cuenca 3200, CABA",
        gender: "Femenino",
        notes: "Cliente VIP. Bonificación 10% en efectivo.",
        balance: 0
    },
    {
        id: "26",
        name: "Modas Corrientes",
        cuit: "27-25443322-1",
        phone: "+5493794556677",
        email: "modasctes@gmail.com",
        address: "Junín 1100, Corrientes",
        gender: "Femenino",
        balance: -43000.00
    },
    {
        id: "27",
        name: "Look Urbano Bahia",
        cuit: "30-77885544-2",
        phone: "+5492914556677",
        email: "lookurbano@outlook.com",
        address: "O'Higgins 150, Bahía Blanca",
        gender: "Empresa",
        balance: -115000.00
    },
    {
        id: "28",
        name: "Tienda San Luis",
        cuit: "30-66554411-0",
        phone: "+5492664552211",
        email: "tiendasanluis@gmail.com",
        address: "Pringles 800, San Luis",
        gender: "Empresa",
        balance: 0
    },
    {
        id: "29",
        name: "Mendoza Kids Indumentaria",
        cuit: "27-31445566-3",
        phone: "+5492615566778",
        email: "mendozakids@yahoo.com",
        address: "Las Heras 300, Mendoza",
        gender: "Femenino",
        balance: -28000.00
    },
    {
        id: "30",
        name: "Distribuidora Patagonia",
        cuit: "30-71445588-9",
        phone: "+5492974556633",
        email: "ventas@patagoniaindu.com.ar",
        address: "San Martín 500, Comodoro Rivadavia",
        gender: "Empresa",
        notes: "Mandar por Cruz del Sur.",
        balance: -750000.00
    },
    {
        id: "31",
        name: "Estilo & Glamour Posadas",
        cuit: "27-28334455-9",
        phone: "+5493764556677",
        email: "estiloglamour@gmail.com",
        address: "Ayacucho 1800, Posadas",
        gender: "Femenino",
        balance: 0
    },
    {
        id: "32",
        name: "García Hogar y Textil",
        cuit: "30-50443322-1",
        phone: "+5493834556677",
        email: "garciatextil@catamarca.com",
        address: "Sarmiento 550, San Fernando del Valle de Catamarca",
        gender: "Empresa",
        balance: -12500.00
    },
    {
        id: "33",
        name: "Pampa Mia Ropa Blanca",
        cuit: "27-17445566-2",
        phone: "+5492954556622",
        email: "pampamia@gmail.com",
        address: "Av. San Martín 200, Santa Rosa, La Pampa",
        gender: "Femenino",
        balance: 12000.00
    },
    {
        id: "34",
        name: "Ariel Ventas Online",
        cuit: "20-35443321-4",
        phone: "+5491166554433",
        email: "arielventas@gmail.com",
        address: "Av. Rivadavia 12000, Ciudadela",
        gender: "Masculino",
        balance: -34000.00
    },
    {
        id: "35",
        name: "Distribuidora Once 24",
        cuit: "30-71556677-4",
        phone: "+5491144556677",
        email: "once24@gmail.com",
        address: "Pasteur 450, CABA",
        gender: "Empresa",
        notes: "Retira en local. No cobrar envío.",
        balance: 0
    },
    {
        id: "36",
        name: "Boutique del Sol",
        cuit: "27-22445566-0",
        phone: "+5492644332211",
        email: "boutiquedelsol@sanjuan.com",
        address: "Gral. Acha 120, San Juan",
        gender: "Femenino",
        balance: -67000.00
    },
    {
        id: "37",
        name: "Santiago Ropa Interior",
        cuit: "30-55443311-9",
        phone: "+5493854223344",
        email: "santiagoropa@hotmail.com",
        address: "Belgrano Sur 450, Santiago del Estero",
        gender: "Empresa",
        balance: -190000.00
    },
    {
        id: "38",
        name: "La Rioja Moda",
        cuit: "23-28445566-4",
        phone: "+5493804556677",
        email: "lariojamoda@gmail.com",
        address: "Pelagio Luna 600, La Rioja",
        gender: "Empresa",
        balance: 0
    },
    {
        id: "39",
        name: "Fernando Gomez Distribuidores",
        cuit: "20-22445533-1",
        phone: "+5491155664422",
        email: "fgdistribuidora@gmail.com",
        address: "Aranguren 3100, CABA",
        gender: "Masculino",
        balance: -540000.00
    },
    {
        id: "40",
        name: "Showroom Las Lolas",
        cuit: "27-33445566-5",
        phone: "+5493416677882",
        email: "laslolas@rosario.com",
        address: "Salta 2200, Rosario",
        gender: "Femenino",
        notes: "Mandar catálogo nuevo cada mes.",
        balance: 8500.00
    },
    {
        id: "41",
        name: "Textil Formosa",
        cuit: "30-77443322-8",
        phone: "+5493704556611",
        email: "textilformosa@gmail.com",
        address: "España 350, Formosa",
        gender: "Empresa",
        balance: -110000.00
    },
    {
        id: "42",
        name: "Mabel Boutique",
        cuit: "27-14556677-4",
        phone: "+5492214556633",
        email: "mabelboutique@yahoo.com.ar",
        address: "Calle 12 650, La Plata",
        gender: "Femenino",
        balance: 0
    },
    {
        id: "43",
        name: "Deportes 360",
        cuit: "30-66443322-1",
        phone: "+5493512233441",
        email: "deportes360@gmail.com",
        address: "Duarte Quirós 1400, Córdoba",
        gender: "Empresa",
        balance: -225000.00
    },
    {
        id: "44",
        name: "Marcelo Indumentaria Masculina",
        cuit: "20-25443322-1",
        phone: "+5492615544332",
        email: "marceloindu@hotmail.com",
        address: "Chile 800, Mendoza",
        gender: "Masculino",
        balance: -14000.00
    },
    {
        id: "45",
        name: "Chicas Malas Showroom",
        cuit: "27-31442233-8",
        phone: "+5491133445566",
        email: "chicasmalas@gmail.com",
        address: "Av. Cabildo 2200, CABA",
        gender: "Femenino",
        notes: "Reclamar deuda de Noviembre.",
        balance: -89000.00
    },
    {
        id: "46",
        name: "Venta Directa Paraná",
        cuit: "30-71228833-2",
        phone: "+5493434556677",
        email: "paranaventa@gmail.com",
        address: "Urquiza 1100, Paraná, Entre Ríos",
        gender: "Empresa",
        balance: 0
    },
    {
        id: "47",
        name: "Moda Actual Jujuy",
        cuit: "27-22448833-1",
        phone: "+5493884552233",
        email: "modajujuy@gmail.com",
        address: "Alvear 700, San Salvador de Jujuy",
        gender: "Femenino",
        balance: -56000.00
    },
    {
        id: "48",
        name: "El Palacio del Jean",
        cuit: "33-66554433-2",
        phone: "+5491144332211",
        email: "palaciojean@outlook.com",
        address: "Helguera 450, CABA",
        gender: "Empresa",
        balance: -1200000.00
    },
    {
        id: "49",
        name: "Distribuidora San Rafael",
        cuit: "30-55442211-3",
        phone: "+5492604556677",
        email: "sanrafaeldist@gmail.com",
        address: "Av. Mitre 300, San Rafael, Mendoza",
        gender: "Empresa",
        balance: 0
    },
    {
        id: "50",
        name: "Boutique del Parque",
        cuit: "27-25441199-0",
        phone: "+5492234558877",
        email: "delparque@hotmail.com",
        address: "Paso 2800, Mar del Plata",
        gender: "Femenino",
        notes: "Solo factura B por pedido del dueño.",
        balance: -12000.00
    },
    {
        id: "51",
        name: "Outlet Premium Pilar",
        cuit: "30-71882233-5",
        phone: "+5492304556677",
        email: "outletpilar@gmail.com",
        address: "Ruta 8 Km 50, Pilar",
        gender: "Empresa",
        balance: 35000.00
    },
    {
        id: "52",
        name: "Griselda Ropa",
        cuit: "27-12443322-5",
        phone: "+5493516655443",
        email: "griselda_ropa@gmail.com",
        address: "Rafael Nuñez 4000, Córdoba",
        gender: "Femenino",
        balance: -45000.00
    },
    {
        id: "53",
        name: "Mayorista El Sol",
        cuit: "30-55883322-1",
        phone: "+5491144882211",
        email: "elsolmayorista@gmail.com",
        address: "Castelli 300, CABA",
        gender: "Empresa",
        balance: 0
    },
    {
        id: "54",
        name: "Ropa Interior Luján",
        cuit: "27-30442211-9",
        phone: "+5492323445566",
        email: "ropalujan@gmail.com",
        address: "San Martín 500, Luján",
        gender: "Femenino",
        balance: -23000.00
    },
    {
        id: "55",
        name: "Distribuidora Alto Valle",
        cuit: "30-71662233-1",
        phone: "+5492984556677",
        email: "altovalleindu@gmail.com",
        address: "Tucumán 800, General Roca, Río Negro",
        gender: "Empresa",
        notes: "No entregar si tiene facturas vencidas de más de 30 días.",
        balance: -670000.00
    },
    {
        id: "56",
        name: "Indumentaria Libertad",
        cuit: "33-55442288-0",
        phone: "+5493814552233",
        email: "libertadindu@gmail.com",
        address: "Libertad 400, San Miguel de Tucumán",
        gender: "Empresa",
        balance: 0
    },
    {
        id: "57",
        name: "Paula Diseños",
        cuit: "27-34551122-3",
        phone: "+5491166332211",
        email: "pauladisenos@gmail.com",
        address: "Serrano 1400, CABA",
        gender: "Femenino",
        balance: -15000.00
    },
    {
        id: "58",
        name: "Mundo Niño Tandil",
        cuit: "30-71443311-2",
        phone: "+5492494556677",
        email: "mundonino@tandil.com.ar",
        address: "9 de Julio 600, Tandil",
        gender: "Empresa",
        balance: -88000.00
    },
    {
        id: "59",
        name: "Ropa de Trabajo El Fuerte",
        cuit: "30-55331122-9",
        phone: "+5493514882211",
        email: "elfuerteindu@gmail.com",
        address: "Sabattini 2500, Córdoba",
        gender: "Empresa",
        balance: 0
    },
    {
        id: "60",
        name: "Showroom Belgrano R",
        cuit: "27-25443388-1",
        phone: "+5491122556644",
        email: "belgranorshow@gmail.com",
        address: "Echeverría 3000, CABA",
        gender: "Femenino",
        notes: "Cliente muy exigente con el packaging.",
        balance: 14500.00
    },
    {
        id: "61",
        name: "Distribuidora Santa Fe",
        cuit: "30-71554422-0",
        phone: "+5493424556699",
        email: "distrisantafe@gmail.com",
        address: "Facundo Zuviría 4500, Santa Fe",
        gender: "Empresa",
        balance: -320000.00
    },
    {
        id: "62",
        name: "Boutique La Coqueta",
        cuit: "27-22112233-4",
        phone: "+5493874221155",
        email: "lacoqueta@gmail.com",
        address: "Balcarce 200, Salta",
        gender: "Femenino",
        balance: 0
    },
    {
        id: "63",
        name: "Indumentaria Masculina J.B.",
        cuit: "20-22441155-9",
        phone: "+5492614558833",
        email: "jbmasculino@gmail.com",
        address: "Espejo 150, Mendoza",
        gender: "Masculino",
        balance: -12000.00
    },
    {
        id: "64",
        name: "Textil del Estero",
        cuit: "30-66441199-5",
        phone: "+5493854556622",
        email: "textilestero@gmail.com",
        address: "Independencia 300, Santiago del Estero",
        gender: "Empresa",
        balance: -95000.00
    },
    {
        id: "65",
        name: "Gisela Modas",
        cuit: "27-31554422-1",
        phone: "+5493415588441",
        email: "gisela_modas@hotmail.com",
        address: "San Martín 1200, Rosario",
        gender: "Femenino",
        notes: "Paga siempre los viernes por transferencia.",
        balance: 0
    },
    {
        id: "66",
        name: "H&M Mayorista (No oficial)",
        cuit: "30-71884422-7",
        phone: "+5491145566221",
        email: "hm_mayorista@gmail.com",
        address: "Paso 450, CABA",
        gender: "Empresa",
        balance: -450000.00
    },
    {
        id: "67",
        name: "Sport Center San Luis",
        cuit: "30-55442277-1",
        phone: "+5492664553311",
        email: "sportcenter@sl.com.ar",
        address: "Vía del Peregrino 1200, San Luis",
        gender: "Empresa",
        balance: -21000.00
    },
    {
        id: "68",
        name: "Mía Victoria",
        cuit: "27-28441155-4",
        phone: "+5491155664477",
        email: "miavictoria@gmail.com",
        address: "Av. Maipú 2200, Olivos",
        gender: "Femenino",
        balance: 0
    },
    {
        id: "69",
        name: "Distribuidora del Litoral",
        cuit: "30-71442255-8",
        phone: "+5493794551122",
        email: "litoraldistri@gmail.com",
        address: "Ferré 1800, Corrientes",
        gender: "Empresa",
        balance: -890000.00
    },
    {
        id: "70",
        name: "Patio Olmos Local 42",
        cuit: "33-44556677-1",
        phone: "+5493514221199",
        email: "local42olmos@gmail.com",
        address: "Vélez Sarsfield 361, Córdoba",
        gender: "Empresa",
        notes: "Entregar solo de 10 a 12 hs por descarga de shopping.",
        balance: -15000.00
    },
    {
        id: "71",
        name: "Sra. Graciela Lopez",
        cuit: "27-11223344-5",
        phone: "+5492615544889",
        email: "graciela_l@gmail.com",
        address: "Boulogne Sur Mer 1200, Mendoza",
        gender: "Femenino",
        balance: 5500.00
    },
    {
        id: "72",
        name: "Todo Jean Catamarca",
        cuit: "30-71225544-3",
        phone: "+5493834225566",
        email: "todojeancat@gmail.com",
        address: "República 450, Catamarca",
        gender: "Empresa",
        balance: -45000.00
    },
    {
        id: "73",
        name: "Valentina Showroom",
        cuit: "27-36441122-1",
        phone: "+5491144558899",
        email: "valentinashow@gmail.com",
        address: "Av. Meeks 200, Lomas de Zamora",
        gender: "Femenino",
        balance: 0
    },
    {
        id: "74",
        name: "Textil Pergamino",
        cuit: "30-55448822-1",
        phone: "+5492477455667",
        email: "textilpergamino@gmail.com",
        address: "Av. de Mayo 800, Pergamino",
        gender: "Empresa",
        balance: -112000.00
    },
    {
        id: "75",
        name: "Distribuidora San Juan",
        cuit: "30-71448822-5",
        phone: "+5492644225588",
        email: "sjdistribuidora@gmail.com",
        address: "Paula A. de Sarmiento 300, San Juan",
        gender: "Empresa",
        notes: "Mandar por Expreso Malargüe.",
        balance: -280000.00
    },
    {
        id: "76",
        name: "Daniela Boutique",
        cuit: "27-24556611-3",
        phone: "+5493414552211",
        email: "danielaboutique@rosario.com",
        address: "Cordoba 1800, Rosario",
        gender: "Femenino",
        balance: 0
    },
    {
        id: "77",
        name: "Hombres de Hoy",
        cuit: "20-28445511-2",
        phone: "+5491133221155",
        email: "hombresdehoy@gmail.com",
        address: "Av. Santa Fe 3400, CABA",
        gender: "Masculino",
        balance: -34000.00
    },
    {
        id: "78",
        name: "Textil Rio Cuarto",
        cuit: "30-71665544-2",
        phone: "+5493584556622",
        email: "textilrcuarto@gmail.com",
        address: "Constitución 600, Río Cuarto",
        gender: "Empresa",
        balance: -156000.00
    },
    {
        id: "79",
        name: "Marta Ropa Infantil",
        cuit: "27-14552211-9",
        phone: "+5492215544332",
        email: "marta_infantil@gmail.com",
        address: "Calle 48 550, La Plata",
        gender: "Femenino",
        balance: 0
    },
    {
        id: "80",
        name: "Showroom Nordelta",
        cuit: "27-31445588-4",
        phone: "+5491122339988",
        email: "nordeltashow@gmail.com",
        address: "Av. de los Lagos 100, Nordelta",
        gender: "Femenino",
        notes: "Cliente VIP. Entrega prioritaria.",
        balance: 42000.00
    },
    {
        id: "81",
        name: "Distribuidora Sur",
        cuit: "30-55442200-1",
        phone: "+5492994556633",
        email: "distrisur@neuquen.com",
        address: "Perticone 1200, Neuquén",
        gender: "Empresa",
        balance: -1250000.00
    },
    {
        id: "82",
        name: "Boutique Glam",
        cuit: "23-31445566-4",
        phone: "+5493814556633",
        email: "boutiqueglam@gmail.com",
        address: "25 de Mayo 300, San Miguel de Tucumán",
        gender: "Femenino",
        balance: 0
    },
    {
        id: "83",
        name: "Ropa Masculina El Galpón",
        cuit: "30-71884455-1",
        phone: "+5491133441122",
        email: "elgalponindu@gmail.com",
        address: "Av. Warnes 1200, CABA",
        gender: "Empresa",
        balance: -88000.00
    },
    {
        id: "84",
        name: "Ventas Misiones",
        cuit: "30-66442288-3",
        phone: "+5493764552211",
        email: "ventasmisiones@gmail.com",
        address: "Bolívar 1500, Posadas",
        gender: "Empresa",
        balance: -43000.00
    },
    {
        id: "85",
        name: "Carolina Herrera (Revendedora)",
        cuit: "27-22445511-0",
        phone: "+5492615566442",
        email: "caro_revendedora@gmail.com",
        address: "Sarmiento 400, Mendoza",
        gender: "Femenino",
        notes: "Paga contra entrega.",
        balance: 0
    },
    {
        id: "86",
        name: "Moda Hombre Rosario",
        cuit: "20-31445566-7",
        phone: "+5493416655441",
        email: "modahombreros@gmail.com",
        address: "Mitre 700, Rosario",
        gender: "Masculino",
        balance: -25000.00
    },
    {
        id: "87",
        name: "Indumentaria Zapala",
        cuit: "30-71442299-1",
        phone: "+5492942455667",
        email: "zapala_indu@gmail.com",
        address: "Av. San Martín 450, Zapala, Neuquén",
        gender: "Empresa",
        balance: -12000.00
    },
    {
        id: "88",
        name: "Estilo Urbano Salta",
        cuit: "27-33441155-2",
        phone: "+5493874223366",
        email: "estilourbanosalta@gmail.com",
        address: "Alvarado 500, Salta",
        gender: "Femenino",
        balance: 0
    },
    {
        id: "89",
        name: "Distribuidora El Chaco",
        cuit: "30-55443322-7",
        phone: "+5493624556688",
        email: "elchacodist@gmail.com",
        address: "9 de Julio 300, Resistencia",
        gender: "Empresa",
        balance: -450000.00
    },
    {
        id: "90",
        name: "Boutique de la Plaza",
        cuit: "27-25114422-9",
        phone: "+5492234221155",
        email: "boutiqueplaza@gmail.com",
        address: "Hipólito Yrigoyen 1600, Mar del Plata",
        gender: "Femenino",
        notes: "No mandar facturas por mail, solo papel.",
        balance: -18000.00
    },
    {
        id: "91",
        name: "Gimnasio & Ropa",
        cuit: "30-71883311-4",
        phone: "+5491155662288",
        email: "gimnasiostyle@gmail.com",
        address: "Av. Congreso 2400, CABA",
        gender: "Empresa",
        balance: 15000.00
    },
    {
        id: "92",
        name: "Ropa Infantil Burbujas",
        cuit: "27-31442277-3",
        phone: "+5493514556688",
        email: "burbujas_cba@gmail.com",
        address: "Rivadavia 150, Córdoba",
        gender: "Femenino",
        balance: -34000.00
    },
    {
        id: "93",
        name: "Ventas por Mayor Liniers",
        cuit: "30-66551122-1",
        phone: "+5491144228833",
        email: "liniersmayor@gmail.com",
        address: "Ramón Falcón 7000, CABA",
        gender: "Empresa",
        balance: 0
    },
    {
        id: "94",
        name: "Sergio Indumentaria",
        cuit: "20-17445588-3",
        phone: "+5492614551122",
        email: "sergio_indu@gmail.com",
        address: "Av. España 1100, Mendoza",
        gender: "Masculino",
        balance: -5600.00
    },
    {
        id: "95",
        name: "Textil San Luis S.R.L.",
        cuit: "30-71445522-8",
        phone: "+5492664221155",
        email: "textilsanluis@gmail.com",
        address: "Illia 300, San Luis",
        gender: "Empresa",
        notes: "Cliente histórico. Sin límites de crédito.",
        balance: -210000.00
    },
    {
        id: "96",
        name: "Boutique Dreams",
        cuit: "27-34556611-9",
        phone: "+5493412233884",
        email: "dreamsrosario@gmail.com",
        address: "Urquiza 2100, Rosario",
        gender: "Femenino",
        balance: 0
    },
    {
        id: "97",
        name: "Distribuidora del Oeste",
        cuit: "30-55449911-2",
        phone: "+5491166774433",
        email: "distrioeste@gmail.com",
        address: "Av. Gaona 3500, Haedo",
        gender: "Empresa",
        balance: -145000.00
    },
    {
        id: "98",
        name: "Calzados y Ropa Juan",
        cuit: "20-25441188-7",
        phone: "+5492214553322",
        email: "juan_calzados@gmail.com",
        address: "Calle 7 800, La Plata",
        gender: "Masculino",
        balance: -29000.00
    },
    {
        id: "99",
        name: "Mendoza Store Online",
        cuit: "30-71882255-4",
        phone: "+5492613344556",
        email: "mendozastore@gmail.com",
        address: "Garibaldi 150, Mendoza",
        gender: "Empresa",
        balance: 8900.00
    },
    {
        id: "100",
        name: "La Boutique de Carmen",
        cuit: "27-12445588-1",
        phone: "+5493814556622",
        email: "carmenboutique@gmail.com",
        address: "Laprida 400, San Miguel de Tucumán",
        gender: "Femenino",
        notes: "Mandar por Expreso La Sevillanita.",
        balance: 0
    },
    {
        id: "101",
        name: "Tienda de Ropa Joven",
        cuit: "30-66554488-9",
        phone: "+5491144551122",
        email: "ropajoven@gmail.com",
        address: "Cuenca 2800, CABA",
        gender: "Empresa",
        balance: -340000.00
    },
    {
        id: "102",
        name: "Lucas Distribuciones",
        cuit: "20-33441122-1",
        phone: "+5493516677112",
        email: "lucasdist@gmail.com",
        address: "Av. Fuerza Aérea 2000, Córdoba",
        gender: "Masculino",
        balance: -56000.00
    },
    {
        id: "103",
        name: "Moda y Estilo Formosa",
        cuit: "27-31443322-8",
        phone: "+5493704221155",
        email: "modaformosa@gmail.com",
        address: "Rivadavia 600, Formosa",
        gender: "Femenino",
        balance: 0
    },
    {
        id: "104",
        name: "Distribuidora San Pedro",
        cuit: "30-71442211-0",
        phone: "+5493884556677",
        email: "sanpedrodist@gmail.com",
        address: "Av. 25 de Mayo 100, San Pedro de Jujuy",
        gender: "Empresa",
        balance: -125000.00
    },
    {
        id: "105",
        name: "Showroom Las Gatas",
        cuit: "27-28445533-2",
        phone: "+5491144889955",
        email: "lasgatasshow@gmail.com",
        address: "Thames 1200, CABA",
        gender: "Femenino",
        notes: "No tiene CBU cargado para devoluciones.",
        balance: 1200.00
    }
];