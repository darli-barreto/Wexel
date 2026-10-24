import source from "./data/quispe-example.json";
import { useMetradoStore, type EstimateItem, type MetradoSnapshot } from "../../store/useMetradoStore";
import { useWexelStore } from "../../store/useWexelStore";
import { METRADO_WORKBOOK, METRADO_SHEETS, projectMetrado, mergeMetradoWorkbook } from "./workbook";
import { formatMetradoSheet } from "./formatWorkbook";
import { metradoWorkbookTransaction, refreshMetradoAppearance } from "./syncWorkbook";
import { commitEdit } from "../utils/excelEditing";

export const quispeExampleControls = source.controls;
export const quispeSteelControls = source.steelControls;
export function metradoSnapshot(): MetradoSnapshot {
  const { header, items, steelSheetItems, collapsedItemIds, view, tableStyle, summaryFactor, summaryVisible, showFrame, showFill, showSteelTotals, unitCatalog, numbering } = useMetradoStore.getState();
  return structuredClone({ header, items, steelSheetItems, collapsedItemIds, view, tableStyle, summaryFactor, summaryVisible, showFrame, showFill, showSteelTotals, unitCatalog, numbering });
}
export function createQuispeExample(): MetradoSnapshot {
  const demo: MetradoSnapshot = { ...metradoSnapshot(), header: { ...source.header }, items: structuredClone(source.items) as EstimateItem[], steelSheetItems: structuredClone(source.steelItems) as EstimateItem[], view: "metrado", collapsedItemIds: [], summaryFactor: 1, summaryVisible: true, showSteelTotals: true, tableStyle: "color", showFrame: true, showFill: true };
  const rows = projectMetrado(demo)[0].template!.rows;
  for (const item of demo.items) for (const line of item.measurements) {
    const formula = (source.specialFormulas as Record<string, string>)[line.id];
    if (formula) line.resultRaw = formula.replaceAll("{row}", String(rows[JSON.stringify(["measurement", item.id, line.id, ""])]));
  }
  return demo;
}
export function upgradeQuispeExample() {
  const state=useMetradoStore.getState();
  if (!state.demoBackup || state.steelSheetItems !== undefined) return;
  const excel=useWexelStore.getState(), saved=excel.workbooks[METRADO_WORKBOOK];
  metradoWorkbookTransaction(() => {
    useMetradoStore.setState({steelSheetItems:structuredClone(source.steelItems) as EstimateItem[]});
    if (saved) excel.replaceWorkbook(METRADO_WORKBOOK,{...saved,sheets:saved.sheets.filter((s)=>s.id!==METRADO_SHEETS.acero && s.id!=="q7-acero-reference")});
  });
}
/** Reversible demo: snapshot the user's native cells/model once, then restore both together. */
export function toggleQuispeExample() {
  commitEdit();
  const state = useMetradoStore.getState(), excel = useWexelStore.getState();
  if (state.demoBackup) {
    const backup = state.demoBackup;
    const saved = backup.workbook;
    // Older backups can contain only the empty placeholder workbook, or the old info header.
    // Restore healthy workbooks verbatim; repair the table structure only when it is missing.
    const repair = !saved || !Object.values(METRADO_SHEETS).every(id => {
      const sheet = saved.sheets.find(s => s.id === id);
      return sheet?.template && sheet.cells.C1?.rawValue.trim() && sheet.cells.D1?.rawValue.trim();
    }) || !saved.sheets.some(s => s.id === saved.activeSheetId && s.template)
      || backup.model.items.some(item => {
        const sheet = saved.sheets.find(s => s.id === METRADO_SHEETS.metrado);
        const itemRow = sheet?.template?.rows[JSON.stringify(['item', item.id, '', ''])];
        const summary = saved.sheets.find(s => s.id === METRADO_SHEETS.resumen);
        const summaryRow = summary?.template?.rows[JSON.stringify(['item', item.id, '', ''])];
        return item.cleanupAreaTemplateVersion && (sheet?.template?.generated['P' + itemRow]?.key !== JSON.stringify(['item', item.id, '', 'referenceAreaTotal'])
          || backup.model.summaryVisible && summary?.template?.generated['H' + summaryRow]?.key !== JSON.stringify(['referenceSummary', item.id, '', 'referenceAreaTotal']))
          || item.measurements.some(line => line.referenceOnly && !sheet?.template?.rows[JSON.stringify(['measurement', item.id, line.id, ''])]);
      });
    let workbook = saved;
    if (repair) {
      const projected = projectMetrado(backup.model);
      const previous = saved && { ...saved, sheets: saved.sheets.map(sheet => Object.values(METRADO_SHEETS).includes(sheet.id) && !sheet.template ? { ...sheet, template: { id: "metrados", rows: {}, generated: {} } } : sheet) };
      workbook = mergeMetradoWorkbook(previous, projected, backup.model.view);
      workbook.sheets = workbook.sheets.map(sheet => {
        const desired = projected.find(s => s.id === sheet.id);
        if (!desired) return sheet;
        const cells = { ...sheet.cells };
        for (const [address, binding] of Object.entries(desired.template!.generated)) {
          const [kind] = JSON.parse(binding.key) as string[];
          const row = Number(address.match(/\d+$/)?.[0]);
          if (kind === "label" && row <= (sheet.id === METRADO_SHEETS.acero ? 2 : 1) && !cells[address]?.rawValue.trim()) cells[address] = desired.cells[address];
        }
        return formatMetradoSheet({ ...sheet, cells }, sheet.id === METRADO_SHEETS.acero ? { ...backup.model, items: backup.model.steelSheetItems ?? backup.model.items } : backup.model);
      });
    }
    metradoWorkbookTransaction(() => {
      useMetradoStore.setState({ ...backup.model, steelSheetItems: backup.model.steelSheetItems, demoBackup: undefined, dialog: null, targetItemId: null, selectedItemId: null });
      excel.replaceWorkbook(METRADO_WORKBOOK, workbook!);
    });
    // Backups retain their original format version. Upgrade their appearance on
    // return as well, rather than waiting for the next application reload.
    refreshMetradoAppearance();
    return;
  }
  const workbook = excel.activeWorkbookId === METRADO_WORKBOOK ? { sheets: excel.sheets, activeSheetId: excel.activeSheetId } : excel.workbooks[METRADO_WORKBOOK];
  const backup = { model: metradoSnapshot(), workbook: workbook ? structuredClone(workbook) : undefined };
  const demo = createQuispeExample();
  metradoWorkbookTransaction(() => {
    useMetradoStore.setState({ ...demo, demoBackup: backup, dialog: null, targetItemId: null, selectedItemId: null });
    excel.replaceWorkbook(METRADO_WORKBOOK, { sheets: projectMetrado(demo), activeSheetId: METRADO_SHEETS.metrado });
  });
}
