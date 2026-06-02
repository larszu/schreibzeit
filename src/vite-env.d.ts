/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'hyphen/de' {
  export function hyphenateSync(text: string, options?: { hyphenChar?: string }): string;
  export function hyphenate(text: string, options?: { hyphenChar?: string }): Promise<string>;
}
