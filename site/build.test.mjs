import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { build } from "./build.mjs";

const full = {
  name: "Binaroo",
  tagline: "Learn binary by playing.",
  email: "hello@example.com",
  legalName: "Example Labs",
  country: "Spain",
  domain: "binaroo.example",
  hosting: "Cloudflare",
  updated: "1 January 2027",
};
const todo = { ...full, email: "TODO", legalName: "TODO", country: "TODO", domain: "TODO", updated: "TODO" };

const out = () => mkdtempSync(join(tmpdir(), "binaroo-site-"));
// a fake game build so these tests don't depend on building the game
const game = out;

test("a development build works with TODO values and reports them", () => {
  const outDir = out();
  const { todo: missing, pages } = build({ config: todo, outDir, gameDir: game() });
  assert.deepEqual(missing.sort(), ["country", "domain", "email", "legalName", "updated"]);
  assert.ok(pages.includes("privacy.html") && pages.includes("index.html"));
  assert.match(readFileSync(join(outDir, "privacy.html"), "utf8"), /TODO/);
});

test("a release build refuses to run while any value is TODO", () => {
  assert.throws(
    () => build({ config: todo, release: true, outDir: out(), gameDir: game() }),
    /Release build blocked: fill in email, legalName, country, domain, updated/,
  );
  assert.throws(() => build({ config: { ...full, email: "" }, release: true, outDir: out(), gameDir: game() }), /email/);
});

test("a release build needs the web game", () => {
  assert.throws(
    () => build({ config: full, release: true, outDir: out(), gameDir: join(tmpdir(), "does-not-exist-binaroo") }),
    /web game is missing/,
  );
});

test("a complete release build has no placeholders left", () => {
  const outDir = out();
  build({ config: full, release: true, outDir, gameDir: game(), year: 2027 });
  for (const page of ["index.html", "privacy.html", "support.html", "press.html", "404.html"]) {
    const html = readFileSync(join(outDir, page), "utf8");
    assert.doesNotMatch(html, /\{\{|TODO/, `${page} still has placeholders`);
  }
  const privacy = readFileSync(join(outDir, "privacy.html"), "utf8");
  assert.match(privacy, /hello@example\.com/);
  assert.match(privacy, /Example Labs/);
  assert.match(privacy, /Last updated: 1 January 2027/);
  assert.match(readFileSync(join(outDir, "index.html"), "utf8"), /&copy; 2027 Example Labs/);
});

test("the sitemap and open graph URL appear only once a domain is set", () => {
  const withDomain = out();
  build({ config: full, outDir: withDomain, gameDir: game() });
  assert.match(readFileSync(join(withDomain, "sitemap.xml"), "utf8"), /https:\/\/binaroo\.example\/privacy/);
  assert.match(readFileSync(join(withDomain, "index.html"), "utf8"), /content="https:\/\/binaroo\.example\/assets\/og-image\.png"/);

  const without = out();
  build({ config: todo, outDir: without, gameDir: game() });
  assert.equal(existsSync(join(without, "sitemap.xml")), false);
  assert.match(readFileSync(join(without, "robots.txt"), "utf8"), /Disallow: \//); // keep an unconfigured site out of search
});

test("the current page is marked in the navigation", () => {
  const outDir = out();
  build({ config: full, outDir, gameDir: game() });
  const html = readFileSync(join(outDir, "privacy.html"), "utf8");
  assert.match(html, /<a href="\/privacy" aria-current="page">/);
  assert.doesNotMatch(html, /<a href="\/support" aria-current/);
});

test("an unknown placeholder fails the build", async () => {
  const { mkdirSync, writeFileSync, cpSync } = await import("node:fs");
  const src = out();
  cpSync(new URL("./src/_layout.html", import.meta.url), join(src, "_layout.html"));
  writeFileSync(join(src, "bad.html"), "<!-- title: Bad -->\n<p>{{nope}}</p>");
  mkdirSync(join(src, "assets"));
  assert.throws(() => build({ config: full, srcDir: src, outDir: out(), gameDir: game() }), /unknown placeholder \{\{nope\}\}/);
});

test("a basePath prefixes every internal link and asset (GitHub Pages project site)", () => {
  const outDir = out();
  build({ config: { ...full, domain: "gernika-labs.github.io", basePath: "binaroo/" }, outDir, gameDir: game() });
  for (const page of ["index.html", "privacy.html", "support.html", "press.html", "404.html"]) {
    const html = readFileSync(join(outDir, page), "utf8");
    const links = [...html.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((m) => m[1]);
    assert.ok(links.length > 0, `${page} has internal links`);
    for (const link of links) assert.ok(link === "/binaroo" || link.startsWith("/binaroo/"), `${page}: ${link} is not under /binaroo`);
  }
  const index = readFileSync(join(outDir, "index.html"), "utf8");
  assert.match(index, /href="\/binaroo\/play\/"/);
  assert.match(index, /content="https:\/\/gernika-labs\.github\.io\/binaroo\/assets\/og-image\.png"/);
  assert.match(readFileSync(join(outDir, "sitemap.xml"), "utf8"), /https:\/\/gernika-labs\.github\.io\/binaroo\/privacy/);
  // fonts are relative to the stylesheet, so they follow it under any base
  assert.doesNotMatch(readFileSync(join(outDir, "styles.css"), "utf8"), /url\("\/assets/);
});

test("without a basePath links stay at the domain root", () => {
  const outDir = out();
  build({ config: full, outDir, gameDir: game() });
  const links = [...readFileSync(join(outDir, "index.html"), "utf8").matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((m) => m[1]);
  assert.ok(links.includes("/play/") && links.includes("/privacy") && links.includes("/"));
});

test("basePath is optional: an empty one does not block a release build", () => {
  build({ config: { ...full, basePath: "" }, release: true, outDir: out(), gameDir: game() });
});
