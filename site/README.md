# site/

The Binaroo website: home, privacy policy, support, press kit, and the web game at `/play`. Static, no dependencies.

```sh
npm --prefix game run build   # the web game, embedded at /play
node site/build.mjs           # build to site/dist
node site/serve.mjs           # preview at http://localhost:4173
node --test site              # tests
```

Fill in `site.config.json` (email, legal name, country, domain, date) before going live. `node site/build.mjs --release` refuses to build while any value is still `TODO`.

Everything else (hosting on Cloudflare Pages, the privacy policy, what is not done) is in [`docs/site.md`](../docs/site.md).
