import { Router } from "express";
import multer from "multer";
import { supabase } from "../lib/supabase.js";
import { requireAuth, requireCourseOwner } from "../lib/auth.js";
import { parsePdf } from "../parsers/pdf.js";

export const uploadRouter = Router();
uploadRouter.use(requireAuth);
uploadRouter.use("/:courseId", requireCourseOwner);

// Focused scope: PDF only (per product decision). DOCX/PPTX parsers still
// exist in src/parsers/ if you want to re-enable them later — just add
// their cases back into extractText() and loosen the multer filter below.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are supported right now. Try the paste-text option instead."));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

async function extractText(file) {
  const ext = file.originalname.split(".").pop().toLowerCase();

  if (ext !== "pdf") {
    throw new Error(`Unsupported file type: .${ext}. Only PDF is supported right now.`);
  }
  return { text: await parsePdf(file.buffer), sourceType: "pdf" };
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

// File upload path — PDF only
uploadRouter.post("/:courseId/file", (req, res) => {
  upload.single("file")(req, res, async (multerErr) => {
    if (multerErr) {
      return res.status(422).json({ error: multerErr.message });
    }

    const { courseId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const { text, sourceType } = await extractText(req.file);

      if (!text.trim()) {
        return res.status(422).json({
          error: "No text could be extracted from this PDF. If it's a scanned/image-only PDF, try the paste-text option instead.",
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
        error: `Could not parse this PDF (${err.message}). Try the paste-text option instead.`,
      });
    }
  });
});
