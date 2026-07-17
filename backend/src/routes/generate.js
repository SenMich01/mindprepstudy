import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../lib/auth.js";
import { generateRevisionPack, generateQuiz } from "../services/openai.js";

export const generateRouter = Router();
generateRouter.use(requireAuth);

// Concatenates all document text for a course. Simple truncation guard for
// now — replace with a smarter token-budget strategy if courses grow large.
async function getCourseText(courseId) {
  const { data: documents, error } = await supabase
    .from("documents")
    .select("extracted_text")
    .eq("course_id", courseId);

  if (error) throw new Error(error.message);
  if (!documents?.length) return null;

  const combined = documents.map((d) => d.extracted_text).join("\n\n---\n\n");
  const MAX_CHARS = 40000; // rough guard, tune against real token limits
  return combined.slice(0, MAX_CHARS);
}

// Generate (or reuse) a revision pack for a course.
// Caching behavior per PRD Section 8.2: only regenerate on explicit request.
generateRouter.post("/:courseId/pack", async (req, res) => {
  const { courseId } = req.params;
  const { focusTopics, forceRegenerate } = req.body || {};

  try {
    if (!forceRegenerate && !focusTopics?.length) {
      const { data: existing } = await supabase
        .from("revision_packs")
        .select("*")
        .eq("course_id", courseId)
        .eq("is_focused", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) return res.json({ revisionPack: existing, reused: true });
    }

    const courseText = await getCourseText(courseId);
    if (!courseText) {
      return res.status(400).json({ error: "No documents uploaded for this course yet" });
    }

    const packContent = await generateRevisionPack(courseText, { focusTopics });

    const { data, error } = await supabase
      .from("revision_packs")
      .insert({
        course_id: courseId,
        content_json: packContent,
        is_focused: Boolean(focusTopics?.length),
        focus_topics: focusTopics || [],
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ revisionPack: data, reused: false });
  } catch (err) {
    console.error("[generate] Revision pack failed:", err.message);
    res.status(502).json({ error: "Generation failed. Please try again in a moment." });
  }
});

// Generate a quiz for a course, linked to its most recent revision pack.
generateRouter.post("/:courseId/quiz", async (req, res) => {
  const { courseId } = req.params;

  try {
    const courseText = await getCourseText(courseId);
    if (!courseText) {
      return res.status(400).json({ error: "No documents uploaded for this course yet" });
    }

    const { data: latestPack } = await supabase
      .from("revision_packs")
      .select("id")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const quiz = await generateQuiz(courseText);

    const rows = quiz.questions.map((q) => ({
      course_id: courseId,
      revision_pack_id: latestPack?.id || null,
      question: q.question,
      type: q.type,
      options: q.options || null,
      correct_answer: q.correctAnswer,
      topic: q.topic,
    }));

    const { data, error } = await supabase.from("quiz_questions").insert(rows).select();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ questions: data });
  } catch (err) {
    console.error("[generate] Quiz generation failed:", err.message);
    res.status(502).json({ error: "Generation failed. Please try again in a moment." });
  }
});
