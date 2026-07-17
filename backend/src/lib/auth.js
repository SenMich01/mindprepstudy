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
