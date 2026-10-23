import { useWexelStore } from "../../store/useWexelStore";
import { useMetradoStore, type MetradoView } from "../../store/useMetradoStore";
import { mergeMetradoWorkbook, METRADO_SHEETS, METRADO_WORKBOOK, projectMetrado, readMetradoSheet, selectedMetradoItem } from "./workbook";
import { formatMetradoSheet } from "./formatWorkbook";
import { withNormaDetails } from "./normaCatalog";

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
  const items = withNormaDetails(current.items);
  const backupItems = current.demoBackup ? withNormaDetails(current.demoBackup.model.items) : undefined;
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
  if (!item || item.kind !== "item") { state.setDialog("item"); return; }
  if (item.norma && !item.unit) { state.setDialog("normaReview"); return; }
  const kind = state.unitCatalog.find((entry) => entry.code === item.unit.toLowerCase())?.kind ?? "volume";
  state.addMeasurement(item.id, { description: "", unit: item.unit, kind, similarElements: 1, length: 0, width: 0, height: 0, repetitions: 1, sign: 1, manualQuantity: kind === "units" ? 1 : 0,
    ...(item.norma ? { pending: true, expressions: { length: "", width: "", height: "", manualQuantity: "" } } : {}) });
}
export function deleteMetradoRow() {
  const excel = useWexelStore.getState(), state = useMetradoStore.getState();
  const sheet = excel.sheets.find((entry) => entry.id === excel.activeSheetId);
  const row = Number(sheet?.currentCell.match(/\d+$/)?.[0]);
  const entry = Object.entries(sheet?.template?.rows ?? {}).find(([, r]) => row === r);
  if (!entry) return;
  const [kind, itemId, lineId] = JSON.parse(entry[0]) as string[];
  if (kind === "measurement") state.removeMeasurement(itemId, lineId);
  if (kind === "steel") state.removeSteelLine(itemId, lineId);
  if (kind === "item" && window.confirm("¿Eliminar esta partida y sus detalles?")) state.removeItem(itemId);
}
