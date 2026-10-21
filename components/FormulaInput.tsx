"use client";
import { useLayoutEffect, useRef, type CSSProperties, type InputHTMLAttributes, type ChangeEventHandler, type FocusEventHandler, type KeyboardEventHandler } from 'react';
import { formulaReferences } from './utils/formulaReferences';
type Input = HTMLInputElement | HTMLTextAreaElement;
type Props = Omit<InputHTMLAttributes<Input>, 'onChange' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'value'> & {
    value: string;
    multiline?: boolean;
    highlight?: boolean;
    onChange?: ChangeEventHandler<Input>;
    onFocus?: FocusEventHandler<Input>;
    onBlur?: FocusEventHandler<Input>;
    onKeyDown?: KeyboardEventHandler<Input>;
};
export default function FormulaInput({ value, multiline = false, highlight = true, style, className, onChange, onFocus, onBlur, onKeyDown, ...props }: Props) {
    const input = useRef<Input | null>(null), mirror = useRef<HTMLDivElement>(null), text = useRef<HTMLDivElement>(null);
    const references = highlight ? formulaReferences(value) : [];
    const colored = references.length > 0;
    const sync = () => {
        if (!input.current || !mirror.current || !text.current)
            return;
        const computed = getComputedStyle(input.current);
        for (const key of ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textAlign', 'textDecoration', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'] as const)
            mirror.current.style[key] = computed[key];
        mirror.current.style.color = style?.color ?? '#171717';
        text.current.style.transform = 'translate(' + (-input.current.scrollLeft) + 'px,' + (-input.current.scrollTop) + 'px)';
    };
    useLayoutEffect(() => { sync(); const frame = requestAnimationFrame(sync); return () => cancelAnimationFrame(frame); });
    const offset = references.at(-1)?.end ?? 0;
    const pieces = references.flatMap((ref, index) => [<span key={'plain' + index}>{value.slice(references[index - 1]?.end ?? 0, ref.start)}</span>, <span key={'ref' + index} data-formula-reference={ref.text} style={{ color: ref.color }}>{ref.text}</span>]);
    const inputStyle: CSSProperties = { ...style, display: 'block', ...(colored ? { color: 'transparent', WebkitTextFillColor: 'transparent', caretColor: style?.color ?? '#171717' } : {}) };
    const common = { ...props, value, className, style: inputStyle, onChange, onFocus, onBlur, onKeyDown, onScroll: sync, onSelect: () => requestAnimationFrame(sync) };
    return <div className="relative min-w-0 w-full" style={{ flex: '1 1 0%', fontFamily: style?.fontFamily, fontSize: style?.fontSize }}>
  {multiline ? <textarea {...common} ref={element => { input.current = element; }}/> : <input {...common} ref={element => { input.current = element; }}/>}
  {colored && <div ref={mirror} aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderStyle: 'solid', borderColor: 'transparent' }}><div ref={text} style={{ whiteSpace: multiline ? 'pre-wrap' : 'pre', overflowWrap: multiline ? 'anywhere' : undefined, minWidth: '100%', width: multiline ? '100%' : 'max-content' }}>{pieces}{value.slice(offset)}{value.endsWith('\n') ? '\u200b' : ''}</div></div>}
 </div>;
}
