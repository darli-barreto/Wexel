"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { deferredStorage } from "./deferredStorage";
import { renumberAfterDelete } from '../components/metrados/renumberAfterDelete';
import type { WorkbookData } from "./useWexelStore";

export type MetradoView = "metrado" | "resumen" | "acero";
export type ItemKind = "chapter" | "item";
export type MeasurementKind = "length" | "area" | "volume" | "weight" | "units";
export type MetradoTableStyle = "color" | "blue" | "monochrome";

export interface MetradoHeader {
  title: string;
  project: string;
  owner: string;
  date: string;
  specialty: string;
  module: string;
  preparedBy: string;
  reviewedBy: string;
}

export interface MeasurementLine {
  formworkSource?: { itemId: string; lineId: string; face: 'sides' | 'ends'; manualFields?: string[] };
  surplus?: { source: 'excavation' | 'ownFill'; parentId: string | null; manual?: boolean; sourceItemIds?: string[] };
  columnSection?: { area: number; buriedHeight: number; areaExpression: string; heightExpression: string; support?: string; element?: 'column' | 'stripFooting' | 'planArea' };
  formulaInputs?: Array<{id:string;label:string;value:string}>;
  formulaTemplates?: Record<string,string>;
  formulaTemplateOverrides?: string[];
  inputLinks?: Record<string,{itemId:string;lineId:string;field:string}>;
  quantitySourceId?: string;
  fillGroup?: { id: string; type: 'footing' | 'gradeBeam' | 'stripFooting'; role: 'label' | 'excavation' | 'deduction' };
  crossSections?: { method: 'endAreas' | 'meanArea'; initialArea: number; finalArea: number; meanArea: number; expressions: { initialArea: string; finalArea: string; meanArea: string }; support: string };
  /** Presentation row: editable description only, excluded from quantities. */
  presentation?: 'separator';
  /** Geometric reference only; excluded from payable partida totals. */
  referenceOnly?: boolean;
  swelling?: { factor: number; support: string; basis: 'inSitu' };
  variantOrigin?: { itemId: string; index: number; measurement: Omit<MeasurementLine, 'variantOrigin'> };
  /** A template row remains unquantified until its required inputs are supplied. */
  pending?: boolean;
  id: string;
  description: string;
  unit: string;
  kind: MeasurementKind;
  similarElements: number;
  length: number;
  width: number;
  height: number;
  repetitions: number;
  sign: 1 | -1;
  manualQuantity?: number;
  expressions?: Partial<Record<"similarElements" | "length" | "width" | "height" | "repetitions" | "manualQuantity", string>>;
  resultRaw?: string;
  quantityOverride?: number;
  calculationError?: string;
}

export interface SteelLine {
  expressions?: Partial<Record<"similarElements" | "length" | "hooks" | "spliceTotal" | "quantity" | "kgPerMeter" | "totalLength", string>>;
  sourceRow?: number;
  id: string;
  description: string;
  bar: string;
  diameterMm: number;
  kgPerMeter: number;
  similarElements: number;
  quantity: number;
  length: number;
  hookStart: number;
  hookEnd: number;
  spliceLength: number;
  splices: number;
  weightKg: number;
  weightRaw?: string;
  weightView?: MetradoView;
  weightOverride?: number;
  calculationError?: string;
}

export interface EstimateItem {
  formworkTemplateVersion?: 1;
  surplusTemplateVersion?: 1;
  cleanupAreaTemplateVersion?: number;
  provisionalDrainageDecision?: 'keep';
  detailVariant?: { sourceItemId: string; choiceId: string; originalUnit: string; family?: string; reference?: EstimateItem['norma'] };
  adaptation?: {
    reason: string; scope: string; criterion: "details" | "global" | "time";
    original: { description: string; unit: string; support?: string; measurements: MeasurementLine[]; steelLines: SteelLine[] };
  };
  detailTemplateVersion?: number;
  support?: string;
  norma?: { id: string; code: string; level: number; pages: number[]; allowedUnits: string[]; inheritedFrom?: string };
  sourceRow?: number;
  annotations?: Array<{ row: number; description: string }>;
  id: string;
  parentId: string | null;
  kind: ItemKind;
  code: string;
  description: string;
  unit: string;
  order: number;
  measurements: MeasurementLine[];
  steelLines: SteelLine[];
}

export interface MetradoState {
  steelSheetItems?: EstimateItem[];
  demoBackup?: { model: MetradoSnapshot; workbook?: WorkbookData };
  header: MetradoHeader;
  items: EstimateItem[];
  collapsedItemIds: string[];
  view: MetradoView;
  tableStyle: MetradoTableStyle;
  dialog: "measurementGuide" | "portableDrainage" | "header" | "item" | "measurement" | "steel" | "stirrup" | "slab" | "wood" | "column" | "style" | "clear" | "numbering" | "levels" | "summary" | "steelSheet" | "units" | "normaTemplate" | "normaReview" | null;
  targetItemId: string | null;
  selectedItemId: string | null;
  summaryFactor: number;
  summaryVisible: boolean;
  showFrame: boolean;
  showFill: boolean;
  showSteelTotals: boolean;
  unitCatalog: Array<{ code: string; kind: MeasurementKind }>;
  numbering: { first: number; prefix: string; suffix: string };
  selectItem: (id: string | null) => void;
  setSummaryFactor: (factor: number) => void;
  renumberItems: (first: number, prefix: string, suffix: string) => void;
  updateSteelLine: (itemId: string, lineId: string, patch: Partial<SteelLine>) => void;
  removeSteelLine: (itemId: string, lineId: string) => void;
  commitCalculation: (groups: CalculationGroup[], parentId: string | null) => void;
  setView: (view: MetradoView) => void;
  setTableStyle: (style: MetradoTableStyle) => void;
  toggleAllItems: () => void;
  toggleItemCollapsed: (id: string) => void;
  setDialog: (dialog: MetradoState["dialog"], targetItemId?: string | null) => void;
  updateHeader: (patch: Partial<MetradoHeader>) => void;
  addItem: (kind: ItemKind, parentId?: string | null, description?: string) => string;
  updateItem: (id: string, patch: Partial<Pick<EstimateItem, "description" | "unit" | "code" | "support">>) => void;
  removeItem: (id: string) => void;
  addMeasurement: (itemId: string, line: Omit<MeasurementLine, "id">) => void;
  updateMeasurement: (itemId: string, lineId: string, patch: Partial<MeasurementLine>) => void;
  removeMeasurement: (itemId: string, lineId: string) => void;
  addSteelLine: (itemId: string, line: Omit<SteelLine, "id">) => void;
  clearEstimate: () => void;
  importEstimate: (items: EstimateItem[], header: MetradoHeader, steelSheetItems?: EstimateItem[]) => void;
}

export type MetradoSnapshot = Pick<MetradoState, "header" | "items" | "steelSheetItems" | "collapsedItemIds" | "view" | "tableStyle" | "summaryFactor" | "summaryVisible" | "showFrame" | "showFill" | "showSteelTotals" | "unitCatalog" | "numbering">;

export interface CalculationGroup {
  description: string;
  unit: string;
  measurements: Omit<MeasurementLine, "id">[];
  steelLines: Omit<SteelLine, "id">[];
}

export interface StirrupInput {
  length: number;
  symmetric: boolean;
  zones: Array<{ maxBars: number; spacing: number }>;
}

export interface StirrupResult {
  count: number;
  coveredLength: number;
  remainder: number;
  zones: number[];
}

export const STEEL_CATALOG = [
  { bar: "Ø 1/4″", diameterMm: 6.35, kgPerMeter: 0.25, spliceLength: 0.3, hookLength: 0.15 },
  { bar: "Ø 3/8″", diameterMm: 9.525, kgPerMeter: 0.56, spliceLength: 0.45, hookLength: 0.2 },
  { bar: "Ø 1/2″", diameterMm: 12.7, kgPerMeter: 0.99, spliceLength: 0.5, hookLength: 0.25 },
  { bar: "Ø 5/8″", diameterMm: 15.875, kgPerMeter: 1.55, spliceLength: 0.6, hookLength: 0.35 },
  { bar: "Ø 3/4″", diameterMm: 19.05, kgPerMeter: 2.24, spliceLength: 0.75, hookLength: 0.4 },
  { bar: "Ø 1″", diameterMm: 25.4, kgPerMeter: 3.98, spliceLength: 1.3, hookLength: 0.45 },
  { bar: "Ø 1 3/8″", diameterMm: 34.9, kgPerMeter: 7.52, spliceLength: 1.7, hookLength: 0.6 },
  { bar: "Ø 6 mm", diameterMm: 6, kgPerMeter: 0.22, spliceLength: 0.3, hookLength: 0.15 },
  { bar: "Ø 8 mm", diameterMm: 8, kgPerMeter: 0.39, spliceLength: 0.4, hookLength: 0.2 },
  { bar: "Ø 12 mm", diameterMm: 12, kgPerMeter: 0.89, spliceLength: 0.5, hookLength: 0.25 },
] as const;

export const EMPTY_METRADO_HEADER: MetradoHeader = {
  title: "METRADOS DE ESTRUCTURAS",
  project: "",
  owner: "",
  date: new Date().toISOString().slice(0, 10),
  specialty: "ESTRUCTURAS",
  module: "",
  preparedBy: "",
  reviewedBy: "",
};

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `met-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nextCode(items: EstimateItem[], parentId: string | null, numbering = { first: 2, prefix: "", suffix: "" }): string {
  const siblings = items.filter((item) => item.parentId === parentId);
  const parent = parentId ? items.find((item) => item.id === parentId) : undefined;
  const clean = (code: string) => {
    let value = code;
    if (numbering.prefix && value.startsWith(numbering.prefix)) value = value.slice(numbering.prefix.length);
    if (numbering.suffix && value.endsWith(numbering.suffix)) value = value.slice(0, -numbering.suffix.length);
    return value;
  };
  const next = Math.max(parent ? 0 : numbering.first - 1, ...siblings.map((item) => Number(clean(item.code).split(".").at(-1)) || 0)) + 1;
  const segment = String(next).padStart(2, "0");
  return numbering.prefix + (parent ? clean(parent.code) + "." + segment : segment) + numbering.suffix;
}

export const canonicalUnit = (unit: string) => unit.toLowerCase().replace("²", "2").replace("³", "3").trim();
export function calculateItemTotal(item: EstimateItem): number {
  if (canonicalUnit(item.unit) === "kg" && item.steelLines.some((line) => line.calculationError)) return NaN;
  return item.measurements.filter((line) => !line.referenceOnly && canonicalUnit(line.unit) === canonicalUnit(item.unit)).reduce((sum, line) => sum + calculateMeasurement(line), 0)
    + (canonicalUnit(item.unit) === "kg" ? item.steelLines.reduce((sum, line) => sum + line.weightKg, 0) : 0);
}

export function calculateMeasurement(line: Omit<MeasurementLine, "id">): number {
  if (line.presentation === 'separator') return 0;
  if (line.pending) return 0;
  if (line.calculationError) return NaN;
  if (line.quantityOverride !== undefined) return line.quantityOverride;
  if (line.kind === 'volume' && line.surplus) {
    const factor = line.swelling?.factor ?? 1;
    return !Number.isFinite(line.length) || line.length < 0 || !Number.isFinite(factor) || factor < 1 ? NaN : line.length * line.similarElements * line.repetitions * line.sign * factor;
  }
  if (line.kind === 'volume' && line.columnSection) {
    const { area, buriedHeight } = line.columnSection;
    if (!Number.isFinite(area) || !Number.isFinite(buriedHeight) || area <= 0 || buriedHeight <= 0) return NaN;
    return area * buriedHeight * line.similarElements * line.repetitions * line.sign;
  }
  if (line.kind === 'volume' && line.crossSections && (line.length <= 0 || !Number.isFinite(line.length) || (line.crossSections.method === 'endAreas' ? [line.crossSections.initialArea, line.crossSections.finalArea] : [line.crossSections.meanArea]).some(area => !Number.isFinite(area) || area < 0))) return NaN;
  const multiplier = line.similarElements * line.repetitions * line.sign * (line.kind === 'volume' ? line.swelling?.factor ?? 1 : 1);
  if (line.kind === "length") return line.length * multiplier;
  if (line.kind === "area") return line.length * line.width * multiplier;
  if (line.kind === "volume") return line.length * (line.crossSections ? line.crossSections.method === 'endAreas' ? (line.crossSections.initialArea + line.crossSections.finalArea) / 2 : line.crossSections.meanArea : line.width * line.height) * multiplier;
  if (line.kind === "weight") return (line.manualQuantity ?? 0) * multiplier;
  return (line.manualQuantity ?? 1) * multiplier;
}

export function calculateStirrupCount(input: StirrupInput): StirrupResult {
  if (!Number.isFinite(input.length) || input.length <= 0) throw new RangeError("El largo debe ser mayor que cero.");
  let remaining = input.symmetric ? input.length / 2 : input.length;
  let coveredLength = 0;
  let totalBars = 0;
  let lastSpacing = 0;
  const zones: number[] = [];
  for (const [index, zone] of input.zones.slice(0, 4).entries()) {
    if (remaining <= 0) { zones.push(0); continue; }
    if (!Number.isFinite(zone.spacing) || zone.spacing <= 0) throw new RangeError("Cada espaciamiento debe ser mayor que cero.");
    if (!Number.isInteger(zone.maxBars) || zone.maxBars < 0) throw new RangeError("El límite de barras debe ser un entero no negativo.");
    const available = Math.floor(remaining / zone.spacing);
    // FormEstribo stores the first automatic quotient in an Integer before Int().
    const count = index === 0 && zone.maxBars === 0 ? roundVba(remaining / zone.spacing) : zone.maxBars === 0 ? available : Math.min(available, zone.maxBars);
    zones.push(count);
    totalBars += count;
    const zoneLength = count * zone.spacing;
    coveredLength += zoneLength;
    lastSpacing = zone.spacing;
    // Q7 leaves Lq unchanged when the automatic/final zone is reached.
    if (zone.maxBars === 0 || (index > 0 && available < zone.maxBars)) break;
    remaining -= zoneLength;
  }
  while (zones.length < Math.min(input.zones.length, 4)) zones.push(0);
  const count = input.symmetric
    ? totalBars * 2 - (remaining <= lastSpacing && totalBars > 0 ? 1 : 0)
    : totalBars - (remaining <= lastSpacing && totalBars > 0 ? 1 : 0);
  return { count: Math.max(0, count), coveredLength, remainder: Math.max(0, (input.symmetric ? input.length / 2 : input.length) - coveredLength), zones };
}

export function roundVba(value: number, digits = 0) {
  const scale = 10 ** digits, scaled = Math.abs(value) * scale, floor = Math.floor(scaled), fraction = scaled - floor;
  const half = Math.abs(fraction - 0.5) <= Number.EPSILON * Math.max(1, scaled) * 4;
  return Math.sign(value) * (half ? (floor % 2 === 0 ? floor : floor + 1) : Math.round(scaled)) / scale;
}

const initialHeader = { ...EMPTY_METRADO_HEADER };

export const useMetradoStore = create<MetradoState>()(
  persist(
    (set, get) => ({
      header: initialHeader,
      items: [],
      collapsedItemIds: [],
      view: "metrado",
      tableStyle: "color",
      dialog: null,
      targetItemId: null,
      selectedItemId: null,
      summaryFactor: 1,
      summaryVisible: true,
      showFrame: true,
      showFill: true,
      showSteelTotals: true,
      unitCatalog: [{ code: "m", kind: "length" }, { code: "m2", kind: "area" }, { code: "m3", kind: "volume" }, { code: "kg", kind: "weight" }, { code: "und", kind: "units" }, { code: "p2", kind: "units" }, { code: "glb", kind: "units" }],
      numbering: { first: 2, prefix: "", suffix: "" },
      selectItem: (selectedItemId) => set({ selectedItemId }),
      setSummaryFactor: (summaryFactor) => set({ summaryFactor }),
      renumberItems: (first, prefix, suffix) => set((state) => {
        if (state.items.some(item => item.norma)) throw new Error("La plantilla normativa conserva sus códigos de referencia. Edita únicamente los códigos de proyecto que necesites; no se renumera todo el catálogo automáticamente.");
        const codes = new Map<string, string>();
        const visit = (parentId: string | null, base: string) => {
          state.items.filter((item) => item.parentId === parentId).sort((a, b) => a.order - b.order).forEach((item, index) => {
            const segment = String(index + (parentId ? 1 : first)).padStart(2, "0");
            const code = base ? base + "." + segment : segment;
            codes.set(item.id, prefix + code + suffix);
            visit(item.id, code);
          });
        };
        visit(null, "");
        return { numbering: { first, prefix, suffix }, items: state.items.map((item) => ({ ...item, code: codes.get(item.id) ?? item.code })) };
      }),
      setView: (view) => set({ view }),
      setTableStyle: (tableStyle) => set({ tableStyle, dialog: null }),
      toggleAllItems: () => set((state) => {
        const ids = state.items.filter((item) => item.kind === "chapter" && state.items.some((child) => child.parentId === item.id)).map((item) => item.id);
        return { collapsedItemIds: state.collapsedItemIds.length ? [] : ids };
      }),
      toggleItemCollapsed: (id) => set((state) => ({ collapsedItemIds: state.collapsedItemIds.includes(id) ? state.collapsedItemIds.filter((entry) => entry !== id) : [...state.collapsedItemIds, id] })),
      setDialog: (dialog, targetItemId = null) => set({ dialog, targetItemId }),
      updateHeader: (patch) => set((state) => ({ header: { ...state.header, ...patch } })),
      addItem: (kind, parentId = null, description = "") => {
        const independentSteel = get().view === "acero" && get().steelSheetItems !== undefined;
        const items = independentSteel ? get().steelSheetItems! : get().items;
        const id = newId();
        const order = items.filter((item) => item.parentId === parentId).length;
        const item: EstimateItem = {
          id,
          parentId,
          kind,
          code: nextCode(items, parentId, get().numbering).toUpperCase(),
          description: description.toUpperCase(),
          unit: kind === "chapter" ? "" : independentSteel ? "kg" : "m3",
          order,
          measurements: [],
          steelLines: [],
        };
        set(independentSteel ? { steelSheetItems: [...items,item] } : { items: [...items,item] });
        return id;
      },
      updateItem: (id, patch) => set((state) => {
        const normalized = { ...patch, ...(patch.description !== undefined ? { description: patch.description.toUpperCase() } : {}), ...(patch.code !== undefined ? { code: patch.code.toUpperCase() } : {}) };
        return state.steelSheetItems?.some((item) => item.id === id)
          ? { steelSheetItems: state.steelSheetItems.map(item => item.id === id ? { ...item, ...normalized } : item) }
          : { items: state.items.map(item => item.id === id ? { ...item, ...normalized,
            ...(patch.unit !== undefined ? { measurements: item.measurements.map(line => {
              if (line.pending === undefined || line.unit !== item.unit) return line;
              const kind = state.unitCatalog.find(entry => entry.code === canonicalUnit(patch.unit!))?.kind ?? line.kind;
              return { ...line, unit: patch.unit!, kind, surplus: kind === 'volume' ? line.surplus : undefined, columnSection: kind === 'volume' ? line.columnSection : undefined, crossSections: kind === 'volume' ? line.crossSections : undefined, swelling: kind === 'volume' ? line.swelling : undefined };
            }) } : {})
          } : item) };
      }),
      removeItem: (id) => set((state) => {
        if(state.steelSheetItems?.some(item=>item.id===id))return{steelSheetItems:renumberAfterDelete(state.steelSheetItems,state.steelSheetItems.filter(item=>item.id!==id),new Set([id]),state.numbering),selectedItemId:null};
        const deleted = new Set<string>([id]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const item of state.items) if (item.parentId && deleted.has(item.parentId) && !deleted.has(item.id)) { deleted.add(item.id); changed = true; }
        }
        return { items: renumberAfterDelete(state.items, state.items.filter((item) => !deleted.has(item.id)), deleted, state.numbering), selectedItemId: deleted.has(state.selectedItemId ?? "") ? null : state.selectedItemId };
      }),
      addMeasurement: (itemId, line) => set((state) => ({ items: state.items.map((item) => item.id === itemId ? { ...item, measurements: [...item.measurements, { ...line, id: newId() }] } : item) })),
      updateMeasurement: (itemId, lineId, patch) => set((state) => ({ items: state.items.map((item) => item.id === itemId ? { ...item, measurements: item.measurements.map((line) => line.id === lineId ? { ...line, ...patch } : line) } : item) })),
      removeMeasurement: (itemId, lineId) => set((state) => ({ items: state.items.map((item) => item.id === itemId ? { ...item, measurements: item.measurements.filter((line) => line.id !== lineId) } : item) })),
      addSteelLine: (itemId, line) => set((state) => state.steelSheetItems?.some(item=>item.id===itemId) ? {steelSheetItems:state.steelSheetItems.map(item=>item.id===itemId?{...item,steelLines:[...item.steelLines,{...line,id:newId()}]}:item)} : ({ items: state.items.map((item) => item.id === itemId ? { ...item, steelLines: [...item.steelLines, { ...line, id: newId() }] } : item) })),
      updateSteelLine: (itemId, lineId, patch) => set((state) => {
        const field=state.steelSheetItems?.some(item=>item.id===itemId)?"steelSheetItems":"items";
        return {[field]:(state[field]??[]).map((item) => item.id === itemId ? { ...item, steelLines: item.steelLines.map((line) => {
        if (line.id !== lineId) return line;
        const next = { ...line, ...patch };
        next.weightKg = next.similarElements * next.quantity * (next.length + next.hookStart + next.hookEnd + next.splices * next.spliceLength) * next.kgPerMeter;
        return next;
      }) } : item) }; }),
      removeSteelLine: (itemId, lineId) => set((state) => state.steelSheetItems?.some(item=>item.id===itemId) ? {steelSheetItems:state.steelSheetItems.map(item=>item.id===itemId?{...item,steelLines:item.steelLines.filter(line=>line.id!==lineId)}:item)} : ({ items: state.items.map((item) => item.id === itemId ? { ...item, steelLines: item.steelLines.filter((line) => line.id !== lineId) } : item) })),
      commitCalculation: (groups, parentId) => set((state) => {
        const independentSteel = state.view === "acero" && state.steelSheetItems !== undefined && groups.every(group=>canonicalUnit(group.unit)==="kg" && !group.measurements.length);
        const items = [...(independentSteel ? state.steelSheetItems! : state.items)];
        const target = items.find((item) => item.id === parentId);
        const chapterId = target?.kind === "chapter" ? target.id : target?.parentId ?? null;
        let selectedItemId = state.selectedItemId;
        for (const group of groups) {
          // Direct calculations may append to the selected compatible partida.
          const existing = target?.kind === "item" && canonicalUnit(target.unit) === canonicalUnit(group.unit)
            ? target : items.find((item) => item.parentId === chapterId && item.kind === "item" && item.description === group.description && item.unit === group.unit);
          const id = existing?.id ?? newId();
          const measurements = group.measurements.map((line) => ({ ...line, id: newId() }));
          const steelLines = group.steelLines.map((line) => ({ ...line, id: newId() }));
          if (existing) {
            const index = items.findIndex((item) => item.id === id);
            items[index] = { ...items[index], measurements: [...items[index].measurements, ...measurements], steelLines: [...items[index].steelLines, ...steelLines] };
          } else items.push({ id, parentId: chapterId, kind: "item", code: nextCode(items, chapterId, state.numbering), description: group.description, unit: group.unit, order: items.filter((item) => item.parentId === chapterId).length, measurements, steelLines });
          selectedItemId = id;
        }
        return independentSteel ? {steelSheetItems:items,selectedItemId,dialog:null,view:"acero"} : { items, selectedItemId, dialog: null, view: "metrado" };
      }),
      clearEstimate: () => set({ header: { ...EMPTY_METRADO_HEADER }, items: [], steelSheetItems: undefined, collapsedItemIds: [], view: "metrado", tableStyle: "color", dialog: null, targetItemId: null, selectedItemId: null, summaryFactor: 1, summaryVisible: true }),
      importEstimate: (items, header, steelSheetItems) => {
        const normalize = (item: EstimateItem) => ({ ...item, code: item.code.toUpperCase(), description: item.description.toUpperCase() });
        set({ items: items.map(normalize), header, steelSheetItems: steelSheetItems?.map(normalize), collapsedItemIds: [], dialog: null, targetItemId: null, selectedItemId: null, summaryVisible: true });
      },
    }),
    {
      name: "wexel-metrados-v1",
      version: 1,
      storage: deferredStorage<Partial<MetradoState>>((s) => [s.items, s.steelSheetItems, s.header, s.collapsedItemIds, s.tableStyle, s.summaryFactor, s.numbering, s.summaryVisible, s.showFrame, s.showFill, s.showSteelTotals, s.unitCatalog, s.demoBackup], (s) => ({ view: s.view }), true),
      skipHydration: true,
      partialize: ({ header, items, steelSheetItems, collapsedItemIds, view, tableStyle, summaryFactor, numbering, summaryVisible, showFrame, showFill, showSteelTotals, unitCatalog, demoBackup }) => ({ header, items, steelSheetItems, collapsedItemIds, view, tableStyle, summaryFactor, numbering, summaryVisible, showFrame, showFill, showSteelTotals, unitCatalog, demoBackup }),
    },
  ),
);
