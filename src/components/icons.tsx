// Schlanke Inline-SVG-Icons (keine externe Icon-Abhängigkeit, offline-fest).
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
});

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </svg>
);
export const IconEdit = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
export const IconPrint = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
  </svg>
);
export const IconBook = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
export const IconFold = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 7l4-4M20 7l-4-4M4 17h16M4 17l4 4M20 17l-4 4" strokeDasharray="2 2" />
  </svg>
);
export const IconSparkles = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3zM5 15l.9 2.1L8 18l-2.1.9L5 21l-.9-2.1L2 18l2.1-.9L5 15z" />
  </svg>
);
export const IconCards = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="13" height="9" rx="1.5" />
    <path d="M8 19h11a2 2 0 0 0 2-2V9" />
  </svg>
);
export const IconSettings = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 3.6V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9H21a2 2 0 0 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15z" />
  </svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
export const IconClose = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);
export const IconUpload = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 12h18M3 6h18M3 18h18" />
  </svg>
);
