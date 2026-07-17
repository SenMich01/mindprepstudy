import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../lib/auth.js";

export const coursesRouter = Router();

coursesRouter.use(requireAuth);

// List all courses for the logged-in user
coursesRouter.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ courses: data });
});

// Create a new course
coursesRouter.post("/", async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Course name is required" });

  const { data, error } = await supabase
    .from("courses")
    .insert({ user_id: req.user.id, name, description })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ course: data });
});

// Get a single course, including its documents and latest revision pack
coursesRouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .eq("user_id", req.user.id)
    .single();

  if (courseError) return res.status(404).json({ error: "Course not found" });

  const { data: documents } = await supabase
    .from("documents")
    .select("id, source_type, created_at")
    .eq("course_id", id);

  const { data: revisionPacks } = await supabase
    .from("revision_packs")
    .select("*")
    .eq("course_id", id)
    .order("created_at", { ascending: false });

  res.json({ course, documents, revisionPacks });
});

// Delete a course
coursesRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", id)
    .eq("user_id", req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});
