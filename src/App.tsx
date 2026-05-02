import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import QuizInput from "./components/QuizInput";
import PipelineStatus from "./components/PipelineStatus";
import ResultsPanel from "./components/ResultsPanel";
import LogsPanel from "./components/LogsPanel";
import RunHistoryDrawer from "./components/RunHistoryDrawer";
import { runPipeline, healthCheck } from "./api/client";
import { useRunHistory } from "./hooks/useRunHistory";
import type { RunResult, AgentId, AgentStatus } from "./types";
import { AGENTS } from "./types";

type AppStatus = "idle" | "interrupted" | "running" | "done" | "error";

const SESSION_KEY = "edumas_pending_run";
const AGENT_TIMING_MS = [35_000, 65_000, 80_000, 110_000];

const allPending = (): Record<AgentId, AgentStatus> =>
  Object.fromEntries(AGENTS.map((a) => [a.id, "pending"])) as Record<AgentId, AgentStatus>;

const allDone = (): Record<AgentId, AgentStatus> =>
  Object.fromEntries(AGENTS.map((a) => [a.id, "done"])) as Record<AgentId, AgentStatus>;

export default function App() {
  const [appStatus, setAppStatus] = useState<AppStatus>("idle");
  const [agentStatuses, setAgentStatuses] = useState(allPending);
  const [result, setResult] = useState<RunResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState<object | null>(null);

  const { history, add: addToHistory, remove: removeFromHistory, clear: clearHistory } = useRunHistory();

  useEffect(() => {
    healthCheck().then(setServerOnline);
  }, []);

  // Restore interrupted session on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const { quizJson, startedAt } = JSON.parse(raw);
      const ageMs = Date.now() - startedAt;
      if (ageMs < 10 * 60 * 1000) {
        setPendingQuiz(quizJson);
        setAppStatus("interrupted");
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const handleRun = useCallback(async (quizJson: object) => {
    setAppStatus("running");
    setResult(null);
    setErrorMsg(null);
    setAgentStatuses(allPending());
    setPendingQuiz(null);

    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ quizJson, startedAt: Date.now() }));

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
      setAgentStatuses(allDone());
      setResult(res);
      setAppStatus("done");
      addToHistory(quizJson, res);
      sessionStorage.removeItem(SESSION_KEY);
    } catch (err: unknown) {
      timers.forEach(clearTimeout);
      const msg =
        err instanceof Error ? err.message : "Pipeline failed. Check the server is running.";
      setErrorMsg(msg);
      setAgentStatuses((prev) => {
        const running = Object.entries(prev).find(([, v]) => v === "running");
        return running
          ? { ...prev, [running[0]]: "error" } as Record<AgentId, AgentStatus>
          : prev;
      });
      setAppStatus("error");
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [addToHistory]);

  function restoreRun(res: RunResult) {
    setResult(res);
    setAgentStatuses(allDone());
    setAppStatus("done");
    setErrorMsg(null);
  }

  const isRunning = appStatus === "running";
  const logs = result?.logs ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        historyCount={history.length}
        onHistoryOpen={() => setHistoryOpen(true)}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

        {/* Server offline warning */}
        {serverOnline === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            <strong>Server not detected.</strong> Start the FastAPI server:
            <code className="ml-2 bg-amber-100 px-2 py-0.5 rounded text-xs font-mono">
              uvicorn server.main:app --reload
            </code>
          </div>
        )}

        {/* Interrupted session banner */}
        {appStatus === "interrupted" && pendingQuiz && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-800">Run was interrupted by a page refresh</p>
              <p className="text-xs text-blue-600 mt-0.5">The pipeline did not complete. Restart it?</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => handleRun(pendingQuiz)}
                className="text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg"
              >
                Restart
              </button>
              <button
                onClick={() => { setAppStatus("idle"); sessionStorage.removeItem(SESSION_KEY); }}
                className="text-xs text-blue-500 hover:text-blue-700 px-3 py-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Pipeline status bar */}
        {(appStatus === "running" || appStatus === "done" || appStatus === "error") && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Pipeline
            </h2>
            <PipelineStatus statuses={agentStatuses} />
          </div>
        )}

        {/* Logs panel — full width, shown during and after run */}
        {(isRunning || logs.length > 0) && (
          <LogsPanel logs={logs} isRunning={isRunning} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: input */}
          <QuizInput onRun={handleRun} loading={isRunning} />

          {/* Right: results */}
          <div>
            {(appStatus === "idle" || appStatus === "interrupted") && (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
                <div className="text-4xl mb-3">📚</div>
                <p className="text-sm font-medium">Results will appear here</p>
                <p className="text-xs mt-1">Submit a quiz JSON to run the 4-agent pipeline</p>
              </div>
            )}

            {appStatus === "running" && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
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

      <RunHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onRestore={(res, _quiz) => restoreRun(res)}
        onRemove={removeFromHistory}
        onClear={clearHistory}
      />
    </div>
  );
}
