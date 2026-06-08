/**
 * Iniciales y color de avatar para personas/empresas.
 * Solo considera palabras que empiezan con letra o número (ignora "–", "&", etc.).
 */

const ALNUM = /[a-zA-ZÀ-ÿ0-9]/;

export function getInitials(name?: string): string {
    if (!name) return '?';
    const letters = name
        .split(/\s+/)
        .map((w) => {
            const m = w.match(ALNUM); // primer caracter alfanumérico de la palabra
            return m ? m[0] : '';
        })
        .filter(Boolean);
    const initials = (letters[0] ?? '') + (letters[1] ?? '');
    return initials.toUpperCase() || '?';
}

const AVATAR_COLORS = ['#42318B', '#C44A87', '#2DBDD0', '#EFBC4E', '#10b981', '#6366f1'];

export function getAvatarColor(name?: string): string {
    if (!name) return AVATAR_COLORS[0];
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
