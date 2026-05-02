import { useState, useEffect } from "react";
import Header from "./components/Header";
import QuizInput from "./components/QuizInput";
import PipelineStatus from "./components/PipelineStatus";
import ResultsPanel from "./components/ResultsPanel";
import { runPipeline, healthCheck } from "./api/client";
import type { RunResult, AgentId, AgentStatus } from "./types";
import { AGENTS } from "./types";

type AppStatus = "idle" | "running" | "done" | "error";

const initialAgentStatuses = (): Record<AgentId, AgentStatus> =>
  Object.fromEntries(AGENTS.map((a) => [a.id, "pending"])) as Record<AgentId, AgentStatus>;

const AGENT_TIMING_MS = [35_000, 65_000, 80_000, 110_000];

export default function App() {
  const [appStatus, setAppStatus] = useState<AppStatus>("idle");
  const [agentStatuses, setAgentStatuses] = useState(initialAgentStatuses);
  const [result, setResult] = useState<RunResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  useEffect(() => {
    healthCheck().then(setServerOnline);
  }, []);

  async function handleRun(quizJson: object) {
    setAppStatus("running");
    setResult(null);
    setErrorMsg(null);
    setAgentStatuses(initialAgentStatuses());

    // Animate pipeline steps based on estimated timing
    const timers: ReturnType<typeof setTimeout>[] = [];
    AGENTS.forEach((agent, idx) => {
      timers.push(
        setTimeout(() => {
          setAgentStatuses((prev) => ({ ...prev, [agent.id]: "running" }));
        }, idx === 0 ? 200 : AGENT_TIMING_MS[idx - 1])
      );
    });

    try {
      const res = await runPipeline(quizJson);
      timers.forEach(clearTimeout);
      setAgentStatuses(
        Object.fromEntries(AGENTS.map((a) => [a.id, "done"])) as Record<AgentId, AgentStatus>
      );
      setResult(res);
      setAppStatus("done");
    } catch (err: unknown) {
      timers.forEach(clearTimeout);
      const msg =
        err instanceof Error ? err.message : "Pipeline failed. Check that the server is running.";
      setErrorMsg(msg);
      setAgentStatuses((prev) => {
        const running = Object.entries(prev).find(([, v]) => v === "running");
        if (running) {
          return { ...prev, [running[0]]: "error" } as Record<AgentId, AgentStatus>;
        }
        return prev;
      });
      setAppStatus("error");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        {/* Server status banner */}
        {serverOnline === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            <strong>Server not detected.</strong> Start the FastAPI server first:
            <code className="ml-2 bg-amber-100 px-2 py-0.5 rounded text-xs font-mono">
              cd server && uvicorn main:app --reload
            </code>
          </div>
        )}

        {/* Pipeline status (shown once started) */}
        {appStatus !== "idle" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Pipeline
            </h2>
            <PipelineStatus statuses={agentStatuses} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: input */}
          <QuizInput onRun={handleRun} loading={appStatus === "running"} />

          {/* Right: results or placeholder */}
          <div>
            {appStatus === "idle" && (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
                <div className="text-4xl mb-3">📚</div>
                <p className="text-sm font-medium">Results will appear here</p>
                <p className="text-xs mt-1">
                  Submit a quiz JSON to run the 4-agent pipeline
                </p>
              </div>
            )}

            {appStatus === "running" && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-medium text-slate-700">Agents are working…</p>
                <p className="text-xs text-slate-400 mt-1">This can take 1–3 minutes with Ollama</p>
              </div>
            )}

            {appStatus === "error" && errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-red-800 mb-1">Pipeline Error</h3>
                <p className="text-xs text-red-700 font-mono">{errorMsg}</p>
                <p className="text-xs text-red-600 mt-2">
                  If this is a timeout, set{" "}
                  <code className="bg-red-100 px-1 rounded">OLLAMA_TIMEOUT=300</code> and retry.
                </p>
              </div>
            )}

            {appStatus === "done" && result && <ResultsPanel result={result} />}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white text-center text-xs text-slate-400 py-4">
        EduMAS · CTSE Assignment 2 · Multi-Agent Educational System
      </footer>
    </div>
  );
}
