import OpenAI from "openai";
import "dotenv/config";

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "[openai] Missing OPENAI_API_KEY — set it in the backend's environment variables (Render: Environment tab)."
  );
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Single choke point for all GPT-5.6 calls (per PRD Section 8).
// Handles retry/backoff on 429s so callers don't each need their own logic.
const MAX_RETRIES = 4;
const BASE_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls the chat completions endpoint with retry/backoff on rate limits.
 * @param {Object} params - { model, messages, response_format, ... }
 */
export async function callGPT(params) {
  let attempt = 0;

  while (true) {
    try {
      const response = await client.chat.completions.create({
        model: params.model || "gpt-5.6-terra",
        messages: params.messages,
        response_format: params.response_format,
        // Note: gpt-5.6-terra (and other reasoning-tier models) only support
        // the default temperature (1) — passing any other value throws a
        // 400 unsupported_value error. Omit it entirely rather than guess.
      });
      return response.choices[0].message.content;
    } catch (err) {
      const isRateLimit = err?.status === 429;
      attempt += 1;

      if (!isRateLimit || attempt > MAX_RETRIES) {
        // Not a rate limit, or we've exhausted retries — bubble up.
        // Log full detail here since this is the one place every GPT call
        // passes through; route handlers only see a generic message.
        console.error("[openai] Call failed:", {
          status: err?.status,
          message: err?.message,
          code: err?.code,
          type: err?.type,
        });
        throw err;
      }

      const retryAfterHeader = err?.headers?.["retry-after"];
      const delay = retryAfterHeader
        ? Number(retryAfterHeader) * 1000
        : BASE_DELAY_MS * 2 ** (attempt - 1);

      console.warn(
        `[openai] Rate limited. Retry ${attempt}/${MAX_RETRIES} after ${delay}ms`
      );
      await sleep(delay);
    }
  }
}

/**
 * Generates a structured revision pack (concepts, mnemonics, predicted
 * questions) from raw course text. Returns parsed JSON.
 */
export async function generateRevisionPack(courseText, { focusTopics } = {}) {
  const scopeNote = focusTopics?.length
    ? `Focus ONLY on these weak topics the student struggled with: ${focusTopics.join(", ")}.`
    : "";

  const systemPrompt = `You are an expert study assistant. Given raw course notes, produce a structured, exam-ready revision pack. ${scopeNote}
Respond ONLY with valid JSON in this exact shape:
{
  "concepts": [{ "title": "", "explanation": "", "mnemonic": "" }],
  "predictedQuestions": [{ "question": "", "modelAnswer": "" }]
}
No preamble, no markdown fences, JSON only.`;

  const raw = await callGPT({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: courseText },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(raw);
}

/**
 * Generates a quiz (mix of MCQ + short answer) from raw course text.
 */
export async function generateQuiz(courseText) {
  const systemPrompt = `You are an expert study assistant. Given raw course notes, generate a quiz of 6-10 questions mixing multiple-choice and short-answer, tagged by topic.
Respond ONLY with valid JSON in this exact shape:
{
  "questions": [
    {
      "type": "mcq",
      "topic": "",
      "question": "",
      "options": ["", "", "", ""],
      "correctAnswer": ""
    },
    {
      "type": "short",
      "topic": "",
      "question": "",
      "correctAnswer": ""
    }
  ]
}
No preamble, no markdown fences, JSON only.`;

  const raw = await callGPT({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: courseText },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(raw);
}
