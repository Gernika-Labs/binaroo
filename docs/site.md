# The website (`site/`)

A small static site: home, privacy policy, support, press kit, a 404 page, and the web version of the game at `/play/`. No framework and no dependencies. Both app stores need a privacy policy URL before the first submission, which is why this exists before the release.

## Layout

```
site/
├─ site.config.json   the details that must be filled in (email, legal name, country, domain, date)
├─ build.mjs          builds site/dist (wraps pages in the layout, fills {{placeholders}}, copies the game to /play)
├─ serve.mjs          local preview server
├─ build.test.mjs     tests for the build (node --test)
└─ src/
   ├─ _layout.html    shared header, footer and <head>
   ├─ index.html, privacy.html, support.html, press.html, 404.html
   ├─ styles.css      the game's 1A Terminal look; dark by default, light on light systems
   └─ assets/         icon, screenshots, social image, bundled JetBrains Mono
```

Each page starts with a comment that sets `title`, `description` and (for the nav) `nav`. Placeholders like `{{email}}` come from `site.config.json`.

## Run it locally

```sh
npm --prefix game run build     # the web game, which the site embeds at /play
node site/build.mjs             # builds site/dist
node site/serve.mjs             # http://localhost:4173  (BASE=/binaroo node site/serve.mjs to test a sub-path)
node --test site                # tests (or: cd site && npm test)
```

## Before it can go live: fill in `site.config.json`

| Key | What to put |
|---|---|
| `email` | A real contact address for privacy and support questions. Shown on the privacy, support and press pages. |
| `legalName` | The legal name of whoever publishes the app (for example "Gernika Labs", or the company's registered name). |
| `country` | Where that entity is based. |
| `domain` | The site's domain, without `https://` (for example `binaroo.app`). Turns on the sitemap, search indexing and social-card URLs. |
| `updated` | The date the privacy policy was last updated, written out (for example "1 January 2027"). |
| `basePath` | Leave empty on a custom domain. For GitHub Pages without a custom domain set `/binaroo` (see "The address" below). Optional, not checked by `--release`. |

**Safety guard:** `node site/build.mjs --release` (or setting `SITE_RELEASE=1`) **fails** while any of these is still `TODO`, or if the web game hasn't been built. Use it for production builds so placeholder details can never be published. Without a domain, the site also serves `robots.txt` with `Disallow: /` so an unfinished site stays out of search results.

## Hosting: GitHub Pages (recommended)

Your GitHub organization is on the **Team** plan, so Pages works for this private repo at no extra cost. (On the Free plan Pages is only available for public repos.) The deploy workflow is `.github/workflows/site.yml`. It is manual until you are ready, and nothing is deployed yet.

One-time setup, in the repo's **Settings > Pages**:
1. **Source:** GitHub Actions.
2. **Custom domain:** enter your domain and follow GitHub's DNS instructions (a `CNAME` record, or `A` records for a root domain), then tick **Enforce HTTPS**. Put the same domain in `site/site.config.json`.

Deploy: **Actions** tab > **Deploy site** > **Run workflow**. It builds the game, runs the site tests, runs the release build (which refuses to continue while any `TODO` is left in `site.config.json`), then publishes `site/dist`. Once you trust it, add a `push` trigger on `main` (the commented lines at the top of the workflow) so every merge redeploys.

### The address

Pages is not enabled yet, so nothing is live. Once it is, GitHub serves a project site of this repo at:

**`https://gernika-labs.github.io/binaroo/`** (organization name lowercased, then the repo name; the exact URL is also shown in Settings > Pages and printed by the workflow after a deploy)

That address lives under the sub-path `/binaroo`, so the site must be built for it. In `site/site.config.json` set `"domain": "gernika-labs.github.io"` and `"basePath": "/binaroo"`. All links, images and the game then work under that path (checked locally with `BASE=/binaroo node site/serve.mjs`). With your own domain, set `domain` to it and leave `basePath` empty.

**Use a custom domain for the store listings.** The privacy policy URL goes into App Store Connect and Play Console, and it should never change. A `github.io/binaroo` address is tied to the repo name and organization, and search engines ignore the `robots.txt` of a sub-path site. The `github.io` address is fine for trying the site out.

Things to know:
- **The site is public even though the repo is private.** That is what you want for a marketing site and a privacy policy, but do not put anything private in `site/`.
- **Limits** (from GitHub's docs): published site up to 1 GB, a soft 100 GB of traffic per month, deployments time out after 10 minutes. This site is a few hundred KB.
- **Commercial use:** GitHub says Pages is not meant to run an online business or take payments. A promotional site for a game is normally fine, but if the site ever sells things, host that part elsewhere.
- **No custom response headers and no per-PR previews.** `site/dist/_headers` (security headers, caching) is ignored by GitHub Pages; it only matters if you move to Cloudflare. Pull requests are still built and tested by CI (`.github/workflows/ci.yml`), you just can't open a live preview of one.
- Use the final URL (for example `https://yourdomain/privacy`) as the privacy policy URL in App Store Connect and Play Console.
- **Untested:** this workflow has not run yet (it needs Pages enabled on the repo). Expect to fix a small thing on its first run.

### Alternative: Cloudflare Pages

Also free for private repos, and it adds a live preview for every pull request, custom headers and a build on their side. It means a second account and vendor. If you prefer it: create a Pages project from the repo with build command `npm --prefix game ci && npm --prefix game run build && node site/build.mjs`, output directory `site/dist`, environment variable `NODE_VERSION=22`, and set `SITE_RELEASE=1` for the **Production** environment only. Then set `hosting` to `Cloudflare` in `site.config.json` so the privacy policy names the right host.

## The privacy policy

`src/privacy.html` describes the app as it is today: no accounts, no ads, no analytics, no tracking, no network requests, and four small values saved on the device (best score, sound, haptics, theme). The store privacy forms can say "no data collected" for the same reason.

- **If the app changes, the policy must change first.** Adding ads, analytics, crash reporting, accounts, purchases or cloud sync changes what you must disclose, here and in both stores' privacy questionnaires.
- **It is not legal advice.** Have it reviewed by someone qualified before release, especially for the country in `country`, for GDPR-style rights wording, and if the app is aimed at children (the stores have extra rules for kids' apps).
- The "this website" section names the host from `hosting` in the config (now GitHub Pages) and assumes no cookies or analytics. Change `hosting` in the config if you pick another host, and update the text if you add analytics.

## Not done

- The App Store and Google Play buttons are "coming soon" placeholders. Replace them with the official badges and links after the apps are published.
- Screenshots are from the Android emulator with a hand-played board. Replace them with polished store screenshots in phase 7.
- No custom domain, analytics, email capture or blog.
