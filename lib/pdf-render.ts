// pdfjs-dist's default build assumes a browser Worker and, when it can't
// spawn one in a Node serverless function, falls back to a "fake worker"
// that tries to require pdf.worker.mjs as a module - a file Vercel's build
// doesn't bundle, causing a crash. The "legacy" Node build runs PDF parsing
// entirely on the main thread instead, so no worker file is ever needed.
// (Same import used by the existing text-extraction routes.)
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas, Canvas, SKRSContext2D, DOMMatrix, Path2D } from "@napi-rs/canvas";

// pdfjs-dist's page.render() needs DOMMatrix/Path2D, which only exist in a
// browser. Node has neither, so pdfjs falls back to a no-op polyfill and
// warns "rendering may be broken" - @napi-rs/canvas ships real
// implementations of both, so wire them up globally before rendering.
if (!(globalThis as Record<string, unknown>).DOMMatrix) {
  (globalThis as Record<string, unknown>).DOMMatrix = DOMMatrix;
}
if (!(globalThis as Record<string, unknown>).Path2D) {
  (globalThis as Record<string, unknown>).Path2D = Path2D;
}

export interface RenderedPage {
  pageNumber: number;
  pngBuffer: Buffer;
  width: number;
  height: number;
}

// pdfjs needs its own canvas factory for auxiliary canvases it creates
// internally (e.g. compositing an embedded raster image XObject on a page -
// common for scanned/photographed plan sheets). Its built-in NodeCanvasFactory
// expects the classic `canvas` package to be globally registered; this
// implements the same { create, reset, destroy } contract with @napi-rs/canvas
// instead, matching pdfjs's BaseCanvasFactory shape.
interface PdfjsCanvasAndContext {
  canvas: Canvas | null;
  context: SKRSContext2D | null;
}

const napiCanvasFactory = {
  create(width: number, height: number): PdfjsCanvasAndContext {
    const canvas = createCanvas(width, height);
    return { canvas, context: canvas.getContext("2d") };
  },
  reset(canvasAndContext: PdfjsCanvasAndContext, width: number, height: number) {
    if (!canvasAndContext.canvas) throw new Error("Canvas is not specified");
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  },
  destroy(canvasAndContext: PdfjsCanvasAndContext) {
    if (!canvasAndContext.canvas) throw new Error("Canvas is not specified");
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  },
};

// Renders every page of a PDF to a PNG image, for feeding to a vision model
// (pdfjs's text-layer extraction alone is blind to anything conveyed
// graphically - wall layout, door/window symbols, room shapes).
export async function renderPdfToPngPages(
  pdfBuffer: Buffer,
  scale = 2
): Promise<RenderedPage[]> {
  // pdfjs-dist rejects Node's Buffer even though it's a Uint8Array subclass;
  // convert explicitly to a plain Uint8Array.
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    canvasFactory: napiCanvasFactory,
  }).promise;

  const pages: RenderedPage[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const width = Math.ceil(viewport.width);
    const height = Math.ceil(viewport.height);
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    // @ts-expect-error - pdfjs's RenderParameters type expects a browser
    // CanvasRenderingContext2D; @napi-rs/canvas's implementation is
    // functionally compatible for the drawing calls pdfjs makes.
    await page.render({ canvasContext: context, viewport }).promise;

    pages.push({
      pageNumber,
      pngBuffer: canvas.toBuffer("image/png"),
      width,
      height,
    });
  }

  return pages;
}
