import data from "./data/norma-catalog.json";
import { canonicalUnit, calculateItemTotal, type EstimateItem, type MeasurementKind } from "../../store/useMetradoStore";

export interface NormaEntry {
  id: string; code: string; title: string; parentId: string | null; level: number;
  scope: string; kind: "chapter" | "item"; unit: string; options: string[];
  indexPages: number[]; bodyPages: number[]; excerpt: string; measurement: string;
  ambiguousCode: boolean; references: string[]; measurementFrom?: string; unitFrom?: string;
  editorialNote?: string; inheritedFrom?: string;
  measurementPages?: number[];
  ownUnits?: string[]; derivedKind?: "remission" | "own";
}
export const NORMA_SOURCE = data.source;
const printed = data.entries as unknown as NormaEntry[];
// HU.1 explicitly remits to OE.1 (PDF pp.107–108). These are application extensions,
// retaining their original OE reference instead of pretending HU subcodes are printed there.
const huPreliminaries = printed.filter(e => e.scope === "OE.1" && e.code !== "OE.1").map(e => ({
  ...e, id: "HU.1:remision:" + e.id, code: e.code.replace(/^OE\.1/, "HU.1"),
  scope: "HU.1", parentId: e.parentId === "OE.1" ? "HU.1" : "HU.1:remision:" + e.parentId,
  inheritedFrom: e.id, ambiguousCode: e.ambiguousCode,
  derivedKind: "remission" as const,
}));
const baseEntries: NormaEntry[] = [...printed.map(e => e.id === "HU.1" ? { ...e, kind: "chapter" as const } : e), ...huPreliminaries];
const ownMeasurements: NormaEntry[] = baseEntries.filter(e => e.kind === "chapter" && e.ownUnits?.length).map(e => ({
  ...e, id: "app:own:" + e.id, code: e.code + ".BASE", parentId: e.id, level: e.level + 1,
  title: e.title + " · METRADO PROPIO", kind: "item", options: e.ownUnits!, unit: e.ownUnits!.length === 1 ? e.ownUnits![0] : "",
  inheritedFrom: e.inheritedFrom ?? e.id, derivedKind: "own", ownUnits: [],
}));
export const NORMA_ENTRIES: NormaEntry[] = [...baseEntries, ...ownMeasurements];
export const NORMA_BY_ID = new Map(NORMA_ENTRIES.map(e => [e.id, e]));
export const NORMA_SECTIONS = printed.filter(e => !e.parentId).map(e => ({ code: e.code, title: e.title, count: NORMA_ENTRIES.filter(x => x.scope === e.code).length }));
export const normaUnitKind = (unit: string): MeasurementKind => ({ m: "length", km: "length", m2: "area", m3: "volume", kg: "weight" } as Record<string, MeasurementKind>)[canonicalUnit(unit)] ?? "units";
export const itemHasQuantity = (item: EstimateItem) => item.measurements.some(line => !line.pending) || item.steelLines.length > 0;

/** One editable row per measurable item; never insert again after the user deletes it. */
export function withNormaDetails(items: EstimateItem[]): EstimateItem[] {
  let changed = false;
  const result = items.map(item => {
    if (!item.norma || item.kind !== "item" || item.detailTemplateVersion) return item;
    changed = true;
    return { ...item, detailTemplateVersion: 1, measurements: item.measurements.length || item.steelLines.length ? item.measurements : [{
      id: "detail:" + item.id, description: "", unit: item.unit, kind: normaUnitKind(item.unit),
      pending: true, similarElements: 1, length: 0, width: 0, height: 0,
      repetitions: 1, sign: 1 as const, manualQuantity: 0,
      expressions: { length: "", width: "", height: "", manualQuantity: "" },
    }] };
  });
  return changed ? result : items;
}

export function createNormaItems(scopes: string[], existing: EstimateItem[] = []): EstimateItem[] {
  const selected = NORMA_ENTRIES.filter(e => scopes.includes(e.scope));
  const ids = new Map(existing.filter(e => e.norma).map(e => [e.norma!.id, e.id]));
  for (const entry of selected) if (!ids.has(entry.id)) ids.set(entry.id, "norma:" + entry.id);
  const present = new Set(existing.flatMap(e => e.norma ? [e.norma.id] : []));
  const children = new Map<string | null, NormaEntry[]>();
  for (const entry of selected) children.set(entry.parentId, [...(children.get(entry.parentId) ?? []), entry]);
  const result: EstimateItem[] = [];
  const visit = (parent: string | null) => {
    const siblings = (children.get(parent) ?? []).sort((a,b) => (!parent ? NORMA_SECTIONS.findIndex(s=>s.code===a.code)-NORMA_SECTIONS.findIndex(s=>s.code===b.code) : a.code.localeCompare(b.code, "es", { numeric: true })) || a.id.localeCompare(b.id, "es", { numeric: true }));
    for (const entry of siblings) {
      if (!present.has(entry.id)) result.push({
        id: ids.get(entry.id)!, parentId: entry.parentId ? ids.get(entry.parentId) ?? null : null,
        code: entry.code, description: entry.title.toUpperCase(), kind: entry.kind, unit: entry.unit,
        order: existing.length + result.length, measurements: [], steelLines: [],
        norma: { id: entry.id, code: entry.inheritedFrom ? NORMA_BY_ID.get(entry.inheritedFrom)!.code : entry.code,
          level: entry.level, pages: [...new Set([...(entry.bodyPages.length ? entry.bodyPages : entry.indexPages), ...(entry.measurementPages ?? [])])].sort((a,b)=>a-b),
          allowedUnits: entry.options, ...(entry.inheritedFrom ? { inheritedFrom: entry.inheritedFrom } : {}) },
      });
      visit(entry.id);
    }
  };
  visit(null);
  return withNormaDetails(result);
}

export interface NormaIssue { itemId: string; code: string; title: string; kind: "pending" | "error" | "review"; message: string }
export function reviewNormaItems(items: EstimateItem[]): NormaIssue[] {
  const issues: NormaIssue[] = [];
  for (const item of items) {
    const add = (kind: NormaIssue["kind"], message: string) => issues.push({ itemId: item.id, code: item.code, title: item.description, kind, message });
    const entry = item.norma ? NORMA_BY_ID.get(item.norma.id) : undefined;
    if (entry?.ambiguousCode) add("review", "El PDF repite este código. Revisa la descripción y la referencia antes de emitir el expediente.");
    if (entry?.id === "OE.3.3.1") add("review", "El PDF expresa el umbral de huecos en cm²; confirma esa unidad con el responsable técnico antes de aplicarlo.");
    if (entry && item.code !== entry.code) add("review", "El código del proyecto difiere del catálogo. Se conserva la referencia normativa original para su trazabilidad.");
    if (item.norma?.inheritedFrom) add("review", "Desglose de la aplicación; consulta la referencia original. El subcódigo de trabajo no es un código adicional impreso en la norma.");
    if (item.kind !== "item") continue;
    if (!item.unit) add("pending", entry?.options.length ? "Selecciona una de las unidades admitidas para esta partida." : "Define la unidad y el alcance según el criterio de medición y el expediente técnico.");
    else if (entry?.options.length && !entry.options.includes(canonicalUnit(item.unit))) add("error", "La unidad no coincide con las unidades del apartado de referencia.");
    if (!itemHasQuantity(item)) add("pending", "Pendiente de metrar: todavía no tiene detalles ni cantidades.");
    else if (!item.support?.trim()) add("review", "Añade la referencia al plano, detalle o especificación que sustenta la medición.");
    for (const line of item.measurements) if (canonicalUnit(line.unit) !== canonicalUnit(item.unit)) add("error", "Hay un detalle con unidad diferente de la partida; no se suma a su total.");
    if (item.measurements.some(l => l.calculationError) || item.steelLines.some(l => l.calculationError) || !Number.isFinite(calculateItemTotal(item))) add("error", "Hay errores de cálculo que deben corregirse.");
    if (itemHasQuantity(item) && calculateItemTotal(item) < 0) add("review", "El total es negativo; revisa descuentos, vacíos y duplicidades.");
  }
  return issues;
}
