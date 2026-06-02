import { useEffect, useRef, useState } from 'react';

/** Skaliert eine feste mm-/px-Breite so, dass sie in den Container passt. */
export function useFitScale(pageWidthPx: number): [React.RefObject<HTMLDivElement>, number] {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      setScale(Math.min(1, w / pageWidthPx));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageWidthPx]);
  return [containerRef, scale];
}
