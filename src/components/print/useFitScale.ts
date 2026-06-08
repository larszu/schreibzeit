import { useCallback, useRef, useState } from 'react';

/**
 * Skaliert eine feste mm-/px-Breite so, dass sie in den Container passt.
 *
 * Nutzt eine Callback-Ref (statt einer Mount-Effect-Messung), damit auch dann
 * korrekt gemessen wird, wenn der Container erst spät erscheint – z. B. nachdem
 * asynchron geladene Daten den anfänglichen Leerzustand ablösen. Eine einmalige
 * Messung beim Mounten würde diesen Fall verpassen und bei Skalierung 1 bleiben.
 */
export function useFitScale(
  pageWidthPx: number,
): [(el: HTMLDivElement | null) => void, number] {
  const [scale, setScale] = useState(1);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!el) return;
      const update = () => setScale(Math.min(1, el.clientWidth / pageWidthPx));
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      observerRef.current = ro;
    },
    [pageWidthPx],
  );

  return [ref, scale];
}
