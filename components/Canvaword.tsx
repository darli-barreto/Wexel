"use client";

import PageBand from "./PageBand";
import { WordTypography } from "./utils/wordTypography";
import { useEffect, useRef } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { WordIndent } from "./utils/wordIndent";
import { useWordEditorStore } from "@/store/useWordEditorStore";
import StarterKit from "@tiptap/starter-kit";
import { useWexelStore } from "@/store/useWexelStore";
import { WordPagination, PAGE_WIDTH, PAGE_HEIGHT, PAGE_MARGIN, PAGE_GAP } from "./utils/wordPagination";
import styles from "./WordCanvas.module.css";
import { useMetradoPreviewStore, refreshMetradoPreview } from '@/store/useMetradoPreviewStore';
import MetradoDocumentPages from './metrados/MetradoDocumentPages';

interface CanvawordProps { isSplit?: boolean }

function saveDocument(editor: Editor) {
  const text = editor.getText({ blockSeparator: " " }).trim();
  useWexelStore.getState().setWordContent(editor.getHTML(), text ? text.split(/\s+/u).length : 0);
}

export default function Canvaword({ isSplit = false }: CanvawordProps) {
  const canvas = useRef<HTMLDivElement>(null);
  const preview = useMetradoPreviewStore(state => state.active);
  const report = useMetradoPreviewStore(state => state.report);
  const previewError = useMetradoPreviewStore(state => state.error);
  useEffect(() => { if (preview) canvas.current?.scrollTo({ top: 0, left: 0 }); }, [preview, report]);
  useEffect(() => {
    if (!preview) return;
    let pending: ReturnType<typeof setTimeout>;
    const stop = useWexelStore.subscribe((next, previous) => {
      if (next.contentRevision === previous.contentRevision) return;
      clearTimeout(pending);
      pending = setTimeout(refreshMetradoPreview, 100);
    });
    return () => { stop(); clearTimeout(pending); };
  }, [preview]);
  const showMarks = useWordEditorStore(state => state.showMarks);
  const content = useWexelStore((state) => state.word.content);
  const totalPages = useWexelStore((state) => state.word.totalPages);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, TextAlign.configure({ types: ["heading", "paragraph"], defaultAlignment: "left" }),
      TextStyleKit, Highlight.configure({ multicolor: true }), Subscript, Superscript, WordIndent, WordTypography, WordPagination.configure({
      onPages: (pages) => {
        const state = useWexelStore.getState();
        if (state.word.totalPages !== pages) state.setWordPages(pages);
      },
    })],
    editorProps: {
      attributes: { class: styles.editor + (showMarks ? " wexel-show-marks" : ""), role: "textbox", "aria-label": "Documento de Word", "aria-multiline": "true" },
    },
    onUpdate: ({ editor }) => saveDocument(editor),
    onFocus: () => useWexelStore.getState().setActiveFocus("word"),
  });

  useEffect(() => {
    useWordEditorStore.getState().setEditor(editor);
    return () => { useWordEditorStore.getState().setEditor(null); };
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed || editor.getHTML() === content) return;
    // Restore persisted HTML without resetting the caret on ordinary typing.
    editor.commands.setContent(content || "<p></p>", { emitUpdate: false });
  }, [editor, content]);

  return (
    <div ref={canvas} data-word-canvas className="flex-1 border-y h-full border-tertiary px-10 py-10 overflow-auto hide-scrollbar">
      {preview ? (report ? <MetradoDocumentPages report={report} isSplit={isSplit} /> : <p role={previewError ? 'alert' : 'status'} className="text-sm text-center text-[#555]">{previewError || 'Preparando vista previa de Metrado, Acero y Resumen…'}</p>) :
      <div className={styles.document}
        style={{ width: PAGE_WIDTH, height: totalPages * PAGE_HEIGHT + (totalPages - 1) * PAGE_GAP,
          marginInline: isSplit ? 0 : "auto" }}>
        <div className={styles.pages}>
          {Array.from({ length: totalPages }, (_, index) => (
            <div key={index} className="border bg-white shadow-lg border-tertiary"
              style={{ position: "absolute", width: PAGE_WIDTH, height: PAGE_HEIGHT, top: index * (PAGE_HEIGHT + PAGE_GAP) }}>
              <PageBand band="header" page={index + 1} /><PageBand band="footer" page={index + 1} />
            </div>
          ))}
        </div>
        <div style={{ position: "relative", paddingTop: PAGE_MARGIN, marginInline: PAGE_MARGIN }}>
          <EditorContent editor={editor} />
        </div>
      </div>}
    </div>
  );
}
