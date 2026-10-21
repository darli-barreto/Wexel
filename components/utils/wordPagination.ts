import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";

export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1123;
export const PAGE_MARGIN = 80;
export const PAGE_GAP = 24;
const CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_MARGIN * 2;
const PAGE_STRIDE = PAGE_HEIGHT + PAGE_GAP;

interface PageBreak { pos: number; height: number }
interface Line { pos: number; top: number; bottom: number }
interface PageLayout { breaks: PageBreak[]; pages: number }
const paginationKey = new PluginKey<DecorationSet>("wexelPagination");

/** Measure browser wrapping, including a single paragraph spanning pages. */
function measureLines(view: EditorView): Line[] {
  const origin = view.dom.getBoundingClientRect().top;
  const lines: Line[] = [];
  const range = document.createRange();
  const add = (pos: number, rect: DOMRect) => {
    if (!rect.height) return;
    const top = rect.top - origin;
    const bottom = rect.bottom - origin;
    const previous = lines[lines.length - 1];
    if (previous && Math.abs(previous.top - top) < 1) {
      previous.bottom = Math.max(previous.bottom, bottom);
    } else lines.push({ pos, top, bottom });
  };
  view.state.doc.descendants((node, pos) => {
    if (!node.isTextblock && !node.isLeaf) return true;
    const element = view.nodeDOM(pos);
    if (!(element instanceof HTMLElement)) return false;
    if (!node.isTextblock) {
      add(pos, element.getBoundingClientRect());
      return false;
    }
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let text = walker.nextNode();
    let measured = false;
    while (text) {
      if (text instanceof HTMLBRElement) {
        const breakPos = view.posAtDOM(text, 0);
        const caret = view.coordsAtPos(breakPos);
        add(breakPos, new DOMRect(caret.left, caret.top, 1, caret.bottom - caret.top));
      } else if (text instanceof Text && !text.parentElement?.closest("[data-page-break]")) {
        const value = text.textContent ?? "";
        for (let offset = 0; offset < value.length;) {
          const length = (value.codePointAt(offset) ?? 0) > 0xffff ? 2 : 1;
          range.setStart(text, offset);
          range.setEnd(text, offset + length);
          const rect = range.getBoundingClientRect();
          add(view.posAtDOM(text, offset), rect);
          measured ||= rect.height > 0;
          offset += length;
        }
      }
      text = walker.nextNode();
    }
    // Empty paragraphs and trailing hard breaks also occupy a line.
    if (!measured || node.lastChild?.type.name === "hardBreak") {
      const caret = view.coordsAtPos(pos + node.content.size + 1);
      add(pos + node.content.size + 1, new DOMRect(caret.left, caret.top, 1, caret.bottom - caret.top));
    }
    return false;
  });
  return lines;
}

function paginate(lines: Line[]): PageLayout {
  let page = 0;
  let displacement = 0;
  const breaks: PageBreak[] = [];
  for (const line of lines) {
    if (line.bottom + displacement > page * PAGE_STRIDE + CONTENT_HEIGHT + 0.5) {
      page++;
      const height = Math.max(0, page * PAGE_STRIDE - line.top - displacement);
      breaks.push({ pos: line.pos, height });
      displacement += height;
    }
  }
  return { breaks, pages: page + 1 };
}

/** View-only page gaps never enter saved HTML or undo history. */
export const WordPagination = Extension.create<{ onPages: (pages: number) => void }>({
  name: "wordPagination",
  addOptions: () => ({ onPages: () => undefined }),
  addProseMirrorPlugins() {
    const onPages = this.options.onPages;
    return [new Plugin<DecorationSet>({
      key: paginationKey,
      state: {
        init: () => DecorationSet.empty,
        apply(transaction, previous) {
          const layout: PageLayout | undefined = transaction.getMeta(paginationKey);
          if (!layout) return previous.map(transaction.mapping, transaction.doc);
          return DecorationSet.create(transaction.doc, layout.breaks.map(({ pos, height }, index) =>
            Decoration.widget(pos, () => {
              const gap = document.createElement("span");
              gap.dataset.pageBreak = "true";
              gap.setAttribute("aria-hidden", "true");
              gap.contentEditable = "false";
              gap.style.cssText = `display:block;height:${height}px;pointer-events:none;user-select:none`;
              return gap;
            }, { side: -1, key: `page-${index}-${height}`, ignoreSelection: true }),
          ));
        },
      },
      props: { decorations: (state) => paginationKey.getState(state) },
      view(view) {
        let frame = 0;
        let destroyed = false;
        let signature = "";
        const measure = () => {
          frame = 0;
          if (destroyed || view.composing || !view.dom.getClientRects().length) return;
          const widgets = Array.from(view.dom.querySelectorAll<HTMLElement>("[data-page-break]"));
          widgets.forEach((widget) => { widget.style.display = "none"; });
          let layout: PageLayout;
          try { layout = paginate(measureLines(view)); }
          finally { widgets.forEach((widget) => { widget.style.display = "block"; }); }
          const nextSignature = JSON.stringify(layout);
          if (nextSignature !== signature) {
            signature = nextSignature;
            view.dispatch(view.state.tr.setMeta(paginationKey, layout).setMeta("addToHistory", false));
            onPages(layout.pages);
          }
        };
        const schedule = () => {
          if (!destroyed && !frame) frame = requestAnimationFrame(measure);
        };
        const observer = new ResizeObserver(schedule);
        observer.observe(view.dom);
        view.dom.addEventListener("compositionend", schedule);
        document.fonts.addEventListener("loadingdone", schedule);
        schedule();
        return {
          update(updatedView, previousState) {
            if (!updatedView.state.doc.eq(previousState.doc)) schedule();
          },
          destroy() {
            destroyed = true;
            cancelAnimationFrame(frame);
            observer.disconnect();
            view.dom.removeEventListener("compositionend", schedule);
            document.fonts.removeEventListener("loadingdone", schedule);
          },
        };
      },
    })];
  },
});
