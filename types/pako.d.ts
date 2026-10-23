declare module "pako" {
  export function deflate(input: string, options: { to: "string"; level?: number }): string;
  export function inflate(input: string, options: { to: "string" }): string;
}
