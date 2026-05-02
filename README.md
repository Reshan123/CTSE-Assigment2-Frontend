# EduMAS Frontend

React + Vite frontend for the EduMAS Multi-Agent Study Planner, with a FastAPI bridge server.

## Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **API server**: FastAPI + Uvicorn (bridges the frontend to the Python pipeline)

## Prerequisites

- Node.js 18+
- Python 3.11+
- Ollama running locally with `llama3:8b` pulled

## Quick Start

### 1. Start the API server

```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload
# Runs on http://localhost:8000
```

### 2. Start the frontend

```bash
npm install
npm run dev
# Opens http://localhost:3000
```

## Usage

1. Open `http://localhost:3000`
2. Paste or upload a quiz JSON file (click **Load sample** to use the built-in example)
3. Click **Run EduMAS Pipeline**
4. Watch the 4-agent pipeline progress; results appear on the right when done

## Quiz JSON Format

```json
{
  "student": "Alice",
  "answers": [
    { "topic": "Calculus", "correct": false },
    { "topic": "Calculus", "correct": false },
    { "topic": "Statistics", "correct": true }
  ]
}
```

## Timeout Note

If the StudyPlannerAgent times out (> 120 s), set a longer timeout before starting the server:

```bash
set OLLAMA_TIMEOUT=300
uvicorn main:app --reload
```
