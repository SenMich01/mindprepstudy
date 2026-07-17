import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, requireCourseOwner } from "../lib/auth.js";

export const quizRouter = Router();
quizRouter.use(requireAuth);
quizRouter.use("/:courseId", requireCourseOwner);

// Get all quiz questions for a course
quizRouter.get("/:courseId", async (req, res) => {
  const { courseId } = req.params;
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("course_id", courseId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ questions: data });
});

// Submit answers, score them, and record which topics were missed
quizRouter.post("/:courseId/submit", async (req, res) => {
  const { courseId } = req.params;
  const { answers } = req.body; // [{ questionId, answer }]

  if (!Array.isArray(answers) || !answers.length) {
    return res.status(400).json({ error: "answers array is required" });
  }

  const questionIds = answers.map((a) => a.questionId);
  if (new Set(questionIds).size !== questionIds.length) {
    return res.status(400).json({ error: "Each quiz question can only be answered once" });
  }

  const { data: questions, error: qError } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("course_id", courseId);

  if (qError) return res.status(500).json({ error: qError.message });
  if (!questions?.length) return res.status(404).json({ error: "No quiz questions found" });

  const expectedIds = new Set(questions.map((q) => q.id));
  if (
    questionIds.length !== expectedIds.size ||
    questionIds.some((questionId) => !expectedIds.has(questionId))
  ) {
    return res.status(400).json({ error: "Answer every question in this quiz before submitting" });
  }

  const questionById = Object.fromEntries(questions.map((q) => [q.id, q]));
  let correctCount = 0;
  const weakTopics = new Set();

  for (const { questionId, answer } of answers) {
    const question = questionById[questionId];
    if (!question) continue;

    const isCorrect =
      question.correct_answer.trim().toLowerCase() === String(answer).trim().toLowerCase();

    if (isCorrect) correctCount += 1;
    else if (question.topic) weakTopics.add(question.topic);
  }

  const score = Math.round((correctCount / questions.length) * 100);

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: req.user.id,
      course_id: courseId,
      score,
      weak_topics: Array.from(weakTopics),
    })
    .select()
    .single();

  if (attemptError) return res.status(500).json({ error: attemptError.message });

  res.json({ attempt, score, weakTopics: Array.from(weakTopics) });
});
