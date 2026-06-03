// Wiederverwendbare UI-Bausteine: Modal, Bestätigungsdialog, Badges.
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from './icons';

export function Modal({
  offen,
  titel,
  onClose,
  children,
  weit,
}: {
  offen: boolean;
  titel: string;
  onClose: () => void;
  children: ReactNode;
  weit?: boolean;
}) {
  useEffect(() => {
    if (!offen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [offen, onClose]);

  if (!offen) return null;
  // Über ein Portal an <body> rendern, damit der Dialog nicht von
  // transformierten Vorfahren (z. B. der Sidebar) beschnitten wird.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden bg-ink/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={titel}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`card my-4 flex max-h-[calc(100dvh-2rem)] w-full flex-col ${
          weit ? 'max-w-3xl' : 'max-w-lg'
        } animate-[fadeIn_0.12s_ease-out]`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-paper-200 px-5 py-3.5">
          <h2 className="font-serif text-lg font-semibold text-ink">{titel}</h2>
          <button className="btn-ghost -mr-2 p-1.5" onClick={onClose} aria-label="Schließen">
            <IconClose />
          </button>
        </div>
        {/* Eigene Kompositionsebene + overscroll-contain verhindern Repaint-
            Artefakte (Geister-Text) beim Scrollen langer Inhalte in Chromium. */}
        <div className="overflow-y-auto overscroll-contain px-5 py-4 [transform:translateZ(0)]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function Accordion({
  titel,
  beschreibung,
  defaultOpen,
  children,
}: {
  titel: string;
  beschreibung?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      className="group rounded-lg border border-paper-200 bg-white open:shadow-soft"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3">
        <div>
          <span className="font-serif font-semibold text-ink">{titel}</span>
          {beschreibung && <p className="text-xs text-ink-faint">{beschreibung}</p>}
        </div>
        <span className="text-ink-faint transition-transform group-open:rotate-90" aria-hidden>
          ›
        </span>
      </summary>
      <div className="border-t border-paper-200 px-4 py-4">{children}</div>
    </details>
  );
}

export function StatusBadge({ status }: { status: 'neu' | 'wird_geuebt' | 'sitzt' }) {
  const map = {
    neu: { label: 'neu', cls: 'bg-paper-200 text-ink-soft' },
    wird_geuebt: { label: 'wird geübt', cls: 'bg-accent-400/20 text-accent-600' },
    sitzt: { label: 'sitzt', cls: 'bg-brand-100 text-brand-700' },
  } as const;
  const s = map[status];
  return <span className={`chip ${s.cls}`}>{s.label}</span>;
}

export function EmptyState({ titel, text, children }: { titel: string; text?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-paper-300 bg-paper-50 px-6 py-12 text-center">
      <p className="font-serif text-lg font-medium text-ink">{titel}</p>
      {text && <p className="mt-1 max-w-md text-sm text-ink-soft">{text}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
