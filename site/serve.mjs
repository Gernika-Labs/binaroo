// Tiny static server for previewing site/dist locally (supports /privacy -> privacy.html and /play/).
//   node site/serve.mjs [port]
//   BASE=/binaroo node site/serve.mjs   (serves the site under a sub-path, like a GitHub Pages project site)
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "dist");
const port = Number(process.argv[2]) || 4173;
const base = (process.env.BASE ?? "").replace(/\/+$/, "");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json", ".txt": "text/plain", ".xml": "application/xml", ".svg": "image/svg+xml" };

createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (base) {
    if (pathname !== base && !pathname.startsWith(`${base}/`)) {
      res.writeHead(404, { "content-type": types[".html"] }).end(readFileSync(join(root, "404.html")));
      return;
    }
    pathname = pathname.slice(base.length) || "/";
  }
  const path = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let file = join(root, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  else if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
  if (!existsSync(file)) {
    res.writeHead(404, { "content-type": types[".html"] }).end(readFileSync(join(root, "404.html")));
    return;
  }
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
}).listen(port, () => console.log(`http://localhost:${port}`));
