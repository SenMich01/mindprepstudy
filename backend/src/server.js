import express from "express";
import cors from "cors";
import "dotenv/config";

import { coursesRouter } from "./routes/courses.js";
import { uploadRouter } from "./routes/upload.js";
import { generateRouter } from "./routes/generate.js";
import { quizRouter } from "./routes/quiz.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/courses", coursesRouter);
app.use("/upload", uploadRouter);
app.use("/generate", generateRouter);
app.use("/quiz", quizRouter);

// Fallback error handler — never let an unhandled error hang the request silently.
app.use((err, req, res, next) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

app.listen(PORT, () => {
  console.log(`PrepMind backend running on http://localhost:${PORT}`);
});
