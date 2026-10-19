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
node site/serve.mjs             # http://localhost:4173
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

**Safety guard:** `node site/build.mjs --release` (or setting `SITE_RELEASE=1`) **fails** while any of these is still `TODO`, or if the web game hasn't been built. Use it for production builds so placeholder details can never be published. Without a domain, the site also serves `robots.txt` with `Disallow: /` so an unfinished site stays out of search results.

## Hosting: Cloudflare Pages (recommended)

Free, works with a private GitHub repo, and supports a custom domain. Nothing is deployed yet; this needs your Cloudflare account.

1. Cloudflare dashboard > **Workers & Pages** > **Create** > **Pages** > connect the `Gernika-Labs/binaroo` repo.
2. Build settings:
   - **Build command:** `npm --prefix game ci && npm --prefix game run build && node site/build.mjs`
   - **Build output directory:** `site/dist`
   - **Root directory:** leave empty (the repo root).
   - **Environment variable:** `NODE_VERSION` = `22`
3. In the project's **Settings > Environment variables**, add `SITE_RELEASE` = `1` for the **Production** environment only. Production builds then refuse to run until `site.config.json` is complete, while preview builds still work.
4. Add your custom domain under **Custom domains**, and put the same domain in `site.config.json`.
5. Use the production URL (for example `https://yourdomain/privacy`) as the privacy policy URL in App Store Connect and Play Console.

CI (`.github/workflows/ci.yml`) already builds the site and runs its tests on every pull request, so a broken page is caught before it reaches Cloudflare.

## The privacy policy

`src/privacy.html` describes the app as it is today: no accounts, no ads, no analytics, no tracking, no network requests, and four small values saved on the device (best score, sound, haptics, theme). The store privacy forms can say "no data collected" for the same reason.

- **If the app changes, the policy must change first.** Adding ads, analytics, crash reporting, accounts, purchases or cloud sync changes what you must disclose, here and in both stores' privacy questionnaires.
- **It is not legal advice.** Have it reviewed by someone qualified before release, especially for the country in `country`, for GDPR-style rights wording, and if the app is aimed at children (the stores have extra rules for kids' apps).
- The "this website" section assumes Cloudflare as the host and no cookies or analytics. Change `hosting` in the config if you pick another host, and update the text if you add analytics.

## Not done

- The App Store and Google Play buttons are "coming soon" placeholders. Replace them with the official badges and links after the apps are published.
- Screenshots are from the Android emulator with a hand-played board. Replace them with polished store screenshots in phase 7.
- No custom domain, analytics, email capture or blog.
