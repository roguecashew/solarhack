import path from "node:path";
import type { NextConfig } from "next";

// GitHub Pages serves this repo at https://<user>.github.io/solarhack/, so every
// asset and route needs the repo name prefixed. The Pages workflow sets
// NEXT_PUBLIC_BASE_PATH; local dev and root-domain hosts leave it unset and
// serve from "/".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Emit a plain static site into frontend/out — no Node server at runtime,
  // which is all GitHub Pages can host.
  output: "export",
  basePath,
  // Route /foo to foo/index.html. GitHub Pages resolves directory indexes
  // reliably; extensionless .html files it does not.
  trailingSlash: true,
  // next/image optimization needs a server. Pages has none.
  images: { unoptimized: true },
  // Pin the workspace root to this directory.
  //
  // Without this, Turbopack walks up looking for a lockfile, escapes the repo,
  // and finds an unrelated ~/package-lock.json — then warns on every start and
  // treats the home directory as the project root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
