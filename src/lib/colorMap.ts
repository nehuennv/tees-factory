/**
 * Resolución inteligente de color: nombre (es) → HEX.
 *
 * Lectura silenciosa: dado el nombre de un color cargado por el admin
 * (ej. "Verde Inglés", "Azul Fracia", "Rosa Bebé"), devuelve el HEX más
 * aproximado para pintar el swatch en admin y en el detalle del cliente.
 *
 * Estrategia (de más preciso a más tolerante):
 *  1. Match exacto en diccionario.
 *  2. Fuzzy casi-exacto (typos) por distancia de Levenshtein.
 *  3. Contención multipalabra ("azul marino" dentro de "azul marino noche").
 *  4. Color base + modificadores (claro/oscuro/gastado/bebé...).
 *  5. Contención de una palabra.
 *  6. Fuzzy laxo.
 *  7. Fallback neutro.
 */
import type { CSSProperties } from 'react';

// ── Normalización ──────────────────────────────────────────────
const normalize = (s: string): string =>
    s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // saca acentos
        .replace(/[%]/g, ' ')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

// ── Diccionario de colores nombrados (es textil) ───────────────
const RAW_DICT: Record<string, string> = {
    // Neutros / grises
    'negro': '#1a1a1a',
    'negro melange': '#2d2d2d',
    'blanco': '#ffffff',
    'blanco optico': '#fbfbff',
    'hueso': '#f0ead6',
    'marfil': '#fffff0',
    'crema': '#f5f0e8',
    'gris': '#9e9e9e',
    'gris claro': '#cfcfcf',
    'gris oscuro': '#4a4a4a',
    'gris perla': '#d6d6d6',
    'gris topo': '#8b8589',
    'gris melange': '#bdbdbd',
    'plomo': '#708090',
    'plata': '#c0c0c0',
    'classic grey': '#9e9e9e',
    'melange': '#d0d0d0',
    'melange 5': '#e8e8e8',
    'melange 25': '#c0c0c0',
    'stone wash': '#8b8680',
    'stone': '#8b8680',

    // Marrones / tierra
    'marron': '#5c3317',
    'cafe': '#4b3621',
    'chocolate': '#5c3317',
    'camel': '#c19a6b',
    'arena': '#c2b280',
    'beige': '#d4c5a9',
    'tierra': '#a0522d',
    'tabaco': '#7a4b2b',
    'vison': '#b0a99f',
    'nude': '#e3bc9a',
    'caramelo': '#c68e3f',
    'conac': '#7b3f00',
    'oxido': '#8a3324',
    'teja': '#cb6843',
    'ladrillo': '#a8412f',

    // Rojos / rosas
    'rojo': '#dc143c',
    'rojo oscuro': '#8b0000',
    'bordo': '#6d0026',
    'borgona': '#6d0026',
    'vino': '#722f37',
    'coral': '#ff6b6b',
    'salmon': '#fa8072',
    'rosa': '#f9a8c0',
    'rosa viejo': '#c08081',
    'rosa palo': '#ddb5b0',
    'rosa chicle': '#ff66cc',
    'rosa bebe': '#f7c5d0',
    'fucsia': '#e5007d',
    'magenta': '#d4007a',
    'frambuesa': '#b3315b',

    // Naranjas / amarillos
    'naranja': '#ff8c00',
    'mandarina': '#f28500',
    'durazno': '#ffcba4',
    'ocre': '#cc7722',
    'mostaza': '#d4ac0d',
    'mostaza dulce': '#d4ac0d',
    'amarillo': '#ffd700',
    'amarillo suave': '#f5deb3',
    'dorado': '#d4af37',
    'oro': '#d4af37',

    // Verdes
    'verde': '#2e7d32',
    'verde claro': '#7cb342',
    'verde oscuro': '#1b4332',
    'verde ingles': '#1b4332',
    'verde benetton': '#2e7d32',
    'verde oliva': '#708238',
    'oliva': '#708238',
    'verde militar': '#4b5320',
    'verde salvia': '#8f9779',
    'salvia': '#8f9779',
    'verde pistacho': '#93c572',
    'pistacho': '#93c572',
    'verde manzana': '#8db600',
    'verde agua': '#79c7c5',
    'verde menta': '#98ff98',
    'menta': '#98ff98',
    'lima': '#bfff00',
    'esmeralda': '#009b77',

    // Azules / celestes
    'azul': '#1e3a8a',
    'azul francia': '#002395',
    'azul oscuro': '#003087',
    'azul marino': '#001f54',
    'marino': '#001f54',
    'azul noche': '#0a1931',
    'azul gastado': '#6b8fa3',
    'azul piedra': '#6b8fa3',
    'azul bebe': '#a7c7e7',
    'celeste': '#87ceeb',
    'cielo': '#87ceeb',
    'turquesa': '#35c4b8',
    'aqua': '#3fd5cd',
    'cian': '#00bcd4',
    'petroleo': '#013f50',
    'azul petroleo': '#013f50',
    'denim': '#6b8fa3',
    'jean': '#6b8fa3',
    'indigo': '#3f51b5',

    // Violetas
    'violeta': '#7b2d8b',
    'lila': '#c8a2c8',
    'lavanda': '#cdb4e0',
    'purpura': '#6a0dad',
    'morado': '#6a0dad',
    'uva': '#6f2da8',
    'berenjena': '#4c2c69',
};

// Diccionario normalizado (claves ya normalizadas).
const COLOR_DICT: Record<string, string> = Object.fromEntries(
    Object.entries(RAW_DICT).map(([k, v]) => [normalize(k), v])
);
const DICT_KEYS = Object.keys(COLOR_DICT);

// Colores base de una palabra para el heurístico base + modificador.
const BASE_COLORS: Record<string, string> = COLOR_DICT;

const FALLBACK = '#b8b8b8';

// ── Helpers de color (HEX ↔ HSL) ───────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const num = parseInt(h, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
    const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            default: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
    h /= 360; s /= 100; l /= 100;
    const hue = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    let r: number, g: number, b: number;
    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue(p, q, h + 1 / 3);
        g = hue(p, q, h);
        b = hue(p, q, h - 1 / 3);
    }
    return rgbToHex(r * 255, g * 255, b * 255);
}

function adjust(hex: string, { dl = 0, ds = 0 }: { dl?: number; ds?: number }): string {
    const [r, g, b] = hexToRgb(hex);
    let [h, s, l] = rgbToHsl(r, g, b);
    s = Math.max(0, Math.min(100, s + ds));
    l = Math.max(0, Math.min(100, l + dl));
    return hslToHex(h, s, l);
}

// ── Modificadores ──────────────────────────────────────────────
const MODIFIERS: Record<string, { dl?: number; ds?: number }> = {
    claro: { dl: 18 }, clara: { dl: 18 }, light: { dl: 18 },
    suave: { dl: 14, ds: -10 }, tenue: { dl: 16, ds: -12 }, pastel: { dl: 22, ds: -22 },
    bebe: { dl: 24, ds: -18 },
    oscuro: { dl: -20 }, oscura: { dl: -20 }, dark: { dl: -20 }, profundo: { dl: -24 },
    intenso: { ds: 25 }, vivo: { ds: 25, dl: 4 }, electrico: { ds: 35, dl: 5 },
    neon: { ds: 45, dl: 8 }, fluor: { ds: 45, dl: 8 }, flúor: { ds: 45, dl: 8 },
    gastado: { ds: -35, dl: 8 }, desgastado: { ds: -35, dl: 8 }, lavado: { ds: -30, dl: 10 },
    destenido: { ds: -38, dl: 12 }, vintage: { ds: -30, dl: 6 }, wash: { ds: -32, dl: 8 },
    melange: { ds: -45, dl: 12 }, jaspe: { ds: -45, dl: 12 },
};

// ── Levenshtein ────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const prev = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
        let diag = prev[0];
        prev[0] = i;
        for (let j = 1; j <= n; j++) {
            const tmp = prev[j];
            prev[j] = Math.min(
                prev[j] + 1,
                prev[j - 1] + 1,
                diag + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
            diag = tmp;
        }
    }
    return prev[n];
}

const similarity = (a: string, b: string): number => {
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 1 : 1 - levenshtein(a, b) / maxLen;
};

// ── Resolver principal ─────────────────────────────────────────
const cache = new Map<string, string>();

export function resolveColorHex(name?: string | null): string {
    if (!name) return FALLBACK;
    const n = normalize(name);
    if (!n) return FALLBACK;
    const cached = cache.get(n);
    if (cached) return cached;

    const result = compute(n);
    cache.set(n, result);
    return result;
}

function compute(n: string): string {
    // 1. Exacto
    if (COLOR_DICT[n]) return COLOR_DICT[n];

    const tokens = n.split(' ');

    // 2. Fuzzy casi-exacto (typos): "azul fracia" → "azul francia"
    let bestKey = '';
    let bestSim = 0;
    for (const key of DICT_KEYS) {
        const sim = similarity(n, key);
        if (sim > bestSim) { bestSim = sim; bestKey = key; }
    }
    if (bestSim >= 0.86) return COLOR_DICT[bestKey];

    // 3. Contención multipalabra: clave con espacio contenida en el input.
    let multiKey = '';
    for (const key of DICT_KEYS) {
        if (!key.includes(' ')) continue;
        if (n.includes(key) && key.length > multiKey.length) multiKey = key;
    }
    if (multiKey) return COLOR_DICT[multiKey];

    // 4. Color base + modificadores
    let baseHex = '';
    for (const t of tokens) {
        if (BASE_COLORS[t]) { baseHex = BASE_COLORS[t]; break; }
    }
    if (baseHex) {
        let acc = { dl: 0, ds: 0 };
        for (const t of tokens) {
            const mod = MODIFIERS[t];
            if (mod) { acc = { dl: acc.dl + (mod.dl ?? 0), ds: acc.ds + (mod.ds ?? 0) }; }
        }
        return acc.dl === 0 && acc.ds === 0 ? baseHex : adjust(baseHex, acc);
    }

    // 5. Contención de una palabra (cualquier clave dentro del input o token = clave)
    for (const t of tokens) {
        if (COLOR_DICT[t]) return COLOR_DICT[t];
    }
    for (const key of DICT_KEYS) {
        if (n.includes(key)) return COLOR_DICT[key];
    }

    // 6. Fuzzy laxo
    if (bestSim >= 0.7) return COLOR_DICT[bestKey];
    // por token
    for (const t of tokens) {
        let tKey = '', tSim = 0;
        for (const key of DICT_KEYS) {
            const sim = similarity(t, key);
            if (sim > tSim) { tSim = sim; tKey = key; }
        }
        if (tSim >= 0.78) return COLOR_DICT[tKey];
    }

    // 7. Fallback
    return FALLBACK;
}

/** True si el color es claro (necesita borde para verse sobre fondo blanco). */
export function isLightColor(hex: string): boolean {
    const [r, g, b] = hexToRgb(hex);
    // luminancia relativa percibida
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.82;
}

/** Estilo listo para un swatch: backgroundColor + borde adaptativo. */
export function colorSwatchStyle(name?: string | null): CSSProperties {
    const hex = resolveColorHex(name);
    return {
        backgroundColor: hex,
        border: isLightColor(hex) ? '1.5px solid #d4d4d8' : '1.5px solid rgba(0,0,0,0.08)',
    };
}
