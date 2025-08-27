
# Profile Photo Quiz (PWA)

A tiny web app that picks 10 random profile photos and shows a 3-option multiple-choice quiz.
Works on the web and installs on Android/iPhone as a PWA. Can be wrapped with Capacitor for app stores.

## Quick start

1) Install deps  
```bash
npm i
```

2) Add photos  
Put at least **three** JPG files in `public/photos/` (e.g., `alice.jpg`, `bob.jpg`, `charlie.jpg`).

3) Run locally  
```bash
npm run dev
```

4) Build & deploy  
```bash
npm run build
```
Deploy the `dist/` folder to Netlify, Vercel, or GitHub Pages.

## Notes

- The build step runs a small script that scans `public/photos` and generates `public/photos/photos.json`.
- On mobile, open your deployed URL and use **Add to Home Screen** to install.
- You can change the app name/icons in `vite.config.ts` and `public/icons`.
