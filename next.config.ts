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

  // pdfjs-dist's "legacy" build still probes for its worker file at
  // runtime (to fall back to an in-process "fake worker" when it can't
  // spawn a real one), via a require() buried in its own internals that
  // Vercel's static file tracer never sees. Without this, the file is
  // silently dropped from the deployed function bundle and every route
  // that parses a PDF (bulk-import, extract-schedules, extract-from-bid,
  // parse-invoice, plan-set page extraction) crashes with "Cannot find
  // module .../pdf.worker.mjs" the first time it runs on Vercel.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
};

export default nextConfig;
