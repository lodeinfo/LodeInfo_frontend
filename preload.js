const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  versions: process.versions,

  /* ✅ NEW → Listen for contextual data */
  onContextData: (callback) => {
    ipcRenderer.on("context-data", (event, data) => {
      callback(data);
    });
  },
});
