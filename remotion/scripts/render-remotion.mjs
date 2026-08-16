import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const compId = process.argv[2];
const outPath = process.argv[3];
if (!compId || !outPath) {
  console.error("Usage: node render-remotion.mjs <compId> <outPath>");
  process.exit(1);
}

console.log(`Bundling for composition: ${compId}`);
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: {
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
  chromeMode: "chrome-for-testing",
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: compId,
  puppeteerInstance: browser,
});

console.log(`Rendering ${composition.durationInFrames} frames @ ${composition.fps}fps -> ${outPath}`);

const start = Date.now();
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: outPath,
  puppeteerInstance: browser,
  muted: true,
  concurrency: 2,
  onProgress: ({ progress }) => {
    if (Math.floor(progress * 100) % 10 === 0) {
      process.stdout.write(`\r  ${Math.floor(progress * 100)}%`);
    }
  },
});
console.log(`\nDone in ${((Date.now() - start) / 1000).toFixed(1)}s`);

await browser.close({ silent: false });