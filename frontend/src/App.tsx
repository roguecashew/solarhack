function App() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="text-6xl" role="img" aria-label="sun">
          ☀️
        </span>
        <h1 className="text-5xl font-bold tracking-tight">solarhack</h1>
        <p className="max-w-xl text-lg text-slate-700">
          Frontend scaffold is up and running — React, Vite, TypeScript, and
          Tailwind CSS. Start building from{' '}
          <code className="rounded bg-slate-900/10 px-1.5 py-0.5 font-mono text-sm">
            src/App.tsx
          </code>
          .
        </p>
        <div className="flex gap-3">
          <a
            className="rounded-lg bg-orange-500 px-5 py-2.5 font-medium text-white transition hover:bg-orange-600"
            href="https://vite.dev"
            target="_blank"
            rel="noreferrer"
          >
            Vite docs
          </a>
          <a
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-800 transition hover:bg-slate-50"
            href="https://tailwindcss.com"
            target="_blank"
            rel="noreferrer"
          >
            Tailwind docs
          </a>
        </div>
      </div>
    </main>
  )
}

export default App
