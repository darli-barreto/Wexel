import { create } from "zustand";
import type { Editor } from "@tiptap/react";

// The live editor is intentionally excluded from document persistence.
export const useWordEditorStore = create<{
  editor: Editor | null;
  showMarks: boolean;
  toggleMarks: () => void;
  setEditor: (editor: Editor | null) => void;
}>((set) => ({ editor: null, showMarks: false, toggleMarks: () => set(state => ({showMarks: !state.showMarks})), setEditor: (editor) => set({ editor }) }));
