// Schlanker Preload: stellt eine minimale, sichere Info-Brücke bereit.
// Die App selbst ist vollständig local-first und benötigt keine Node-APIs.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('schreibzeit', {
  istDesktop: true,
  plattform: process.platform,
});
