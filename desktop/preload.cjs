const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("sellaDesktop", {
  product: "Sella",
  company: "KUBANA Friend TECHNOLOGIES",
  platform: process.platform,
});
