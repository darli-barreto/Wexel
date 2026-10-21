import { Extension } from "@tiptap/react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    wordIndent: { changeIndent: (delta: number) => ReturnType };
  }
}

export const WordIndent = Extension.create({
  name: "wordIndent",
  addGlobalAttributes() {
    return [{ types: ["paragraph", "heading"], attributes: {
      indent: {
        default: 0,
        parseHTML: (element) => Math.max(0, Math.min(10, Math.round(parseFloat(element.style.marginLeft || "0") / 24))),
        renderHTML: (attributes) => attributes.indent ? { style: `margin-left: ${Number(attributes.indent) * 24}px` } : {},
      },
    } }];
  },
  addCommands() {
    return { changeIndent: (delta) => ({ tr, dispatch }) => {
      const { from, to } = tr.selection;
      let changed = false;
      tr.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type.name !== "paragraph" && node.type.name !== "heading") return;
        const indent = Math.max(0, Math.min(10, Number(node.attrs.indent ?? 0) + delta));
        if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent });
        changed = true;
      });
      return changed;
    } };
  },
});
