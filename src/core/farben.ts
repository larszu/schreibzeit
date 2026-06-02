// Farbpalette für Klassen (zur visuellen Unterscheidung in der Kinderliste).
export const KLASSEN_FARBEN = [
  '#2f6f5e', // brand-grün
  '#cf8a36', // bernstein
  '#c0492f', // terracotta
  '#3b6ea5', // blau
  '#7a4fa3', // violett
  '#4a8f3c', // grün
  '#b3712a', // ocker
  '#5b6066', // grau
];

/** Liefert eine Standardfarbe anhand eines Index (rotiert). */
export function farbeFuerIndex(i: number): string {
  return KLASSEN_FARBEN[((i % KLASSEN_FARBEN.length) + KLASSEN_FARBEN.length) % KLASSEN_FARBEN.length];
}
