import { supabase } from "./supabase.js";

/**
 * Verifies the Supabase-issued JWT sent by the frontend (Authorization:
 * Bearer <token>) and attaches the resolved user to req.user.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = data.user;
  next();
}

/**
 * Confirms that the course in the current route belongs to the authenticated
 * user. The backend uses a service-role client, so this check is required
 * before accessing course-linked data.
 */
export async function requireCourseOwner(req, res, next) {
  const courseId = req.params.courseId;
  const { data, error } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("user_id", req.user.id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Course not found" });

  next();
}
