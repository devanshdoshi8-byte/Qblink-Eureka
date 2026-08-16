import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import type { AddressInfo } from "node:net";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

/**
 * Static file server whose document root can be swapped at runtime — that swap
 * is our "deploy". Cache headers mirror production: HTML and the service
 * worker must revalidate, hashed assets are immutable.
 */
export interface DeployServer {
  origin: string;
  deploy: (root: string) => void;
  close: () => Promise<void>;
}

export const startDeployServer = async (initialRoot: string): Promise<DeployServer> => {
  let root = initialRoot;

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const rel = decodeURIComponent(url.pathname);
    const filePath = path.join(root, rel === "/" ? "index.html" : rel);

    if (!filePath.startsWith(path.resolve(root))) {
      res.writeHead(403).end("forbidden");
      return;
    }
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404, { "cache-control": "no-store" }).end("not found");
      return;
    }

    const ext = path.extname(filePath);
    const isImmutable = /[.-][A-Za-z0-9_-]{8,}\.(js|css|woff2)$/.test(filePath);
    res.writeHead(200, {
      "content-type": MIME[ext] ?? "application/octet-stream",
      "cache-control":
        ext === ".html" || rel === "/sw.js"
          ? "no-cache"
          : isImmutable
            ? "public, max-age=31536000, immutable"
            : "no-cache",
    });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    // localhost (not 127.0.0.1) keeps the page a secure context for the SW.
    origin: `http://localhost:${port}`,
    deploy: (next: string) => {
      root = next;
    },
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      ),
  };
};