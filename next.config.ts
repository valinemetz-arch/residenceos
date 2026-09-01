import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist dynamically loads its worker script relative to its own
  // file at runtime. When Next.js bundles it into a webpack chunk, that
  // internal path gets rewritten to a chunk name that doesn't exist in
  // Vercel's deployed output, crashing with "Cannot find module
  // .../pdf.worker.mjs". Excluding it from bundling makes Next.js load it
  // straight from node_modules instead, where the real file lives.
  //
  // @napi-rs/canvas ships a prebuilt native (.node) binary loaded via a
  // plain js-binding.js require() - bundlers can't place a native asset
  // inside an ESM chunk, so it needs the same treatment.
  serverExternalPackages: ["pdfjs-dist", "@napi-rs/canvas"],
};

export default nextConfig;
