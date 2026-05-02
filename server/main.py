"""EduMAS FastAPI server — bridges the React frontend to the Python pipeline.

Setup:
    1. Set EDUMAS_PATH to the root of the CTSE-Assigment2 project, OR place
       this repo next to it (default path is used automatically).
    2. pip install -r requirements.txt
    3. uvicorn main:app --reload
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Resolve the backend project path
_here = Path(__file__).resolve().parent
_default_backend = _here.parent.parent / "CTSE-Assigment2" / ".claude" / "worktrees" / "cool-tharp-428168"
EDUMAS_PATH = Path(os.environ.get("EDUMAS_PATH", str(_default_backend)))

if not EDUMAS_PATH.is_dir():
    raise RuntimeError(
        f"EduMAS backend not found at {EDUMAS_PATH}. "
        "Set the EDUMAS_PATH environment variable to the project root."
    )

sys.path.insert(0, str(EDUMAS_PATH))

from main import run  # noqa: E402  (imported after sys.path update)

app = FastAPI(title="EduMAS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class RunRequest(BaseModel):
    quiz_json: dict


class RunResponse(BaseModel):
    weak_topic: str
    knowledge_brief: str
    practice_questions: list[dict]
    study_plan: str
    study_plan_path: str
    study_plan_pdf_path: str
    logs: list[str]


@app.get("/api/health")
def health():
    return {"status": "ok", "backend": str(EDUMAS_PATH)}


@app.post("/api/run", response_model=RunResponse)
def run_pipeline(req: RunRequest):
    tmp = tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", delete=False, encoding="utf-8"
    )
    try:
        json.dump(req.quiz_json, tmp)
        tmp.close()
        state = run(tmp.name)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass

    return RunResponse(
        weak_topic=state.get("weak_topic", ""),
        knowledge_brief=state.get("knowledge_brief", ""),
        practice_questions=list(state.get("practice_questions") or []),
        study_plan=state.get("study_plan", ""),
        study_plan_path=state.get("study_plan_path", ""),
        study_plan_pdf_path=state.get("study_plan_pdf_path", ""),
        logs=list(state.get("logs") or []),
    )
