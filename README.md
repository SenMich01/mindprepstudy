# MindPrepStudy

AI-powered exam-prep copilot — upload lecture notes, slides, or PDFs and get a structured revision pack, predicted exam questions, and an auto-generated quiz that tracks your weak topics.

Built for OpenAI Build Week (July 2026) — Education track.

## Live Demo

- **App:** [add Render frontend URL]
- **API:** [add Render backend URL]
- **Demo account:** email `[add]` / password `[add]` (pre-seeded with a sample course, documents, revision pack, and quiz)
- **Demo video:** [add YouTube link]

## What it does

1. Create a Course.
2. Upload notes as pasted text or a PDF.
3. Generate a revision pack: key concepts, first-principles explanations, mnemonics, and predicted exam questions with model answers.
4. Take an auto-generated quiz on the same material.
5. See which topics you got wrong, and regenerate a focused mini revision pack targeting just those weak areas.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node/Express
- **Database/Auth/Storage:** Supabase
- **AI:** GPT-5.6 (via OpenAI API)
- **Deployment:** Render (frontend + backend as separate services)

## Repo Structure

```
project-root/
├── sample-data/       # example notes in each supported format
├── frontend/          # React + Vite app
└── backend/           # Express API (owns the OpenAI key, parsing, GPT-5.6 calls)
```

## Running Locally

### Prerequisites
- Node.js 22.13+
- A free [Supabase](https://supabase.com) project
- An [OpenAI API key](https://platform.openai.com/api-keys)

### 1. Clone and install
```bash
git clone <this-repo-url>
cd <repo-directory>

cd backend && npm install
cd ../frontend && npm install
```

### 2. Set up Supabase
- Create a new Supabase project.
- In **SQL Editor**, create a new query, paste the complete contents of `backend/schema.sql`, and select **Run**. A successful first run creates six tables and their Row Level Security policies.
- From **Project Settings → API**, copy the Project URL, the browser-safe **anon** (or publishable) key, and the server-only **service_role** key. Do not put the service-role key in the frontend.
- In **Authentication → URL Configuration**, set the Site URL to `http://localhost:5173` and add `http://localhost:5173/login` as a Redirect URL. Add the corresponding deployed URL and `/login` redirect URL before deploying.
- In **Authentication → Providers → Email**, decide whether to require Confirm email. It can be disabled for the fastest local test; when enabled, MindPrepStudy shows a confirmation message and asks the user to sign in after using the email link.

### 3. Environment variables

Copy the example env files and fill them in:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

`backend/.env`:
```
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PORT=4000
```

`frontend/.env`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:4000
```

### 4. Run both services
```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:4000`.

### 5. Verify signup and authenticated API access
1. Open `http://localhost:5173/login`, choose **Need an account? Sign up**, and use a new email address and a password of at least six characters.
2. If email confirmation is disabled, the app should open **Your Courses** immediately. If it is enabled, open the confirmation email, then sign in with the same credentials.
3. Create a course. Its creation and subsequent listing prove that the browser session was created, its access token was sent to the Express API, `requireAuth` validated it with Supabase, and the API wrote/read the course under the new user's ID.
4. In Supabase **Authentication → Users**, confirm the account exists. In **Table Editor → courses**, confirm the new row has that account's `user_id`.

If the SQL editor reports that a policy already exists, the schema has already been run in that project; do not rerun it unchanged. The table statements are safe to repeat, but the named policy creation statements are intentionally first-run setup.

### 6. Try it with sample data
Use the files in `/sample-data` to test uploads (text and PDF) without needing your own course material. (`sample-notes.docx` and `sample-slides.pptx` are kept in that folder for reference but aren't used by the app — upload support is scoped to PDF for this build.)

## How Codex and GPT-5.6 were used

*(To be filled in as the project is built — see hackathon submission requirements. Cover: where Codex accelerated the workflow, where key product/engineering/design decisions were made by the author, and how GPT-5.6 shaped the final result. Include the /feedback Codex Session ID from the main build session.)*

## License

MIT
