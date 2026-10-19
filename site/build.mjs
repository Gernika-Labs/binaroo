// Builds the website into site/dist: pages are wrapped in _layout.html, {{placeholders}} are filled from
// site.config.json, and the web game (game/dist) is copied to /play.
//
//   node site/build.mjs             development build: unfilled TODO values are allowed
//   node site/build.mjs --release   (or SITE_RELEASE=1) fails if any TODO value is left,
//                                   so a production deploy can never carry placeholder details
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const isTodo = (v) => typeof v !== "string" || v.trim() === "" || /TODO/i.test(v);

/** Details that must be real before a release build. (basePath is optional and may be empty.) */
const REQUIRED = ["email", "legalName", "country", "domain", "updated"];

/** "" for a site at the domain root; "/binaroo" for a GitHub Pages project site. No trailing slash. */
function normalizeBase(value) {
  const trimmed = String(value ?? "").trim().replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}` : "";
}

/** Pulls the `key: value` lines out of a page's leading HTML comment. */
function parsePage(source) {
  const m = source.match(/^\s*<!--([\s\S]*?)-->\s*/);
  const meta = {};
  if (m) {
    for (const line of m[1].split("\n")) {
      const kv = line.match(/^\s*([\w-]+):\s*(.*?)\s*$/);
      if (kv) meta[kv[1]] = kv[2];
    }
  }
  return { meta, body: m ? source.slice(m[0].length) : source };
}

export function build({
  config,
  release = false,
  srcDir = join(here, "src"),
  outDir = join(here, "dist"),
  gameDir = join(here, "..", "game", "dist"),
  year = new Date().getFullYear(),
} = {}) {
  const todo = REQUIRED.filter((key) => isTodo(config[key]));
  if (release && todo.length) {
    throw new Error(`Release build blocked: fill in ${todo.join(", ")} in site/site.config.json`);
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const layout = readFileSync(join(srcDir, "_layout.html"), "utf8");
  const base = normalizeBase(config.basePath);
  const host = isTodo(config.domain) ? "" : `https://${config.domain}`;
  const origin = host ? `${host}${base}` : base; // absolute when the domain is known
  const vars = { ...config, year: String(year), base, origin };

  const pages = [];
  for (const file of readdirSync(srcDir)) {
    const from = join(srcDir, file);
    if (file.startsWith("_")) continue;
    if (!file.endsWith(".html")) {
      cpSync(from, join(outDir, file), { recursive: true });
      continue;
    }
    const { meta, body } = parsePage(readFileSync(from, "utf8"));
    const title = meta.title ?? "Binaroo";
    const pageVars = {
      ...vars,
      pageTitle: title === "Home" ? `${config.name}: ${config.tagline}` : `${title} | ${config.name}`,
      description: meta.description ?? config.tagline,
    };
    let html = layout.replace("{{content}}", () => body);
    html = html.replace(/\{\{cur:(\w+)\}\}/g, (_, key) => (meta.nav === key ? ' aria-current="page"' : ""));
    html = html.replace(/\{\{(\w+)\}\}/g, (all, key) => {
      if (!(key in pageVars)) throw new Error(`${file}: unknown placeholder ${all}`);
      return pageVars[key];
    });
    writeFileSync(join(outDir, file), html);
    pages.push(file);
  }

  if (existsSync(gameDir)) {
    cpSync(gameDir, join(outDir, "play"), { recursive: true });
  } else if (release) {
    throw new Error(`Release build blocked: the web game is missing (${gameDir}). Run "npm --prefix game run build" first.`);
  } else {
    console.warn(`warning: ${gameDir} not found, /play will be missing`);
  }

  if (host) {
    const urls = ["/", "/play/", ...pages.filter((p) => !["index.html", "404.html"].includes(p)).map((p) => `/${p.replace(/\.html$/, "")}`)];
    writeFileSync(
      join(outDir, "sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${origin}${u}</loc></url>`).join("\n")}\n</urlset>\n`,
    );
    // crawlers only read robots.txt at the domain root, so it is only effective without a basePath
    writeFileSync(join(outDir, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
  } else {
    writeFileSync(join(outDir, "robots.txt"), "User-agent: *\nDisallow: /\n"); // no domain yet: keep it out of search
  }

  // Cloudflare Pages reads this file for response headers
  writeFileSync(
    join(outDir, "_headers"),
    [
      "/*",
      "  X-Content-Type-Options: nosniff",
      "  Referrer-Policy: strict-origin-when-cross-origin",
      "  X-Frame-Options: SAMEORIGIN",
      "/assets/*",
      "  Cache-Control: public, max-age=31536000, immutable",
      "",
    ].join("\n"),
  );

  return { pages, todo, outDir };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const release = process.argv.includes("--release") || process.env.SITE_RELEASE === "1";
  const config = JSON.parse(readFileSync(join(here, "site.config.json"), "utf8"));
  try {
    const { pages, todo, outDir } = build({ config, release });
    console.log(`site built: ${pages.length} pages -> ${outDir}`);
    if (todo.length) console.log(`note: still TODO in site.config.json: ${todo.join(", ")} (a release build will refuse to run)`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
