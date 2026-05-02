import { useState } from "react";
import { SAMPLES } from "../data/samples";

const DEFAULT_RAW = JSON.stringify(SAMPLES[0].data, null, 2);

interface Props {
  onRun: (json: object) => void;
  loading: boolean;
}

const EDGE_CASE_LABELS = new Set(["All Correct — Ivan", "All Wrong — Jane", "Single Topic — Hannah", "Tie Breaker — Kevin"]);

export default function QuizInput({ onRun, loading }: Props) {
  const [raw, setRaw] = useState(DEFAULT_RAW);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleSampleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const idx = parseInt(e.target.value, 10);
    setSelectedIdx(idx);
    setRaw(JSON.stringify(SAMPLES[idx].data, null, 2));
    setError(null);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRaw((ev.target?.result as string) ?? "");
      setSelectedIdx(-1);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleSubmit() {
    setError(null);
    try {
      const parsed = JSON.parse(raw);
      onRun(parsed);
    } catch {
      setError("Invalid JSON — please fix the input before running.");
    }
  }

  const selected = selectedIdx >= 0 ? SAMPLES[selectedIdx] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Quiz Input</h2>
        <label className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 font-medium">
          Upload JSON
          <input type="file" accept=".json" className="hidden" onChange={handleFile} />
        </label>
      </div>

      {/* Sample selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-500">Load a sample dataset</label>
        <select
          value={selectedIdx}
          onChange={handleSampleChange}
          disabled={loading}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        >
          {SAMPLES.map((s, i) => (
            <option key={i} value={i}>
              {EDGE_CASE_LABELS.has(s.label) ? `⚠ ${s.label}` : s.label}
            </option>
          ))}
          {selectedIdx === -1 && <option value={-1}>Custom (uploaded file)</option>}
        </select>
        {selected && (
          <p className="text-xs text-slate-400 pl-1">{selected.description}</p>
        )}
      </div>

      <textarea
        className="w-full h-64 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={raw}
        onChange={(e) => { setRaw(e.target.value); setSelectedIdx(-1); }}
        spellCheck={false}
        placeholder="Paste quiz JSON here…"
      />

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-[#1e3a8a] hover:bg-[#1e3070] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
      >
        {loading ? "Running pipeline…" : "Run EduMAS Pipeline"}
      </button>

      <p className="text-xs text-slate-400">
        JSON must contain an <code className="bg-slate-100 px-1 rounded">answers</code> array with{" "}
        <code className="bg-slate-100 px-1 rounded">topic</code> and{" "}
        <code className="bg-slate-100 px-1 rounded">correct</code> fields, plus a{" "}
        <code className="bg-slate-100 px-1 rounded">student</code> name.
      </p>
    </div>
  );
}
