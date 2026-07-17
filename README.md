# PrepMind

AI-powered exam-prep copilot — upload lecture notes, slides, or PDFs and get a structured revision pack, predicted exam questions, and an auto-generated quiz that tracks your weak topics.

Built for OpenAI Build Week (July 2026) — Education track.

## Live Demo

- **App:** [add Render frontend URL]
- **API:** [add Render backend URL]
- **Demo account:** email `demo@prepmind.app` / password `[add]` (pre-seeded with a sample course, documents, revision pack, and quiz)
- **Demo video:** [add YouTube link]

## What it does

1. Create a Course.
2. Upload notes as pasted text, PDF, DOCX, or PPTX slides.
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
prepmind/
├── sample-data/       # example notes in each supported format
├── frontend/          # React + Vite app
└── backend/           # Express API (owns the OpenAI key, parsing, GPT-5.6 calls)
```

## Running Locally

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project
- An [OpenAI API key](https://platform.openai.com/api-keys)

### 1. Clone and install
```bash
git clone <this-repo-url>
cd prepmind

cd backend && npm install
cd ../frontend && npm install
```

### 2. Set up Supabase
- Create a new Supabase project.
- Run the SQL schema in `backend/schema.sql` (Supabase SQL editor → paste → run).
- Copy your Project URL, anon key, and service role key from Supabase → Settings → API.

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

### 5. Try it with sample data
Use the files in `/sample-data` to test uploads in each supported format (text, PDF, DOCX, PPTX) without needing your own course material.

## How Codex and GPT-5.6 were used

*(To be filled in as the project is built — see hackathon submission requirements. Cover: where Codex accelerated the workflow, where key product/engineering/design decisions were made by the author, and how GPT-5.6 shaped the final result. Include the /feedback Codex Session ID from the main build session.)*

## License

MIT
