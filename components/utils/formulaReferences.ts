import type { CellPosition } from '@/store/useWexelStore';
export const REFERENCE_COLORS = ['#2563eb', '#db2777', '#d97706', '#7c3aed', '#0891b2', '#16a34a'];
export interface FormulaReference {
    start: number;
    end: number;
    text: string;
    color: string;
    from: CellPosition;
    to: CellPosition;
}
function position(value: string): CellPosition {
    const match = value.replaceAll('$', '').match(/^([A-Z]+)([1-9]\d*)$/i)!;
    let col = 0;
    for (const letter of match[1].toUpperCase())
        col = col * 26 + letter.charCodeAt(0) - 64;
    return { row: Number(match[2]) - 1, col: col - 1 };
}
export function formulaReferences(value: string): FormulaReference[] {
    if (!value.startsWith('='))
        return [];
    const tokens = /"(?:[^"]|"")*"|(?<![\w.])\$?[A-Z]+\$?[1-9]\d*(?:\s*:\s*\$?[A-Z]+\$?[1-9]\d*)?(?![\w.(])/gi;
    const colors = new Map<string, string>(), references: FormulaReference[] = [];
    for (const match of value.matchAll(tokens)) {
        if (match[0].startsWith('"'))
            continue;
        const [a, b] = match[0].split(/\s*:\s*/);
        const from = position(a), to = position(b ?? a);
        const key = [Math.min(from.row, to.row), Math.min(from.col, to.col), Math.max(from.row, to.row), Math.max(from.col, to.col)].join(':');
        if (!colors.has(key))
            colors.set(key, REFERENCE_COLORS[colors.size % REFERENCE_COLORS.length]);
        references.push({ start: match.index, end: match.index + match[0].length, text: match[0], color: colors.get(key)!, from, to });
    }
    return references;
}
export function referenceAt(references: FormulaReference[], row: number, col: number) {
    return references.findLast(ref => row >= Math.min(ref.from.row, ref.to.row) && row <= Math.max(ref.from.row, ref.to.row) && col >= Math.min(ref.from.col, ref.to.col) && col <= Math.max(ref.from.col, ref.to.col));
}
