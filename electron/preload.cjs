// Schlanker Preload: stellt eine minimale, sichere Info-/Druck-Brücke bereit.
// Die App selbst ist vollständig local-first und benötigt keine Node-APIs.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('schreibzeit', {
  istDesktop: true,
  plattform: process.platform,
  // Nativer Druck (vermeidet die Windows-Meldung „keine Seitenansicht").
  print: () => ipcRenderer.invoke('sz-print'),
  printToPDF: () => ipcRenderer.invoke('sz-print-pdf'),
});
