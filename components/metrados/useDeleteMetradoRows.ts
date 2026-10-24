"use client";

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useWexelStore } from '../../store/useWexelStore';
import { commitEdit } from '../utils/excelEditing';
import { deleteMetradoRow } from './syncWorkbook';

// Give the loading state a paint before synchronous calculation; no artificial waiting time.
const afterPaint = () => new Promise<void>(resolve => {
  if (document.visibilityState === 'hidden') { setTimeout(resolve, 0); return; }
  requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
});
const nextTask = () => new Promise<void>(resolve => setTimeout(resolve, 0));
let deleteNotificationId = 0;
let deletionInFlight = false;

export function useDeleteMetradoRows() {
  const [deleting, setDeleting] = useState(false);
  const inFlight = useRef(false);
  const removeRows = () => {
    if (inFlight.current || deletionInFlight) return;
    commitEdit();
    const excel = useWexelStore.getState();
    const target = excel.sheets.find(sheet => sheet.id === excel.activeSheetId);
    if (!target) { toast.info('Selecciona una fila para eliminar.'); return; }
    const heading = target.template ? target.id === 'metrados-acero' ? 2 : 1 : 0;
    const first = target.selectedCell?.row ?? Number(target.currentCell.match(/\d+$/)?.[0]) - 1;
    const last = target.selectionEnd?.row ?? first;
    if (Math.max(first, last) < heading) { toast.info('La cabecera se conserva.', { description: 'Selecciona una partida, un detalle o una fila de datos para eliminar.' }); return; }
    const selection = JSON.stringify([target.currentCell, target.selectedCell, target.selectionEnd]);
    inFlight.current = true; deletionInFlight = true; setDeleting(true);
    // Sonner queues rendering in a timer. Register the loading toast first, then
    // let that timer and the browser paint run before the synchronous worksheet work.
    const operation = async () => {
      await nextTask();
      await afterPaint();
      const shownAt = performance.now();
      try {
        const current = useWexelStore.getState(), sheet = current.sheets.find(sheet => sheet.id === target.id);
        if (current.activeWorkbookId !== excel.activeWorkbookId || current.activeSheetId !== target.id || !sheet || sheet.cells !== target.cells || JSON.stringify([sheet.currentCell, sheet.selectedCell, sheet.selectionEnd]) !== selection) {
          throw new Error('La hoja o la selección cambió. No se eliminó ninguna fila; vuelve a seleccionar lo que deseas eliminar.');
        }
        const result = deleteMetradoRow();
        await afterPaint();
        return result;
      } finally {
        inFlight.current = false; deletionInFlight = false; setDeleting(false);
        // Keep fast feedback readable without delaying deletion or locking the UI.
        const remaining = 600 - (performance.now() - shownAt);
        if (remaining > 0) await new Promise<void>(resolve => setTimeout(resolve, remaining));
      }
    };
    toast.promise(operation, {
      id: `metrado-delete-rows-${++deleteNotificationId}`, loading: 'Eliminando…',
      className: 'metrado-delete-feedback',
      description: 'Actualizando numeración, totales y resumen.',
      dismissible: false, closeButton: false,
      success: result => ({ message: result ? 'Eliminado.' : 'No había filas para eliminar.', description: result ? 'Tarea completada: numeración, totales y resumen actualizados.' : 'La cabecera se conserva.', dismissible: true, closeButton: true }),
      error: error => ({ message: 'No se pudo completar la eliminación.', description: error instanceof Error ? error.message : 'Revisa la hoja y vuelve a intentarlo.', dismissible: true, closeButton: true, duration: 6500 }),
    });
  };
  return { deleting, removeRows };
}
