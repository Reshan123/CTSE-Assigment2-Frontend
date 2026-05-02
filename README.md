# EduMAS Frontend

React + Vite frontend for the EduMAS Multi-Agent Study Planner, with a FastAPI bridge server.

## Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **API server**: FastAPI + Uvicorn (bridges the frontend to the Python pipeline)

## Prerequisites

- Node.js 18+
- Python 3.11+
- The [CTSE-Assigment2](https://github.com/your-org/CTSE-Assigment2) backend cloned as a sibling directory, **or** `EDUMAS_PATH` set to its location
- Ollama running locally with `llama3:8b` pulled

## Quick Start

### 1. Start the API server

```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload
# Runs on http://localhost:8000
```

If the backend is not at the default path, set the env var first:

```bash
set EDUMAS_PATH=C:\path\to\CTSE-Assigment2   # Windows
export EDUMAS_PATH=/path/to/CTSE-Assigment2   # Mac/Linux
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
  "subject": "Mathematics",
  "questions": [
    {
      "question": "What is the derivative of x²?",
      "student_answer": "2x",
      "correct_answer": "2x",
      "score": 1
    }
  ]
}
```

## Timeout Note

If the StudyPlannerAgent times out (> 120 s), set a longer timeout before starting the server:

```bash
set OLLAMA_TIMEOUT=300
uvicorn main:app --reload
```
