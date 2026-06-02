// Rendert seinen Inhalt in einen separaten Container außerhalb der App-Shell.
// Dadurch lässt sich per Druck-CSS exakt nur dieser Bereich drucken
// (A4 quer), während die Bedienoberfläche ausgeblendet wird.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function PrintPortal({ children }: { children: ReactNode }) {
  const [el] = useState(() => {
    const div = document.createElement('div');
    div.className = 'print-root';
    return div;
  });
  const ref = useRef(el);
  useEffect(() => {
    const node = ref.current;
    document.body.appendChild(node);
    return () => {
      if (node.parentNode) node.parentNode.removeChild(node);
    };
  }, []);
  return createPortal(children, ref.current);
}
