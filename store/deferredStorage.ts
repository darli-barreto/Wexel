import type { PersistStorage, StorageValue } from "zustand/middleware";
import { encodeSnapshot, decodeSnapshot } from "./storageCodec";

/** Do not stringify on focus/selection. Batch durable changes outside input events. */
export function deferredStorage<T>(fingerprint: (state: T) => readonly unknown[], navigation?: (state: T) => Partial<T>, compress = false): PersistStorage<T> {
  let previous: readonly unknown[] | undefined;
  let previousNavigation: string | undefined;
  let pending: { name: string; value: StorageValue<T> } | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let listening = false;
  const flush = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    if (!pending) return;
    const { name, value } = pending;
    localStorage.setItem(name, compress ? encodeSnapshot(value) : JSON.stringify(value));
    pending = undefined;
  };
  return {
    getItem: (name) => {
      const value = localStorage.getItem(name);
      previous = undefined;
      previousNavigation = undefined;
      if (!value) return null;
      const saved = (compress ? decodeSnapshot(value) : JSON.parse(value)) as StorageValue<T>;
      const selected = navigation ? localStorage.getItem(name + ":navigation") : null;
      return selected ? { ...saved, state: { ...saved.state, ...JSON.parse(selected) } } : saved;
    },
    setItem: (name, value) => {
      // A tab switch stores only its tiny navigation record, never the workbook payload.
      if (navigation) {
        const selected = JSON.stringify(navigation(value.state));
        if (selected !== previousNavigation) { localStorage.setItem(name + ":navigation", selected); previousNavigation = selected; }
      }
      const next = fingerprint(value.state);
      if (previous && previous.length === next.length && next.every((part, i) => Object.is(part, previous![i]))) return;
      previous = next;
      pending = { name, value };
      if (typeof window === "undefined") { flush(); return; }
      if (!listening) {
        listening = true;
        window.addEventListener("pagehide", flush);
        document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, 250);
    },
    removeItem: (name) => { pending = undefined; previous = undefined; previousNavigation = undefined; if (timer) clearTimeout(timer); localStorage.removeItem(name); if (navigation) localStorage.removeItem(name + ":navigation"); },
  };
}
