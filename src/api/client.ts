import axios from "axios";
import type { RunResult } from "../types";

const http = axios.create({ baseURL: "/api" });

export async function runPipeline(quizJson: object): Promise<RunResult> {
  const { data } = await http.post<RunResult>("/run", { quiz_json: quizJson });
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
