import pdfjs from "pdfjs-dist/legacy/build/pdf.js";

const { getDocument } = pdfjs;

/**
 * Extracts plain text from a PDF file buffer using pdfjs-dist.
 * (Swapped from pdf-parse, whose bundled pdf.js build failed on otherwise
 * valid PDFs with modern xref table formatting.)
 */
export async function parsePdf(buffer) {
  const loadingTask = getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  const pageTexts = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    pageTexts.push(pageText);
  }

  return pageTexts.join("\n\n").trim();
}
