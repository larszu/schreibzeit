/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string;

interface Window {
  schreibzeit?: { istDesktop: boolean; plattform: string };
}

declare module 'hyphen/de' {
  export function hyphenateSync(text: string, options?: { hyphenChar?: string }): string;
  export function hyphenate(text: string, options?: { hyphenChar?: string }): Promise<string>;
}
