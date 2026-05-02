import { useEffect, useRef, useState } from "react";

interface Props {
  logs: string[];
  isRunning: boolean;
}

const AGENT_COLORS: [RegExp, string][] = [
  [/AssessmentAgent/,      "text-sky-400"],
  [/GapAnalystAgent/,      "text-violet-400"],
  [/QuestionGenerator/,    "text-amber-400"],
  [/StudyPlannerAgent/,    "text-emerald-400"],
  [/error|fail|exception/i,"text-red-400"],
];

function lineColor(log: string): string {
  for (const [re, cls] of AGENT_COLORS) {
    if (re.test(log)) return cls;
  }
  return "text-slate-300";
}

function highlight(log: string): React.ReactNode {
  // Bold anything inside [ ]
  return log.split(/(\[[^\]]+\])/).map((part, i) =>
    /^\[/.test(part)
      ? <span key={i} className="font-semibold text-white">{part}</span>
      : <span key={i}>{part}</span>
  );
}

export default function LogsPanel({ logs, isRunning }: Props) {
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive and panel is open
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length, open]);

  // Auto-open when run starts
  useEffect(() => {
    if (isRunning) setOpen(true);
  }, [isRunning]);

  if (logs.length === 0 && !isRunning) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg">
      {/* Header toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isRunning ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
            }`}
          />
          <span className="text-xs font-mono font-semibold text-slate-200 tracking-wide">
            EXECUTION LOGS
          </span>
          {logs.length > 0 && (
            <span className="text-xs font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
              {logs.length}
            </span>
          )}
          {isRunning && (
            <span className="text-xs text-emerald-400 font-mono animate-pulse">running</span>
          )}
        </div>
        <span className="text-slate-500 text-xs">{open ? "▲ hide" : "▼ show"}</span>
      </button>

      {/* Log body */}
      {open && (
        <div className="bg-slate-950 max-h-72 overflow-y-auto p-4 space-y-0.5">
          {isRunning && logs.length === 0 && (
            <p className="text-xs font-mono text-slate-600 animate-pulse">
              › waiting for first agent…
            </p>
          )}
          {logs.map((log, i) => (
            <div key={i} className={`flex gap-3 text-xs font-mono leading-relaxed ${lineColor(log)}`}>
              <span className="text-slate-700 select-none w-5 text-right flex-shrink-0">
                {i + 1}
              </span>
              <span className="break-all">{highlight(log)}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
