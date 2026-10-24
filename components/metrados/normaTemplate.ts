import { useMetradoStore } from "../../store/useMetradoStore";
import { useWexelStore } from "../../store/useWexelStore";
import { commitEdit } from "../utils/excelEditing";
import { metradoSnapshot } from "./exampleTemplate";
import { createNormaItems, NORMA_SECTIONS, normaUnitKind, withNormaDetails } from "./normaCatalog";
import { mergeMetradoWorkbook, METRADO_WORKBOOK } from "./workbook";
import { projectMetrado } from "./workbook";
import { metradoWorkbookTransaction, refreshMetradoAppearance } from "./syncWorkbook";

/** Append a blank normative structure to the real project, never to the Q7 demonstration. */
export function applyNormaTemplate(scopes: string[]) {
  if (!scopes.length || scopes.some(s => !NORMA_SECTIONS.some(section => section.code === s))) throw new Error("Selecciona al menos una especialidad válida.");
  commitEdit();
  const model = useMetradoStore.getState(), excel = useWexelStore.getState();
  const base = model.demoBackup?.model ?? metradoSnapshot();
  const existing = withNormaDetails(base.items);
  const added = createNormaItems(scopes, existing);
  if (!added.length && existing === base.items && !model.demoBackup) { model.setDialog(null); return 0; }
  const units = new Set(added.flatMap(item => item.norma?.allowedUnits ?? []));
  const unitCatalog = [...base.unitCatalog, ...[...units].filter(code => !base.unitCatalog.some(u => u.code === code)).map(code => ({ code, kind: normaUnitKind(code) }))];
  const state = { ...base, items: [...existing, ...added], unitCatalog, view: "metrado" as const, summaryVisible: true };
  const previous = model.demoBackup ? model.demoBackup.workbook : excel.activeWorkbookId === METRADO_WORKBOOK ? { sheets: excel.sheets, activeSheetId: excel.activeSheetId } : excel.workbooks[METRADO_WORKBOOK];
  const workbook = mergeMetradoWorkbook(previous, projectMetrado(state), "metrado");
  metradoWorkbookTransaction(() => {
    useMetradoStore.setState({ ...state, demoBackup: undefined, dialog: null, targetItemId: null, selectedItemId: null });
    excel.replaceWorkbook(METRADO_WORKBOOK, workbook);
  });
  refreshMetradoAppearance();
  return added.length;
}
