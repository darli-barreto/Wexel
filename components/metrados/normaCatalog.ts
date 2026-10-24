import data from "./data/norma-catalog.json";
import { canonicalUnit, calculateItemTotal, type EstimateItem, type MeasurementKind } from "../../store/useMetradoStore";
import { normaDetailLabel, nextDetailOrdinal } from './normaDetailLabels';
import { renumberAfterDelete } from './renumberAfterDelete';
import { measurementGuidance } from './measurementGuidance';
import { emptyCrossSections } from './crossSections';
import { withSurplusBalance } from './surplusBalance';
import { withSobrecimientoFormwork } from './sobrecimientoFormwork';

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
const catalogueChildren = new Map<string, NormaEntry[]>();
for (const entry of NORMA_ENTRIES) if (entry.parentId) {
  const children = catalogueChildren.get(entry.parentId) ?? [];
  children.push(entry); catalogueChildren.set(entry.parentId, children);
}
export const NORMA_SECTIONS = printed.filter(e => !e.parentId).map(e => ({ code: e.code, title: e.title, count: NORMA_ENTRIES.filter(x => x.scope === e.code).length }));
export const normaUnitKind = (unit: string): MeasurementKind => ({ m: "length", km: "length", m2: "area", m3: "volume", kg: "weight" } as Record<string, MeasurementKind>)[canonicalUnit(unit)] ?? "units";
const defaultNormaUnit = (item: Pick<EstimateItem, 'norma' | 'unit'>) => canonicalUnit(item.unit) || (item.norma?.code === 'OE.1.1.1.7' ? 'm' : '');
export const itemHasQuantity = (item: EstimateItem) => item.measurements.some(line => line.presentation !== 'separator' && !line.pending) || item.steelLines.length > 0;

export function normaItemDetailLabel(item: EstimateItem, ordinal: number): string {
  const entry = item.norma ? NORMA_BY_ID.get(item.norma.id) : undefined;
  const ancestors: string[] = [];
  let parent = entry?.parentId ? NORMA_BY_ID.get(entry.parentId) : undefined;
  while (parent) { ancestors.push(parent.title); parent = parent.parentId ? NORMA_BY_ID.get(parent.parentId) : undefined; }
  return normaDetailLabel(entry?.title ?? item.description, ancestors, ordinal, item.unit);
}
export const nextNormaDetailLabel = (item: EstimateItem) => normaItemDetailLabel(item, nextDetailOrdinal(item, ordinal => normaItemDetailLabel(item, ordinal)));

/** Repair older saved deletions only where a known catalogue sibling is missing. */
export function repairNormaDeletionGaps(items: EstimateItem[], decoration = { prefix: '', suffix: '' }): EstimateItem[] {
  const present = new Set(items.flatMap(item => item.norma ? [item.norma.id] : []));
  const ghosts: EstimateItem[] = [];
  const clean = (code: string) => {
    if (decoration.prefix && code.startsWith(decoration.prefix)) code = code.slice(decoration.prefix.length);
    if (decoration.suffix && code.endsWith(decoration.suffix)) code = code.slice(0, -decoration.suffix.length);
    return code;
  };
  for (const parent of items) {
    const entry = parent.norma ? NORMA_BY_ID.get(parent.norma.id) : undefined;
    if (!entry) continue;
    const catalogue = (catalogueChildren.get(entry.id) ?? []).filter(child => child.code.startsWith(entry.code + '.') && /^\d+$/.test(child.code.slice(entry.code.length + 1)));
    if (!catalogue.some(child => !present.has(child.id))) continue;
    const siblings = items.filter(item => item.parentId === parent.id);
    if (!siblings.some(item => item.norma && catalogue.some(child => child.id === item.norma!.id))) continue;
    const first = catalogue.map(child => child.code.slice(entry.code.length + 1)).sort((a,b) => Number(a) - Number(b))[0];
    ghosts.push({ ...parent, id: `deleted-slot:${parent.id}`, parentId: parent.id, code: decoration.prefix + clean(parent.code) + '.' + first + decoration.suffix,
      order: Math.min(...siblings.map(item => item.order)) - 1, norma: undefined, detailVariant: undefined, measurements: [], steelLines: [] });
  }
  if (!ghosts.length) return items;
  const result = renumberAfterDelete([...items, ...ghosts], items, new Set(ghosts.map(item => item.id)), decoration);
  return result.every((item, index) => item === items[index]) ? items : result;
}

/** Seed two named blank details once. Preserve edits and intentional row deletions on upgrades. */
export function withNormaDetails(items: EstimateItem[]): EstimateItem[] {
  let changed = false;
  const result = items.map(original => {
    let item = original;
    if (item.kind === 'chapter' && item.norma?.code === 'OE.1.1.3.1' && !item.cleanupAreaTemplateVersion) {
      item = { ...item, cleanupAreaTemplateVersion: 1, measurements: [...item.measurements, ...[1, 2].map(ordinal => ({
        id: 'cleanup-area:' + item.id + ':' + ordinal, referenceOnly: true,
        description: `Área de intervención (referencia) · sector N-${ordinal}`, unit: 'm2', kind: 'area' as const,
        pending: true, similarElements: 1, length: 0, width: 0, height: 0, repetitions: 1, sign: 1 as const,
        expressions: { length: '', width: '', height: '', manualQuantity: '' },
      }))] };
      changed = true;
    }
    // Refresh only the original scaffolding labels, including HU remissions.
    // Keep user descriptions, quantities and intentionally deleted details intact.
    if (item.kind === 'item' && item.norma?.code === 'OE.1.1.3.1.2') {
      const measurements = item.measurements.map(line => {
        if (!line.id.startsWith('detail:' + item.id)) return line;
        const oldLabel = line.description.match(/^(?:Eliminación de maleza y arbustos de fácil extracción · paño|Área de limpieza · sector) N-(\d+)$/);
        const ordinal = oldLabel ? Number(oldLabel[1]) : !line.description.trim() ? Number(line.id.slice(('detail:' + item.id).length).replace(/^:/, '') || 1) : 0;
        return ordinal > 0 ? { ...line, description: normaItemDetailLabel(item, ordinal) } : line;
      });
      if (measurements.some((line, index) => line !== item.measurements[index])) { item = { ...item, measurements }; changed = true; }
    }
    if (item.norma?.code === 'OE.1.1.1.7' && !canonicalUnit(item.unit)) {
      // Keep an explicitly configured detail unit; otherwise default unconfigured fences to length.
      const configured = [...new Set(item.measurements.map(line => canonicalUnit(line.unit)).filter(Boolean))];
      const unit = configured.length === 1 ? configured[0] : defaultNormaUnit(item);
      item = { ...item, unit, measurements: item.measurements.map(line => canonicalUnit(line.unit) ? line : {
        ...line, unit, kind: normaUnitKind(unit), resultRaw: undefined, quantityOverride: undefined, calculationError: undefined,
      }) };
      changed = true;
    }
    if (!item.norma || item.kind !== "item" || (item.detailTemplateVersion ?? 0) >= 2) return item;
    changed = true;
    const seed = (ordinal: number) => ({
      ...(['OE.2.1.3','HU.2.1.3'].includes(item.norma?.code ?? '') ? { crossSections: emptyCrossSections() } : {}),
      id: "detail:" + item.id + (ordinal === 1 ? '' : ':' + ordinal), description: normaItemDetailLabel(item, ordinal), unit: item.unit, kind: normaUnitKind(item.unit),
      pending: true, similarElements: 1, length: 0, width: 0, height: 0,
      repetitions: 1, sign: 1 as const, manualQuantity: 0,
      expressions: { length: "", width: "", height: "", manualQuantity: "" },
    });
    let measurements = item.measurements;
    if (!item.detailTemplateVersion && !measurements.length && !item.steelLines.length) measurements = [seed(1), seed(2)];
    else if (item.detailTemplateVersion === 1 && measurements.some(line => line.id === 'detail:' + item.id)) {
      measurements = measurements.map(line => line.id === 'detail:' + item.id && !line.description.trim() ? { ...line, description: normaItemDetailLabel(item, 1) } : line);
      if (measurements.length === 1 && !item.steelLines.length) measurements = [...measurements, seed(2)];
    }
    return { ...item, detailTemplateVersion: 2, measurements };
  });
  return withSobrecimientoFormwork(withSurplusBalance(changed ? result : items));
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
        code: entry.code, description: entry.title.toUpperCase(), kind: entry.kind, unit: entry.unit || (entry.id === 'OE.1.1.1.7' || entry.inheritedFrom === 'OE.1.1.1.7' ? 'm' : ''),
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
    if (item.detailVariant) add("review", `Alternativa del proyecto en ${item.unit}; referencia de origen: ${item.detailVariant.reference?.code ?? item.detailVariant.sourceItemId}. Sustenta el alcance y la unidad en las especificaciones del proyecto.`);
    if (item.kind !== "item") {
      if (item.norma && (item.unit || item.measurements.some(line => line.presentation !== 'separator' && !line.referenceOnly))) add('review', 'Este título normativo agrupa partidas: revisa que su unidad y mediciones estén en las partidas hijas, sin duplicar el título.');
      continue;
    }
    const guidance = measurementGuidance(item);
    if (item.measurements.some(line => line.surplus && line.pending)) add('pending', 'Balance de excedentes pendiente: falta un volumen de origen o un factor. El total actual puede ser parcial; un origen sin medir no equivale a cero.');
    const incompleteGroups = new Set(item.measurements.filter(line => line.fillGroup?.role === 'excavation' && !line.pending).map(line => line.fillGroup!.id));
    if (item.measurements.some(line => line.fillGroup?.role === 'deduction' && line.pending && incompleteGroups.has(line.fillGroup.id))) add('pending', 'Hay un grupo de relleno con excavación medida y descuentos pendientes. Completa los que correspondan o elimina los que no existen; el total actual es parcial.');
    if (item.measurements.some(line => line.quantitySourceId && !item.measurements.some(source => source.id === line.quantitySourceId))) add('error', 'Un descuento de relleno perdió su excavación de referencia. Corrige su cantidad o elimina el detalle.');
    if (guidance.cleanup && !item.norma) add('review', 'Partida de limpieza personalizada: precisa si mide basura (m³), vegetación superficial (m²) u otro alcance del expediente. Contrasta su APU con el retiro para evitar duplicidades.');
    for (const line of item.measurements) if (line.swelling) {
      if (line.kind !== 'volume' || ['apu','natural','compacted'].includes(guidance.policy) || !Number.isFinite(line.swelling.factor) || line.swelling.factor < 1 || !line.swelling.support.trim() || line.swelling.basis !== 'inSitu') add('error', 'Revisa el esponjamiento: debe estar sustentado y corresponder al metrado. No se aplica al volumen natural del corte, al relleno compactado ni cuando está reservado al APU.');
      if (line.resultRaw || line.quantityOverride !== undefined) add('review', 'Un detalle con esponjamiento tiene resultado manual: comprueba si su fórmula ya incluye el factor y evita aplicarlo dos veces.');
    }
    if (!item.unit) add("pending", entry?.options.length ? "Selecciona una de las unidades admitidas para esta partida." : "Define la unidad y el alcance según el criterio de medición y el expediente técnico.");
    else if (entry?.options.length && !entry.options.includes(canonicalUnit(item.unit))) {
      if (item.adaptation?.reason.trim() && item.adaptation.scope.trim()) add("review", `Partida adaptada al proyecto: ${item.unit}. Referencia normativa: ${entry.options.join(" / ")}. Revisa el alcance y sustento registrados.`);
      else add("error", "La unidad no coincide con las unidades del apartado de referencia.");
    }
    if (!itemHasQuantity(item)) add("pending", "Pendiente de metrar: todavía no tiene detalles ni cantidades.");
    else if (!item.support?.trim()) add("review", "Añade la referencia al plano, detalle o especificación que sustenta la medición.");
    for (const line of item.measurements) if (line.presentation !== 'separator' && canonicalUnit(line.unit) !== canonicalUnit(item.unit)) add("error", "Hay un detalle con unidad diferente de la partida; no se suma a su total.");
    if (item.measurements.some(l => l.calculationError) || item.steelLines.some(l => l.calculationError) || !Number.isFinite(calculateItemTotal(item))) add("error", "Hay errores de cálculo que deben corregirse.");
    if (itemHasQuantity(item) && calculateItemTotal(item) < 0) add("review", "El total es negativo; revisa descuentos, vacíos y duplicidades.");
  }
  return issues;
}
