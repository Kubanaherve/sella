import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARTIFACT_DIR = "/Users/friendkh/.gemini/antigravity/brain/60d49a68-b551-4d38-ba5b-302ad87381a0";
const PUBLIC_BRAND_DIR = "/Users/friendkh/Projects/Mom_app_Bijoux/sella/public/brand";

// Create an HTML processor that loads the raw signature, removes the white/grey background on a canvas,
// converts strokes to rich dark ink (#0c1e4a or #0f172a), and renders it cleanly.
const processorHtml = `<!doctype html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <script>
    const img = new Image();
    img.src = "herve-signature-raw.png";
    img.onload = () => {
      const c = document.getElementById('c');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, c.width, c.height);
      const d = imgData.data;

      // Extract ink by luminance:
      // The background in raw image is around rgb(245-255).
      // Ink strokes are rgb(10-60).
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i+1];
        const b = d[i+2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (lum > 230) {
          // Pure transparent background
          d[i+3] = 0;
        } else if (lum > 140) {
          // Anti-aliased stroke edge
          const factor = (230 - lum) / 90;
          d[i] = 12;   // Deep navy/black ink
          d[i+1] = 30;
          d[i+2] = 74;
          d[i+3] = Math.round(factor * 255);
        } else {
          // Solid crisp ink
          d[i] = 12;
          d[i+1] = 30;
          d[i+2] = 74;
          d[i+3] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      document.body.setAttribute('data-done', 'true');
    };
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(PUBLIC_BRAND_DIR, "signature-processor.html"), processorHtml);

async function runChrome(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(CHROME, args);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Exit code ${code}`));
    });
  });
}

async function main() {
  console.log("Processing signature to transparent PNG...");
  const outPathPublic = path.join(PUBLIC_BRAND_DIR, "sella-herve-signature-transparent.png");
  const outPathArtifact = path.join(ARTIFACT_DIR, "sella-herve-signature-transparent.png");

  await runChrome([
    "--headless",
    "--disable-gpu",
    "--window-size=240,170",
    "--default-background-color=00000000",
    `--screenshot=${outPathPublic}`,
    `file://${path.join(PUBLIC_BRAND_DIR, "signature-processor.html")}`,
  ]);

  fs.copyFileSync(outPathPublic, outPathArtifact);
  console.log("Transparent signature saved to:", outPathPublic);
}

main().catch(console.error);
