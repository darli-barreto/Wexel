import { useMetradoStore } from '../../store/useMetradoStore';
import { useWexelStore } from '../../store/useWexelStore';
import { commitEdit } from '../utils/excelEditing';
import type { DetailChoice } from './detailChoices';
import { normaUnitKind } from './normaCatalog';
import { chooseDetail, restoreDetailVariant } from './selectDetailChoice';
import { relatedProvisionalDrainage } from './provisionalServices';

export function applyDetailChoice(itemId: string, lineId: string, option: DetailChoice) {
  commitEdit();
  const state = useMetradoStore.getState();
  const source = state.items.find(item => item.id === itemId);
  if (!source) return;
  const unit = option.unit ?? source.unit;
  const kind = state.unitCatalog.find(entry => entry.code === unit)?.kind ?? normaUnitKind(unit);
  const result = chooseDetail(state.items, itemId, lineId, option, kind);
  useMetradoStore.setState({ items: result.items, selectedItemId: result.itemId,
    unitCatalog: !unit || state.unitCatalog.some(entry => entry.code === unit) ? state.unitCatalog : [...state.unitCatalog, { code: unit, kind }],
  });
  focusDetail(result.itemId, result.lineId);
  return { ...result, suggestDrainageReview: Boolean(option.mode && option.id.startsWith('sanitary:') && relatedProvisionalDrainage(result.items, result.itemId)) };
}

export function restoreDetailChoice(itemId: string, lineId: string) {
  commitEdit();
  const result = restoreDetailVariant(useMetradoStore.getState().items, itemId, lineId);
  useMetradoStore.setState({ items: result.items, selectedItemId: result.itemId });
  focusDetail(result.itemId, result.lineId);
}

function focusDetail(itemId: string, lineId: string) {
  const excel = useWexelStore.getState(), sheet = excel.sheets.find(sheet => sheet.id === 'metrados-metrado');
  const row = sheet?.template?.rows[JSON.stringify(['measurement', itemId, lineId, ''])];
  if (sheet && row) excel.updateSheet(sheet.id, current => ({ ...current, selectedCell: { row: row - 1, col: 3 }, selectionEnd: undefined, selectionMode: 'cells', currentCell: 'D' + row, formulaInput: current.cells['D' + row]?.rawValue ?? '' }));
}
