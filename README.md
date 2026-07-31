# RamArts Website

Production-ready website for **RamArts** — a printing, signage, and branding studio.

**Stack:** React 18 · Vite · Tailwind CSS · Framer Motion · React Router v6 · Firebase (Auth, Firestore) · Vercel Hosting · TanStack Query · React Hook Form + Zod

---

## Features

- Public site: Home, Work (filterable portfolio), Product detail + lightbox, Updates/news, About, Contact, 404
- Admin panel (`/admin`): login, dashboard, CRUD for products / categories / updates, inquiries inbox, live site settings
- Media via **URL fields** (no Firebase Storage required) — paste links from Drive, Cloudinary, ImgBB, YouTube, etc.
- Firestore realtime listeners so public pages update when admin saves
- Blur-up lazy images, skeleton loaders, scroll/page animations
- SEO metadata, sitemap, robots.txt, dark-mode-ready design tokens

---

## Prerequisites

- Node.js 18+
- A Firebase project ([console.firebase.google.com](https://console.firebase.google.com))
- Firebase CLI (for deploy): `npm install -g firebase-tools`

---

## 1. Install

```bash
npm install
cp .env.example .env
```

---

## 2. Firebase project setup

1. Create a Firebase project (e.g. `ramarts`).
2. Enable **Authentication → Email/Password**.
3. Create a **Firestore** database (production mode; we deploy rules next).
4. Register a **Web app** and copy the config into `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

6. Update `.firebaserc` with your project id.

### Create the first admin user

1. In Firebase Console → **Authentication → Users → Add user**, create an email/password account (this is your only admin — there is no public sign-up UI).
2. Copy the user’s **UID**.
3. Put it in `.env`:

```env
VITE_ADMIN_UIDS=paste_uid_here
```

4. Replace `REPLACE_WITH_ADMIN_UID` in `firestore.rules` with the same UID.
5. Deploy rules:

```bash
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

6. Deploy composite indexes (needed for filtered product queries):

```bash
firebase deploy --only firestore:indexes
```

---

## 3. Run locally

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

- Public site: `/`
- Admin login: `/admin/login`

---

## 4. Build & deploy

```bash
npm run build
firebase deploy
```

Or hosting only:

```bash
firebase deploy --only hosting
```

Scripts:

| Command | Description |
|--------|-------------|
| `npm run dev` | Local development server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Build + Firebase Hosting deploy |

---

## 5. Using the admin panel

After signing in at `/admin/login`:

1. **Categories** — add filters (Signage, Banners, Business Cards, Packaging, Vehicle Branding, Digital Print, …).
2. **Products** — create items, paste image/video **URLs** (alt text required for images), set specs, toggle **Published** and **Featured**.
3. **Updates** — write posts with the rich-text editor, cover image URL, optional gallery URLs, publish or schedule.
4. **Inquiries** — read contact-form messages; mark new / read / resolved.
5. **Settings** — edit hero text, phone, WhatsApp, address, hours, social links (updates live without redeploy).

---

## Project structure

```
src/
  components/     Shared UI (Nav, Footer, Gallery, Modal, Skeletons…)
  features/       Domain modules (products, updates, auth, inquiries…)
  hooks/          React Query + Firebase hooks
  lib/            firebase.js, uploadHelpers, queryClient
  routes/         Lazy-loaded route tree
  styles/         Tailwind + design tokens (CSS variables)
public/           favicon, robots.txt, sitemap.xml
firestore.rules
storage.rules
firebase.json
```

---

## Security notes

- Public users can **read** published products/updates and settings; they can **create** inquiries only.
- Only the allowlisted admin UID(s) can write content or read the inquiries inbox.
- Unauthenticated users cannot access `/admin` (client guard + Firebase rules).
- Keep `.env` out of git (already in `.gitignore`). Commit `.env.example` only.

---

## Optional: email on new inquiry

Wire a Firebase Cloud Function on `inquiries/{id}` `onCreate` to send email (e.g. via SendGrid or Nodemailer). The contact form already writes to Firestore; the function is optional.

---

## License

Private — RamArts. All rights reserved.
