import axios from "axios";
import type { RunResult } from "../types";

const http = axios.create({ baseURL: "/api" });

export interface RunStatus {
  status: "running" | "done" | "error";
  logs: string[];
  result: RunResult | null;
  error: string | null;
}

/** Start a pipeline run. Returns run_id immediately — job runs in background. */
export async function startRun(quizJson: object): Promise<string> {
  const { data } = await http.post<{ run_id: string }>("/run", { quiz_json: quizJson });
  return data.run_id;
}

/** Poll the status of a running or completed job. */
export async function pollRun(runId: string): Promise<RunStatus> {
  const { data } = await http.get<RunStatus>(`/run/${runId}`);
  return data;
}

export async function healthCheck(): Promise<boolean> {
  try {
    await http.get("/health");
    return true;
  } catch {
    return false;
  }
}
