// Rendert seinen Inhalt in einen separaten Container außerhalb der App-Shell.
// Dadurch lässt sich per Druck-CSS exakt nur dieser Bereich drucken
// (A4 quer), während die Bedienoberfläche ausgeblendet wird.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function PrintPortal({ children, solo }: { children: ReactNode; solo?: boolean }) {
  const [el] = useState(() => {
    const div = document.createElement('div');
    div.className = solo ? 'print-root print-solo' : 'print-root';
    return div;
  });
  const ref = useRef(el);
  useEffect(() => {
    const node = ref.current;
    document.body.appendChild(node);
    // Solo-Druck: andere (Dauer-)Druckbereiche während dieses Drucks ausblenden,
    // damit z. B. ein Namensschlüssel nicht zusammen mit dem Knickblatt gedruckt wird.
    if (solo) document.body.classList.add('has-solo-print');
    return () => {
      if (node.parentNode) node.parentNode.removeChild(node);
      if (solo) document.body.classList.remove('has-solo-print');
    };
  }, [solo]);
  return createPortal(children, ref.current);
}
