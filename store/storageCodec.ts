import { deflate, inflate } from "pako";

const PREFIX = "wexel-zlib-v1:";
/** Backward compatible: old plain JSON remains readable; large snapshots use fast DEFLATE. */
export function encodeSnapshot(value: unknown): string {
  const json = JSON.stringify(value);
  return json.length < 100_000 ? json : PREFIX + deflate(json, { to: "string", level: 1 });
}
export function decodeSnapshot(value: string): unknown {
  return JSON.parse(value.startsWith(PREFIX) ? inflate(value.slice(PREFIX.length), { to: "string" }) : value);
}
