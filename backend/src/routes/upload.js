import { Router } from "express";
import multer from "multer";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../lib/auth.js";
import { parsePdf } from "../parsers/pdf.js";
import { parseDocx } from "../parsers/docx.js";
import { parsePptx } from "../parsers/pptx.js";

export const uploadRouter = Router();
uploadRouter.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage() });

// Build order note (per PRD): text -> PDF -> DOCX -> PPTX.
// Each branch below is independent — if one format has an issue near the
// deadline, comment it out without breaking the others.
async function extractText(file) {
  const ext = file.originalname.split(".").pop().toLowerCase();

  switch (ext) {
    case "pdf":
      return { text: await parsePdf(file.buffer), sourceType: "pdf" };
    case "docx":
      return { text: await parseDocx(file.buffer), sourceType: "docx" };
    case "pptx":
      return { text: await parsePptx(file.buffer), sourceType: "pptx" };
    default:
      throw new Error(`Unsupported file type: .${ext}`);
  }
}

// Paste-text path — always available, zero-parsing fallback (PRD Section 7.2)
uploadRouter.post("/:courseId/text", async (req, res) => {
  const { courseId } = req.params;
  const { text } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ error: "Text content is required" });
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      course_id: courseId,
      source_type: "text",
      extracted_text: text.trim(),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ document: data });
});

// File upload path — PDF, DOCX, or PPTX
uploadRouter.post("/:courseId/file", upload.single("file"), async (req, res) => {
  const { courseId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const { text, sourceType } = await extractText(req.file);

    if (!text.trim()) {
      return res.status(422).json({
        error: "No text could be extracted from this file. Try the paste-text option instead.",
      });
    }

    const { data, error } = await supabase
      .from("documents")
      .insert({ course_id: courseId, source_type: sourceType, extracted_text: text })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ document: data });
  } catch (err) {
    console.error(`[upload] Failed to parse ${req.file.originalname}:`, err.message);
    res.status(422).json({
      error: `Could not parse this file (${err.message}). Try the paste-text option instead.`,
    });
  }
});
