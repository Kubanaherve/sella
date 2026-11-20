import { mkdirSync, writeFileSync } from "node:fs";

const port = process.env.CDP_PORT || "9223";
const outDir = "qa-evidence/desktop";
mkdirSync(outDir, { recursive: true });

const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
const page = list.find((t) => t.type === "page");
if (!page) throw new Error("no page");

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
function send(method, params = {}) {
  const msgId = ++id;
  ws.send(JSON.stringify({ id: msgId, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(msgId, { resolve, reject });
  });
}
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
});
await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
await send("Runtime.enable");
await send("Page.enable");

const name = process.argv[2] || "screen";
if (process.env.CDP_WIDTH && process.env.CDP_HEIGHT) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: Number(process.env.CDP_WIDTH),
    height: Number(process.env.CDP_HEIGHT),
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((resolve) => setTimeout(resolve, 200));
}
if (process.env.CDP_GOTO) {
  await send("Page.navigate", { url: process.env.CDP_GOTO });
  await new Promise((resolve) => setTimeout(resolve, Number(process.env.CDP_WAIT || 900)));
}
if (process.env.CDP_RELOAD === "1") {
  await send("Page.reload", { ignoreCache: true });
  await new Promise((resolve) => setTimeout(resolve, Number(process.env.CDP_WAIT || 250)));
}
const expr = process.argv[3];
if (expr) {
  const result = await send("Runtime.evaluate", {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  console.log(JSON.stringify(result, null, 2).slice(0, 4000));
}
const shot = await send("Page.captureScreenshot", { format: "png" });
const file = `${outDir}/${name}.png`;
writeFileSync(file, Buffer.from(shot.data, "base64"));
console.log("wrote", file);
ws.close();
