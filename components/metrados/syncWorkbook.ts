import { useWexelStore } from "../../store/useWexelStore";
import { useMetradoStore, type MetradoView } from "../../store/useMetradoStore";
import { mergeMetradoWorkbook, METRADO_SHEETS, METRADO_WORKBOOK, projectMetrado, readMetradoSheet, selectedMetradoItem } from "./workbook";
import { formatMetradoSheet } from "./formatWorkbook";
import { withNormaDetails, nextNormaDetailLabel, repairNormaDeletionGaps } from "./normaCatalog";
import { commitEdit } from '../utils/excelEditing';
import { removeSheetRows } from '../utils/sheetRows';
import { recalculateSheet } from './workbook';
import { STEEL_HEADER_OFFSET } from './steelWorkbook';
import { renumberAfterDelete } from './renumberAfterDelete';
import { emptyCrossSections } from './crossSections';
import {exposeProjectInputs} from './explicitInputs';

let suspended = 0;
export function metradoWorkbookTransaction(action: () => void) {
  suspended++;
  try { action(); } finally { suspended--; }
}

const contentChanged = (a: ReturnType<typeof useMetradoStore.getState>, b: typeof a) => a.items !== b.items || a.steelSheetItems !== b.steelSheetItems || a.header !== b.header || a.summaryFactor !== b.summaryFactor || a.summaryVisible !== b.summaryVisible || a.collapsedItemIds !== b.collapsedItemIds || a.showSteelTotals !== b.showSteelTotals;
/** Refresh saved cell styles after a palette edit, without projecting or reading back data. */
export function refreshMetradoAppearance() {
  const excel = useWexelStore.getState(), state = useMetradoStore.getState();
  const workbook = excel.activeWorkbookId === METRADO_WORKBOOK
    ? { sheets: excel.sheets, activeSheetId: excel.activeSheetId }
    : excel.workbooks[METRADO_WORKBOOK];
  if (!workbook) return;
  const sheets = workbook.sheets.map((sheet) => formatMetradoSheet(sheet,
    sheet.id === METRADO_SHEETS.acero ? { ...state, items: state.steelSheetItems ?? state.items } : state));
  if (sheets.every((sheet, index) => sheet === workbook.sheets[index])) return;
  metradoWorkbookTransaction(() => excel.replaceWorkbook(METRADO_WORKBOOK, { ...workbook, sheets }));
}
export function startMetradoWorkbookSync() {
  let syncing = false;
  const fromModel = (forceFormat = false, readMain = true) => {
    if (syncing || suspended) return;
    syncing = true;
    try {
      // A second pass updates the summary after the native worksheet evaluates its formulas.
      for (let pass = 0; pass < 3; pass++) {
        const state = useMetradoStore.getState(), excel = useWexelStore.getState();
        const previous = excel.activeWorkbookId === METRADO_WORKBOOK ? { sheets: excel.sheets, activeSheetId: excel.activeSheetId } : excel.workbooks[METRADO_WORKBOOK];
        const workbook = mergeMetradoWorkbook(previous, projectMetrado(state), state.view);
        workbook.sheets = workbook.sheets.map((sheet) => formatMetradoSheet(sheet,
          sheet.id === METRADO_SHEETS.acero ? { ...state, items: state.steelSheetItems ?? state.items } : state, forceFormat));
        excel.replaceWorkbook(METRADO_WORKBOOK, workbook);
        if (!readMain) break;
        const sheet = workbook.sheets.find((entry) => entry.id === METRADO_SHEETS.metrado)!;
        const model = useMetradoStore.getState(), patch = readMetradoSheet(sheet, model);
        if (JSON.stringify([patch.items, patch.header]) === JSON.stringify([model.items, model.header])) break;
        useMetradoStore.setState(patch);
      }
    } finally { syncing = false; }
  };
  // A saved native workbook is read before projection, so existing cell edits survive reload.
  const saved = useWexelStore.getState().workbooks[METRADO_WORKBOOK];
  if (saved) for (const sheet of saved.sheets) if (sheet.template && sheet.id === METRADO_SHEETS.metrado) {
    const model = useMetradoStore.getState();
    useMetradoStore.setState(readMetradoSheet(sheet, model));
  }
  // Upgrade once, after reading saved cells, preserving measurements and intentional deletions.
  const current = useMetradoStore.getState();
  const excel=useWexelStore.getState(),book=excel.activeWorkbookId===METRADO_WORKBOOK?{sheets:excel.sheets,activeSheetId:excel.activeSheetId}:excel.workbooks[METRADO_WORKBOOK];
  if(book?.sheets.some(sheet=>sheet.id==='metrados-modelo'))excel.replaceWorkbook(METRADO_WORKBOOK,{sheets:book.sheets.filter(sheet=>sheet.id!=='metrados-modelo'),activeSheetId:book.activeSheetId==='metrados-modelo'?METRADO_SHEETS.metrado:book.activeSheetId});
  const items = exposeProjectInputs(repairNormaDeletionGaps(withNormaDetails(current.items), current.numbering));
  const backupItems = current.demoBackup ? exposeProjectInputs(repairNormaDeletionGaps(withNormaDetails(current.demoBackup.model.items), current.demoBackup.model.numbering)) : undefined;
  if (items !== current.items || (current.demoBackup && backupItems !== current.demoBackup.model.items)) {
    useMetradoStore.setState({ items, ...(current.demoBackup ? { demoBackup: { ...current.demoBackup, model: { ...current.demoBackup.model, items: backupItems! } } } : {}) });
  }
  fromModel();
  const stopModel = useMetradoStore.subscribe((next, previous) => {
    if (syncing || suspended) return;
    const formatChanged = next.tableStyle !== previous.tableStyle || next.showFrame !== previous.showFrame || next.showFill !== previous.showFill;
    if (formatChanged || contentChanged(next, previous)) fromModel(formatChanged,next.items!==previous.items);
    else if (next.view !== previous.view) useWexelStore.getState().setActiveSheet(METRADO_SHEETS[next.view]);
  });
  const stopExcel = useWexelStore.subscribe((next, previous) => {
    if (syncing || suspended) return;
    const workbook = next.workbooks[METRADO_WORKBOOK], oldWorkbook = previous.workbooks[METRADO_WORKBOOK];
    let changedModel = false;
    let mainChanged = false;
    if (workbook !== oldWorkbook && workbook) {
      syncing = true;
      try {
        for (const sheet of workbook.sheets) {
          const oldSheet = oldWorkbook?.sheets.find((old) => old.id === sheet.id);
          if (sheet.template && sheet.cells !== oldSheet?.cells) {
            const model = useMetradoStore.getState(), patch = readMetradoSheet(sheet, model);
            if (JSON.stringify([patch.items, patch.steelSheetItems, patch.header]) !== JSON.stringify([model.items, model.steelSheetItems, model.header])) { mainChanged ||= patch.items!==model.items; useMetradoStore.setState(patch); changedModel = true; }
          }
        }
      } finally { syncing = false; }
    }
    if (next.activeWorkbookId === METRADO_WORKBOOK) {
      const view = (Object.entries(METRADO_SHEETS).find(([, id]) => id === next.activeSheetId)?.[0]) as MetradoView | undefined;
      const sheet = next.sheets.find((entry) => entry.id === next.activeSheetId);
      syncing = true;
      try {
        const model = useMetradoStore.getState();
        if (view && model.view !== view) useMetradoStore.setState({ view });
        const itemId = sheet ? selectedMetradoItem(sheet) : null;
        if (itemId !== model.selectedItemId) model.selectItem(itemId);
      } finally { syncing = false; }
    }
    if (changedModel) fromModel(false,mainChanged);
  });
  return () => { stopModel(); stopExcel(); };
}

export function addMetradoDetail() {
  const state = useMetradoStore.getState(), item = state.items.find((entry) => entry.id === state.selectedItemId);
  const reference = Boolean(item?.kind === 'chapter' && item.cleanupAreaTemplateVersion);
  if (!item || item.kind !== "item" && !reference) { state.setDialog("item"); return; }
  if (item.norma && !item.unit && !reference) { state.setDialog("normaReview"); return; }
  const unit = reference ? 'm2' : item.unit;
  const kind = reference ? 'area' : state.unitCatalog.find((entry) => entry.code === unit.toLowerCase())?.kind ?? "volume";
  state.addMeasurement(item.id, { description: item.norma ? nextNormaDetailLabel(item) : "", unit, kind, ...(reference ? { referenceOnly: true } : {}), similarElements: 1, length: 0, width: 0, height: 0, repetitions: 1, sign: 1, manualQuantity: kind === "units" ? 1 : 0,
    ...(['OE.2.1.3','HU.2.1.3'].includes(item.norma?.code ?? '') ? { crossSections: emptyCrossSections() } : {}),
    ...(item.norma ? { pending: true, expressions: { length: "", width: "", height: "", manualQuantity: "" } } : {}) });
}

/** Insert a presentation-only row below the selected detail, or before a partida's details. */
export function addMetradoSeparator() {
  commitEdit();
  const excel = useWexelStore.getState(), state = useMetradoStore.getState();
  const sheet = excel.sheets.find(sheet => sheet.id === excel.activeSheetId);
  if (excel.activeWorkbookId !== METRADO_WORKBOOK || sheet?.id !== METRADO_SHEETS.metrado) throw new Error('Selecciona una partida o detalle en la hoja Metrado.');
  const selectedRow = Number(sheet.currentCell.match(/\d+$/)?.[0]);
  const binding = Object.entries(sheet.template?.rows ?? {}).find(([, row]) => row === selectedRow);
  const [kind, itemId, lineId] = binding ? JSON.parse(binding[0]) as string[] : [];
  const item = state.items.find(item => item.id === itemId);
  if (!item || (kind !== 'item' && kind !== 'measurement')) throw new Error('Selecciona el título de la partida o el detalle después del cual deseas insertar la línea.');
  const index = kind === 'item' ? 0 : item.measurements.findIndex(line => line.id === lineId) + 1;
  const id = crypto.randomUUID();
  const separator = { id, presentation: 'separator' as const, description: '', unit: '', kind: 'units' as const, pending: true,
    similarElements: 0, repetitions: 0, sign: 1 as const, length: 0, width: 0, height: 0, manualQuantity: 0 };
  const measurements = [...item.measurements]; measurements.splice(index, 0, separator);
  useMetradoStore.setState({ items: state.items.map(entry => entry.id === item.id ? { ...entry, measurements } : entry) });
  const current = useWexelStore.getState(), updated = current.sheets.find(sheet => sheet.id === METRADO_SHEETS.metrado);
  const row = updated?.template?.rows[JSON.stringify(['measurement', item.id, id, ''])];
  if (updated && row) current.updateSheet(updated.id, sheet => ({ ...sheet, selectedCell: { row: row - 1, col: 3 }, selectionEnd: undefined, selectionMode: 'cells', currentCell: 'D' + row, formulaInput: '' }));
}
/** Select an explicit item for the normal, guarded deletion feedback flow. */
export function prepareMetradoItemDeletion(itemId: string) {
  commitEdit();
  if (useWexelStore.getState().activeWorkbookId !== METRADO_WORKBOOK) throw new Error('Vuelve a la hoja de metrado antes de quitar la partida.');
  if (!useMetradoStore.getState().items.some(item => item.id === itemId)) throw new Error('La partida ya no está disponible.');
  useMetradoStore.getState().setView('metrado');
  useWexelStore.getState().setActiveSheet(METRADO_SHEETS.metrado);
  const excel = useWexelStore.getState(), sheet = excel.sheets.find(sheet => sheet.id === METRADO_SHEETS.metrado);
  const row = sheet?.template?.rows[JSON.stringify(['item', itemId, '', ''])];
  if (!sheet || !row) throw new Error('No se encontró la fila de la partida. Vuelve a abrir el metrado.');
  excel.updateSheet(sheet.id, current => ({ ...current, selectedCell: { row: row - 1, col: 3 }, selectionEnd: undefined, selectionMode: 'cells', currentCell: 'D' + row, formulaInput: current.cells['D' + row]?.rawValue ?? '' }));
}

export function deleteMetradoRow() {
  commitEdit();
  const excel = useWexelStore.getState(), state = useMetradoStore.getState();
  const sheet = excel.sheets.find((entry) => entry.id === excel.activeSheetId);
  if (!sheet) return;
  const start = sheet.selectedCell?.row ?? Number(sheet.currentCell.match(/\d+$/)?.[0]) - 1;
  const end = sheet.selectionEnd?.row ?? start;
  const headingRows = sheet.template ? (sheet.id === METRADO_SHEETS.acero ? 2 : 1) : 0;
  const removed = new Set<number>();
  for (let row = Math.max(headingRows + 1, Math.min(start, end) + 1); row <= Math.max(start, end) + 1; row++) removed.add(row);
  if (!removed.size) return;
  const bindings = Object.entries(sheet.template?.rows ?? {}).map(([key, row]) => ({ key: JSON.parse(key) as string[], row }));
  const deletedItems = new Set(bindings.filter(entry => removed.has(entry.row) && entry.key[0] === 'item').map(entry => entry.key[1]));
  const steel = sheet.id === METRADO_SHEETS.acero && state.steelSheetItems !== undefined;
  const source = steel ? state.steelSheetItems! : state.items;
  // Removing a title also removes its descendants, as the existing partida action does.
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of source) if (item.parentId && deletedItems.has(item.parentId) && !deletedItems.has(item.id)) { deletedItems.add(item.id); changed = true; }
  }
  const identity = (key: string[]) => JSON.stringify([key[0] === 'sectionHeader' ? 'measurement' : key[0], ...key.slice(1, 3)]);
  const deletedLines = new Set(bindings.filter(entry => removed.has(entry.row)).map(entry => identity(entry.key)));
  for (const entry of bindings) if (deletedItems.has(entry.key[1]) || deletedLines.has(identity(entry.key))) removed.add(entry.row);
  const shiftedSourceRow = (row: number) => row - [...removed].filter(deleted => deleted < row - STEEL_HEADER_OFFSET).length;
  const items = source.filter(item => !deletedItems.has(item.id)).map(item => ({ ...item,
    ...(sheet.id === METRADO_SHEETS.acero ? {
      sourceRow: item.sourceRow === undefined ? undefined : shiftedSourceRow(item.sourceRow),
      annotations: item.annotations?.filter(note => !removed.has(note.row - STEEL_HEADER_OFFSET)).map(note => ({ ...note, row: shiftedSourceRow(note.row) })),
    } : {}),
    measurements: item.measurements.filter(line => !deletedLines.has(JSON.stringify(['measurement', item.id, line.id]))),
    steelLines: item.steelLines.filter(line => !deletedLines.has(JSON.stringify(['steel', item.id, line.id]))).map(line => sheet.id === METRADO_SHEETS.acero && line.sourceRow !== undefined ? { ...line, sourceRow: shiftedSourceRow(line.sourceRow) } : line),
  }));
  const shifted = recalculateSheet(removeSheetRows(sheet, removed));
  metradoWorkbookTransaction(() => {
    if (sheet.template) {
      const model = { ...state, ...(steel ? { steelSheetItems: items } : { items }), collapsedItemIds: state.collapsedItemIds.filter(id => !deletedItems.has(id)), selectedItemId: null };
      const patch = readMetradoSheet(shifted, model);
      const field = steel ? 'steelSheetItems' : 'items';
      const renumbered = renumberAfterDelete(source, patch[field] ?? items, deletedItems, state.numbering);
      useMetradoStore.setState({ ...model, ...patch, [field]: renumbered });
      const previous = { sheets: excel.sheets.map(entry => entry.id === sheet.id ? shifted : entry), activeSheetId: excel.activeSheetId };
      const workbook = mergeMetradoWorkbook(previous, projectMetrado(useMetradoStore.getState()), state.view);
      excel.replaceWorkbook(METRADO_WORKBOOK, workbook);
    } else excel.updateSheet(sheet.id, () => shifted);
  });
  return { rows: removed.size, partidas: deletedItems.size };
}

/** Clear the chosen sheets including free cells; retain other sheets and their dimensions. */
export function clearMetradoSheets(metrado: boolean, summary: boolean) {
  if (!metrado && !summary) return;
  commitEdit();
  const excel = useWexelStore.getState(), state = useMetradoStore.getState();
  const previous = excel.activeWorkbookId === METRADO_WORKBOOK ? { sheets: excel.sheets, activeSheetId: excel.activeSheetId } : excel.workbooks[METRADO_WORKBOOK];
  metradoWorkbookTransaction(() => {
    useMetradoStore.setState({
      ...(metrado ? { items: [], steelSheetItems: state.steelSheetItems ?? state.items, collapsedItemIds: [], selectedItemId: null } : {}),
      ...(summary ? { summaryVisible: false } : {}),
    });
    const model = useMetradoStore.getState(), projected = projectMetrado(model);
    const workbook = mergeMetradoWorkbook(previous, projected, model.view);
    workbook.sheets = workbook.sheets.map(sheet => {
      if (!((metrado && sheet.id === METRADO_SHEETS.metrado) || (summary && sheet.id === METRADO_SHEETS.resumen))) return sheet;
      const fresh = projected.find(entry => entry.id === sheet.id)!;
      return { ...fresh, colWidths: sheet.colWidths, rowHeights: sheet.rowHeights, manualRowHeights: sheet.manualRowHeights };
    });
    excel.replaceWorkbook(METRADO_WORKBOOK, workbook);
  });
}
