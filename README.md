# BUGSTRIKER — Adaptive Code Debugging Agent

BugStriker is an adaptive debugging agent for programming students that enforces a strict pedagogical loop:
1. **Execute** submitted Python code against fixed test cases in an isolated execution sandbox.
2. **Record** actual runtime evidence (inputs, outputs, stderr, tracebacks).
3. **Analyze** failure patterns and identify the single **most useful failure**.
4. **Probe** with exactly **ONE** targeted diagnostic question (no free answers).
5. **Wait** for the student's diagnosis and bug explanation.
6. **Allow** exactly **ONE** revised code submission.
7. **Re-execute** the same fixed tests.
8. **Synthesize** original evidence, explanation, revision, and new evidence into an evidence-based verdict (`VERIFIED`, `NOT_VERIFIED`, or `PARTIAL`).

---

## 🏗️ Architecture & State Machine

```
SUBMITTED
    ↓
RUNNING_TESTS
    ↓
ANALYZING
    ↓
QUESTIONING
    ↓
WAITING_FOR_STUDENT
    ↓
REVISION
    ↓
RUNNING_TESTS
    ↓
ANALYZING
    ↓
FINISHED
```

### Constraints Enforced:
- Maximum **1** diagnostic probe per run
- Maximum **1** student explanation
- Maximum **1** code revision
- Maximum **2** code executions per evaluation cycle
- Maximum **5** LLM calls per run
- Failed revision terminates in `NOT_VERIFIED` (no infinite loops)

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Monaco Code Editor, Space Grotesk & IBM Plex fonts.
- **Backend**: Python 3.11, FastAPI, Pydantic v2.
- **Database & Auth**: Supabase PostgreSQL + Supabase Auth (self-signup) + Realtime.
- **AI**: OpenAI API (`gpt-4o-mini` / configurable via `.env`). Kept strictly server-side.
- **Sandbox**: Subprocess execution runner with strict timeouts (5s) and resource limits (Docker sandbox path scaffolded).

---

## 🚀 Quick Start

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Provide your Supabase URL/keys and OpenAI API Key.
*(Note: BugStriker includes resilient fallback for immediate local testing if Supabase/OpenAI credentials are not yet configured!)*

### 2. Database Setup (Supabase)
In your Supabase project SQL Editor, run:
1. `supabase/migrations/initial_schema.sql` (Creates profiles, student_runs, code_submissions, diagnostic_questions, student_answers, verdicts, problems, test_cases with RLS).
2. `supabase/seed.sql` (Seeds Two Sum and FizzBuzz challenges).

### 3. Run the Application
You can run the launcher script:
```bash
chmod +x run.sh
./run.sh
```

Or run services manually:

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Visit: **http://localhost:5173**

---

## 🧪 Running Automated Tests

Run backend integration and unit tests:
```bash
cd backend
pytest ../tests/ -v
```

Tests verify:
- Subprocess execution runner, stdout/stderr capture, timeout enforcement
- State machine legal & illegal transitions
- Complete agentic loop (submission → probe → explanation → revision → verdict)
- Anti-cheating locks (prevention of double revisions or out-of-order calls)
