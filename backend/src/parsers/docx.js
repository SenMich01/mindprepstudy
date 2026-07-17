import mammoth from "mammoth";

/**
 * Extracts plain text from a DOCX file buffer.
 */
export async function parseDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}
