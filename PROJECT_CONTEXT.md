# RamArts Website — Project Context

> **Living document for humans and AI agents.** Read this before changing architecture.
> Update this file whenever you ship a meaningful fix, pivot, or learn a hard lesson.

---

## What this project is

Production marketing site + admin CMS for **RamArts** (printing, signage, branding).

- **Frontend host:** Vercel (`https://ramarts-website.vercel.app`)
- **Backend:** Firebase Auth + Cloud Firestore only
- **Not used (by design now):** Firebase Storage, Firebase Hosting (optional), Blaze-required Storage uploads

Repo: `https://github.com/RRGaikwad/RamArts-Website`

---

## Stack (do not casually substitute)

| Layer | Choice |
|--------|--------|
| UI | React 18 + Vite + React Router v6 |
| Styles | Tailwind 3 + CSS variables in `src/styles/index.css` |
| Motion | Framer Motion |
| Data | TanStack Query + Firestore `onSnapshot` (realtime) |
| Forms | React Hook Form + Zod |
| Auth | Firebase Auth email/password; admin UID allowlist in `.env` + `firestore.rules` |
| Media | **External HTTPS URLs only** (`UrlMediaList` / `UrlCoverField`) — no file upload to Firebase |

---

## Critical product rules

1. **Public lists only show `published == true`.** Drafts are invisible on `/products`, `/updates`, and Home featured.
2. **New products/updates default to Published = true** in admin forms. Always keep the publish checkbox obvious.
3. **Media = paste URLs**, committed on Add **or** automatically via `flush()` on Save. Prefer direct image links; Drive/Dropbox/YouTube/Maps links are normalized in `src/lib/mediaUrls.js`.
4. **Never nest `<form>` inside admin page forms** — breaks Save / Add.
5. **Spark plan:** avoid Firestore composite `orderBy` + multi-`where` queries. Prefer equality filters + **client-side sort** (`sortByTimestampDesc` in `useFirestoreRealtimeQuery.js`).
6. **Vercel production tracks `main`.** Feature branches only create Preview deploys. Merge + redeploy Production after CMS fixes.
7. **Env vars:** `VITE_*` are baked at build time. Changing Vercel env requires a **redeploy**.
8. **Firestore rules** must allow: public read of published products/updates + settings; public create inquiries; admin UID write.
9. **Settings social/map:** store under `socialLinks.{instagram,facebook}` and `mapEmbedUrl`; normalize with `normalizeSocialUrl` / `normalizeMapEmbedUrl` before save.

Admin UID (current): `el6wul7NedZF5FNBK4ZGVUlht4Z2` — keep in sync across `.env`, Vercel envs, and `firestore.rules`.

---

## Key paths

```
src/features/products/   public grid/detail + admin CRUD
src/features/updates/    public feed/detail + admin CRUD
src/features/auth/       login, protected /admin layout
src/components/UrlMediaList.jsx   URL media UI (NOT MediaUploader)
src/hooks/useProducts.js / useUpdates.js / useFirestoreRealtimeQuery.js
firestore.rules
vercel.json              SPA rewrites → index.html
.env                     local only (gitignored); never commit secrets
```

---

## Changelog of decisions, mistakes, and fixes

### 2026-07-31 — Initial build
- Built full RamArts app to Firebase Auth/Firestore/Storage + Vercel later.
- Design tokens: Syne + Outfit, teal brand, ink neutrals (avoid generic AI purple/cream looks).

### 2026-07-31 — Firebase Storage / Blaze
- **Problem:** Enabling Storage required Blaze upgrade.
- **Decision:** Drop Storage uploads. Admin pastes media URLs instead. Text stays in Firestore.
- **Mistake to avoid:** Re-adding Storage upload without confirming billing plan with the owner.

### 2026-07-31 — “Connection unstable” banner
- **Cause:** `OfflineBanner` treated any Firestore `onSnapshot` error (including permission denied from locked rules) as “unstable connection.”
- **Fix:** Banner only shows when `navigator.onLine` is false.
- **Related:** User had default locked rules `allow read, write: if false` — must Publish real `firestore.rules`.

### 2026-07-31 — Products/updates not on public site + no URL fields on live admin
- **Root causes (two):**
  1. **Deploy skew:** URL-media work lived on branch `cursor/url-media-realtime` (Preview only). **Production still served `main`** with old `MediaUploader` (file upload UI).
  2. **Drafts:** Admin defaulted `published: false`, so Firestore + public queries correctly hid items.
- **Fix:** Prominent Media URLs + Publish panels; default `published: true`; clearer empty/error copy; merge to `main` and deploy Production.
- **Lesson for agents:** After shipping CMS changes, verify **Production** deployment (not only Preview). Confirm `published` on sample docs in Firestore Console.

### 2026-07-31 — Media / map / social URLs not showing on public site
- **Causes:**
  1. Nested `<form>` inside product/update forms → Add/Set buttons fought parent Save; pending URLs often never committed.
  2. Cover field required a separate “Set cover” click before Save — easy to miss → `coverImage: null` in Firestore.
  3. Share links (Drive/Dropbox/YouTube, Google Maps place links, social without `https://`) stored raw; `<img>` / `<video>` / `<iframe>` cannot render them.
  4. Settings `socialLinks` shallow-merge edge cases; Save button disabled when `!isDirty`.
- **Fix:**
  - `UrlMediaList` / `UrlCoverField`: no nested forms; cover syncs live; `flush()` commits pending URLs on Save.
  - `src/lib/mediaUrls.js`: normalize image/video/map/social URLs; YouTube/Vimeo via `MediaPlayer`.
  - Settings deep-merge + normalize on save/read; map preview in admin; always-enabled Save.
- **Rule:** Never nest forms in admin. Always normalize third-party URLs before write and on display. Redeploy Production after CMS media fixes.

### 2026-08-01 — Videos failing, gallery close, settings email uneditable
- **Videos:** `ensureHttps()` rejected common pastes like `youtube.com/watch?v=…` / `www.youtube.com/…` (regex required a TLD boundary that paths broke). YouTube Shorts/live/m. URLs also missed ID parsing.
  - **Fix:** Broader `ensureHttps`, robust `getYouTubeId` (watch/shorts/live/embed/youtu.be), iframe paste support, clearer video add UX, `stripUndefined` on product save.
- **Gallery close:** Close control was low-contrast on dark overlay.
  - **Fix:** Large circular close button (paper/brand hover) + click backdrop to close; stopPropagation on media/nav.
- **Settings email:** `useSiteSettings` returned `getDisplaySettings(result.data)` as a **new object every render** → admin `useEffect([settings])` called `reset()` continuously → email (and other fields) snapped back while typing.
  - **Fix:** `useMemo` for display settings; reset only when server field values / `updatedAt` change; `autoComplete="organization"` on email.
- **Rule:** Never derive unstable object identities in hooks that feed form `reset()`. Always accept protocol-less YouTube URLs.

---

## How to verify a healthy deploy

1. Open Production URL (not a `*-projects.vercel.app` Preview unless intentional).
2. `/admin/products/new` shows a bordered **Media URLs** section (paste fields), not file drag-and-drop.
3. Create product with Publish checked → appears on `/products` within ~1s (realtime).
4. Firestore Console: doc has `published: true` and `images: [{ url, alt, order }]`.

---

## Commands

```bash
npm run dev
npm run build
npx vercel --prod          # production
firebase deploy --only firestore:rules,firestore:indexes
```

---

## When updating this file

Append a dated section under **Changelog** with: problem → mistake/cause → fix → rule for next agent.
Do not delete old entries; they prevent repeating expensive wrong paths.
