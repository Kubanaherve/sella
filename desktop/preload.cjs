const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sellaDesktop", {
  product: "Sella",
  company: "KUBANA Friend TECHNOLOGIES",
  platform: process.platform,
  print: () => ipcRenderer.invoke("sella:print"),
});
