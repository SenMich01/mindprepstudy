import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

const xmlParser = new XMLParser({ ignoreAttributes: true });

// Recursively walks a parsed slide XML object and collects every <a:t> text run.
function collectTextRuns(node, out) {
  if (node == null) return;
  if (typeof node === "string") return;

  if (Array.isArray(node)) {
    for (const item of node) collectTextRuns(item, out);
    return;
  }

  if (typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "a:t") {
        if (Array.isArray(value)) out.push(...value.map(String));
        else out.push(String(value));
      } else {
        collectTextRuns(value, out);
      }
    }
  }
}

/**
 * Extracts plain text from a PPTX file buffer by reading each slide's XML
 * directly (PPTX is a zip archive of XML files). No layout fidelity is
 * preserved — only the text content, which is all the generation pipeline needs.
 */
export async function parsePptx(buffer) {
  const zip = await JSZip.loadAsync(buffer);

  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = Number(a.match(/slide(\d+)\.xml/)[1]);
      const numB = Number(b.match(/slide(\d+)\.xml/)[1]);
      return numA - numB;
    });

  const slideTexts = [];

  for (const fileName of slideFiles) {
    const xmlContent = await zip.files[fileName].async("string");
    const parsed = xmlParser.parse(xmlContent);
    const textRuns = [];
    collectTextRuns(parsed, textRuns);
    slideTexts.push(textRuns.join(" "));
  }

  return slideTexts.join("\n\n").trim();
}
