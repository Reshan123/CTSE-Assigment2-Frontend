import type { HistoryEntry } from "../hooks/useRunHistory";
import type { RunResult } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onRestore: (result: RunResult, quizJson: object) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

function timeAgo(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function exportEntry(entry: HistoryEntry) {
  const blob = new Blob([JSON.stringify(entry, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `edumas_run_${entry.result.weak_topic.replace(/\s+/g, "_")}_${entry.id.slice(0, 8)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RunHistoryDrawer({
  open, onClose, history, onRestore, onRemove, onClear,
}: Props) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Run History</h2>
            <p className="text-xs text-slate-500 mt-0.5">{history.length} saved run{history.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => { if (confirm("Clear all run history?")) onClear(); }}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500 text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Entry list */}
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="text-3xl mb-3">🗂</p>
              <p className="text-sm font-medium">No runs yet</p>
              <p className="text-xs mt-1">Completed runs are saved automatically</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {history.map((entry) => (
                <li key={entry.id} className="p-4 hover:bg-slate-50 group">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      className="flex-1 text-left"
                      onClick={() => { onRestore(entry.result, entry.quizJson); onClose(); }}
                    >
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                        {entry.result.weak_topic || "Unknown topic"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{timeAgo(entry.timestamp)}</p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {entry.result.knowledge_brief.split("\n").filter(Boolean)[0]?.replace(/^[-•]\s*/, "") ?? ""}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {entry.result.practice_questions.length} questions
                        </span>
                        {entry.result.study_plan_pdf_path && (
                          <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                            PDF
                          </span>
                        )}
                      </div>
                    </button>

                    <div className="flex flex-col gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => exportEntry(entry)}
                        title="Export as JSON"
                        className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 border border-slate-200 rounded"
                      >
                        Export
                      </button>
                      <button
                        onClick={() => onRemove(entry.id)}
                        title="Delete"
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 border border-red-100 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
