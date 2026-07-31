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
3. **Media = paste URLs.** Prefer direct image links (`.jpg` / `.png` / `.webp`). Google Drive “share page” links often do not work in `<img>`.
4. **Spark plan:** avoid Firestore composite `orderBy` + multi-`where` queries. Prefer equality filters + **client-side sort** (`sortByTimestampDesc` in `useFirestoreRealtimeQuery.js`).
5. **Vercel production tracks `main`.** Feature branches only create Preview deploys. **URL-media / realtime fixes must be merged to `main` and redeployed to Production** or the live site stays on old code.
6. **Env vars:** `VITE_*` are baked at build time. Changing Vercel env requires a **redeploy**.
7. **Firestore rules** must allow: public read of published products/updates + settings; public create inquiries; admin UID write. Locked rules (`allow read, write: if false`) break the whole site.

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

### Approach for realtime sync
- Use `onSnapshot` → `queryClient.setQueryData` via `useFirestoreRealtimeQuery`.
- Avoid composite indexes where possible (Spark reliability).

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
