import { useState, useEffect, useCallback, useRef } from "react";
import Header from "./components/Header";
import QuizInput from "./components/QuizInput";
import PipelineStatus from "./components/PipelineStatus";
import ResultsPanel from "./components/ResultsPanel";
import LogsPanel from "./components/LogsPanel";
import RunHistoryDrawer from "./components/RunHistoryDrawer";
import { startRun, pollRun, healthCheck } from "./api/client";
import { useRunHistory } from "./hooks/useRunHistory";
import type { RunResult, AgentId, AgentStatus } from "./types";
import { AGENTS } from "./types";

type AppStatus = "idle" | "running" | "done" | "error";

const SESSION_KEY = "edumas_active_run";
const POLL_INTERVAL_MS = 2_000;

const AGENT_LOG_MARKERS: [RegExp, AgentId][] = [
  [/AssessmentAgent/,   "assessment"],
  [/GapAnalystAgent/,   "gap_analyst"],
  [/QuestionGenerator/, "question_generator"],
  [/StudyPlannerAgent/, "study_planner"],
];

const allPending = (): Record<AgentId, AgentStatus> =>
  Object.fromEntries(AGENTS.map((a) => [a.id, "pending"])) as Record<AgentId, AgentStatus>;

const allDone = (): Record<AgentId, AgentStatus> =>
  Object.fromEntries(AGENTS.map((a) => [a.id, "done"])) as Record<AgentId, AgentStatus>;

/** Infer agent progress from real log lines emitted so far. */
function agentStatusesFromLogs(logs: string[]): Record<AgentId, AgentStatus> {
  const seen = new Set<AgentId>();
  for (const log of logs) {
    for (const [re, id] of AGENT_LOG_MARKERS) {
      if (re.test(log)) seen.add(id);
    }
  }
  const s = allPending();
  AGENTS.forEach((agent, idx) => {
    if (!seen.has(agent.id)) return;
    const next = AGENTS[idx + 1];
    // If the next agent has already logged something, this one is done
    s[agent.id] = next && seen.has(next.id) ? "done" : "running";
  });
  return s;
}

export default function App() {
  const [appStatus, setAppStatus]     = useState<AppStatus>("idle");
  const [agentStatuses, setAgentStatuses] = useState(allPending);
  const [logs, setLogs]               = useState<string[]>([]);
  const [result, setResult]           = useState<RunResult | null>(null);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { history, add: addToHistory, remove: removeFromHistory, clear: clearHistory } = useRunHistory();

  useEffect(() => {
    healthCheck().then(setServerOnline);
  }, []);

  function stopPolling() {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  /** Begin polling a run_id until it finishes. quizJson is needed for history. */
  const attachPoller = useCallback((runId: string, quizJson: object) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const status = await pollRun(runId);

        // Update live logs and infer which agents are active
        setLogs(status.logs);
        if (status.logs.length > 0) {
          setAgentStatuses(agentStatusesFromLogs(status.logs));
        }

        if (status.status === "done" && status.result) {
          stopPolling();
          setAgentStatuses(allDone());
          setResult(status.result);
          setAppStatus("done");
          addToHistory(quizJson, status.result);
          sessionStorage.removeItem(SESSION_KEY);
        } else if (status.status === "error") {
          stopPolling();
          setErrorMsg(status.error ?? "Pipeline failed.");
          setAgentStatuses((prev) => {
            const running = Object.entries(prev).find(([, v]) => v === "running");
            return running
              ? ({ ...prev, [running[0]]: "error" } as Record<AgentId, AgentStatus>)
              : prev;
          });
          setAppStatus("error");
          sessionStorage.removeItem(SESSION_KEY);
        }
      } catch {
        stopPolling();
        setErrorMsg("Lost connection to server. The run may still be in progress — refresh to reconnect.");
        setAppStatus("error");
      }
    }, POLL_INTERVAL_MS);
  }, [addToHistory]);

  /** Start a brand-new run. */
  const handleRun = useCallback(async (quizJson: object) => {
    stopPolling();
    setAppStatus("running");
    setResult(null);
    setErrorMsg(null);
    setLogs([]);
    setAgentStatuses(allPending());

    try {
      const runId = await startRun(quizJson);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ runId, quizJson }));
      attachPoller(runId, quizJson);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not reach server.";
      setErrorMsg(msg);
      setAppStatus("error");
    }
  }, [attachPoller]);

  // On mount: if there's an active run in sessionStorage, reconnect to it silently
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const { runId, quizJson } = JSON.parse(raw);
      if (runId) {
        setAppStatus("running");
        setAgentStatuses(allPending());
        attachPoller(runId, quizJson);
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
    return stopPolling;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function restoreRun(res: RunResult) {
    stopPolling();
    setResult(res);
    setLogs(res.logs);
    setAgentStatuses(allDone());
    setAppStatus("done");
    setErrorMsg(null);
  }

  const isRunning = appStatus === "running";

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        historyCount={history.length}
        onHistoryOpen={() => setHistoryOpen(true)}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

        {serverOnline === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            <strong>Server not detected.</strong> Start the FastAPI server:
            <code className="ml-2 bg-amber-100 px-2 py-0.5 rounded text-xs font-mono">
              uvicorn server.main:app --reload
            </code>
          </div>
        )}

        {appStatus !== "idle" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Pipeline
            </h2>
            <PipelineStatus statuses={agentStatuses} />
          </div>
        )}

        {(isRunning || logs.length > 0) && (
          <LogsPanel logs={logs} isRunning={isRunning} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <QuizInput onRun={handleRun} loading={isRunning} />

          <div>
            {appStatus === "idle" && (
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
        onRestore={(res) => restoreRun(res)}
        onRemove={removeFromHistory}
        onClear={clearHistory}
      />
    </div>
  );
}
