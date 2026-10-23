"use client";

import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { MIN_CELL_SIZE, MIN_ROW_HEIGHT, useWexelStore } from "@/store/useWexelStore";

export type ResizeAxis = "column" | "row";
export type StartResize = (event: MouseEvent<HTMLElement>, axis: ResizeAxis, key: string) => void;

/** Keep the drag tied to its original sheet and release every native listener. */
export function useExcelResize(sheetId: string): StartResize {
  const cleanupRef = useRef<(() => void) | null>(null);
  const viewMode = useWexelStore((state) => state.viewMode);

  useEffect(() => () => cleanupRef.current?.(), [sheetId, viewMode]);

  return useCallback((event, axis, key) => {
    if (event.button !== 0) return;
    const cell = event.currentTarget.closest("th, td");
    if (!cell) return;
    event.preventDefault();
    event.stopPropagation();
    cleanupRef.current?.();

    const bounds = cell.getBoundingClientRect();
    const start = axis === "column" ? event.clientX : event.clientY;
    const initial = axis === "column" ? bounds.width : bounds.height;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = axis === "column" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";

    let frame = 0;
    let pending: number | undefined;
    const apply = () => {
      frame = 0;
      if (pending === undefined) return;
      const size = pending; pending = undefined;
      const store = useWexelStore.getState();
      if (axis === "column") store.setColumnWidth(sheetId, key, size);
      else store.setRowHeight(sheetId, key, size);
    };

    const cleanup = () => {
      cancelAnimationFrame(frame); apply();
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", cleanup);
      window.removeEventListener("blur", cleanup);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      cleanupRef.current = null;
    };
    const move = (moveEvent: globalThis.MouseEvent) => {
      if (moveEvent.buttons === 0) { cleanup(); return; }
      const position = axis === "column" ? moveEvent.clientX : moveEvent.clientY;
      pending = Math.max(axis === "column" ? MIN_CELL_SIZE : MIN_ROW_HEIGHT, initial + position - start);
      if (!frame) frame = requestAnimationFrame(apply);
    };
    cleanupRef.current = cleanup;
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", cleanup);
    window.addEventListener("blur", cleanup);
  }, [sheetId]);
}
