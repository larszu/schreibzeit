// Bild-Zuschnitt für eigene Lineaturen: Bild hochladen, mit der Maus einen
// Streifen markieren, zuschneiden und als eigene Lineatur speichern.
import { useRef, useState } from 'react';
import { IconUpload, IconCheck } from './icons';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function LineaturCropper({
  onSave,
}: {
  onSave: (name: string, bildUrl: string, hoeheMm: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [name, setName] = useState('');
  const [hoehe, setHoehe] = useState(8);

  function onFile(file: File) {
    setSrc(URL.createObjectURL(file));
    setRect(null);
  }

  function pos(e: React.MouseEvent) {
    const r = imgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function onDown(e: React.MouseEvent) {
    if (!imgRef.current) return;
    const p = pos(e);
    dragStart.current = p;
    setRect({ x: p.x, y: p.y, w: 0, h: 0 });
  }
  function onMove(e: React.MouseEvent) {
    if (!dragStart.current) return;
    const p = pos(e);
    const s = dragStart.current;
    setRect({
      x: Math.min(s.x, p.x),
      y: Math.min(s.y, p.y),
      w: Math.abs(p.x - s.x),
      h: Math.abs(p.y - s.y),
    });
  }
  function onUp() {
    dragStart.current = null;
  }

  function speichern() {
    const img = imgRef.current;
    if (!img || !rect || rect.w < 5 || rect.h < 5) return;
    const scale = img.naturalWidth / img.clientWidth;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(rect.w * scale);
    canvas.height = Math.round(rect.h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(
      img,
      rect.x * scale,
      rect.y * scale,
      rect.w * scale,
      rect.h * scale,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    onSave(name.trim() || 'Eigene Lineatur', canvas.toDataURL('image/png'), hoehe);
    setSrc(null);
    setRect(null);
    setName('');
  }

  return (
    <div className="rounded-lg border border-paper-200 p-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
      {!src ? (
        <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
          <IconUpload width={18} height={18} /> Bild für Lineatur wählen
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-ink-soft">
            Ziehen Sie mit der Maus ein Rechteck um <strong>eine Schreibzeile</strong> (Streifen).
          </p>
          <div
            className="relative inline-block max-w-full cursor-crosshair select-none overflow-hidden rounded border border-paper-300"
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
          >
            <img
              ref={imgRef}
              src={src}
              alt="Vorlage"
              draggable={false}
              className="block max-h-72 max-w-full"
            />
            {rect && (
              <div
                className="pointer-events-none absolute border-2 border-brand-500 bg-brand-500/15"
                style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input max-w-[12rem]"
              placeholder="Name der Lineatur"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label className="flex items-center gap-1 text-sm text-ink-soft">
              Höhe
              <input
                type="number"
                min={3}
                max={20}
                step="0.5"
                className="input w-20"
                value={hoehe}
                onChange={(e) => setHoehe(Math.max(3, Math.min(20, Number(e.target.value) || 8)))}
              />
              mm
            </label>
            <button
              className="btn-primary"
              onClick={speichern}
              disabled={!rect || rect.w < 5 || rect.h < 5}
            >
              <IconCheck width={18} height={18} /> Zuschneiden &amp; speichern
            </button>
            <button className="btn-ghost" onClick={() => setSrc(null)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
