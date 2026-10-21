import { Extension } from "@tiptap/react";
export const textEffects = { none: "none", shadow: "2px 2px 3px #888", outline: "-1px 0 #5f9dce, 0 1px #5f9dce, 1px 0 #5f9dce, 0 -1px #5f9dce", glow: "0 0 5px #5f9dce, 0 0 10px #5f9dce" };
export const WordTypography = Extension.create({
 name: "wordTypography",
 addGlobalAttributes() { return [
  { types: ["paragraph", "heading"], attributes: {
   lineHeight: { default: null, parseHTML: e => e.style.lineHeight || null, renderHTML: a => a.lineHeight ? {style: 'line-height: '+a.lineHeight} : {} },
   spaceAfter: { default: null, parseHTML: e => e.style.marginBottom || null, renderHTML: a => a.spaceAfter ? {style: 'margin-bottom: '+a.spaceAfter} : {} },
   borderStyle: { default: null, parseHTML: e => e.getAttribute('data-border'), renderHTML: a => a.borderStyle ? {'data-border': a.borderStyle, style: a.borderStyle === 'all' ? 'border: 1px solid #333; padding: 4px' : a.borderStyle === 'bottom' ? 'border-bottom: 1px solid #333' : 'border: none'} : {} },
  }},
  { types: ["textStyle"], attributes: { textEffect: { default: null, parseHTML: e => e.getAttribute('data-text-effect'), renderHTML: a => a.textEffect ? {'data-text-effect': a.textEffect, style: 'text-shadow: '+(textEffects[a.textEffect as keyof typeof textEffects] ?? 'none')} : {} } } }
 ]; }
});
