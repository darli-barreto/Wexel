import { create } from 'zustand';
import { useWexelStore } from './useWexelStore';
import { useMetradoStore } from './useMetradoStore';
import { commitEdit } from '../components/utils/excelEditing';
import { buildMetradoReport, type MetradoReport } from '../components/metrados/documentPreview';

/** Preview is ephemeral; it never replaces the saved Word document or worksheet cells. */
export const useMetradoPreviewStore = create<{ active: boolean; report: MetradoReport | null; error: string }>(() => ({ active: false, report: null, error: '' }));
export function closeMetradoPreview() {
  useMetradoPreviewStore.setState({ active: false, report: null, error: '' });
  useWexelStore.getState().setViewMode('excel');
}
export function openMetradoPreview() {
  commitEdit();
  useMetradoPreviewStore.setState({ active: true, report: null, error: '' });
  useWexelStore.getState().setViewMode('word');
  requestAnimationFrame(() => requestAnimationFrame(refreshMetradoPreview));
}
export function refreshMetradoPreview() {
    if (!useMetradoPreviewStore.getState().active) return;
    try {
      const excel = useWexelStore.getState();
      const workbook = excel.activeWorkbookId === 'Metrados' ? { sheets: excel.sheets, activeSheetId: excel.activeSheetId } : excel.workbooks.Metrados;
      const context = document.createElement('canvas').getContext('2d');
      const report = buildMetradoReport(useMetradoStore.getState(), workbook, context ? (text, bold, size) => {
        context.font = `${bold ? 'bold ' : ''}${size}px Helvetica, Arial, sans-serif`;
        return context.measureText(text).width;
      } : undefined);
      useMetradoPreviewStore.setState({ report });
    } catch {
      useMetradoPreviewStore.setState({ error: 'No se pudo preparar la vista previa. Vuelve al metrado e inténtalo nuevamente.' });
    }
}
