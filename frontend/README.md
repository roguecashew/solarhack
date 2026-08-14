# solarhack — frontend

React + Vite + TypeScript + Tailwind CSS.

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173).

## Scripts

- `npm run dev` — start the dev server with hot reload
- `npm run build` — type-check and build for production into `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint

## Structure

```
frontend/
├── index.html          # HTML entry point
├── src/
│   ├── main.tsx        # React entry point
│   ├── App.tsx         # Root component
│   └── index.css       # Tailwind entry (@import "tailwindcss")
├── public/             # Static assets served as-is
└── vite.config.ts      # Vite + React + Tailwind plugins
```
