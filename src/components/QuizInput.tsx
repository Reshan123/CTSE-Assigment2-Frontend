import { useState } from "react";

const SAMPLE = JSON.stringify(
  {
    subject: "Mathematics",
    questions: [
      { question: "What is the derivative of x²?", student_answer: "2x", correct_answer: "2x", score: 1 },
      { question: "What is ∫2x dx?", student_answer: "x", correct_answer: "x² + C", score: 0 },
      { question: "What is the limit of sin(x)/x as x→0?", student_answer: "0", correct_answer: "1", score: 0 },
      { question: "What is the chain rule?", student_answer: "d/dx[f(g(x))] = f'(x)·g'(x)", correct_answer: "d/dx[f(g(x))] = f'(g(x))·g'(x)", score: 0 },
      { question: "What is e^0?", student_answer: "1", correct_answer: "1", score: 1 },
    ],
  },
  null,
  2
);

interface Props {
  onRun: (json: object) => void;
  loading: boolean;
}

export default function QuizInput({ onRun, loading }: Props) {
  const [raw, setRaw] = useState(SAMPLE);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRaw((ev.target?.result as string) ?? "");
    reader.readAsText(file);
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Quiz Input</h2>
        <label className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 font-medium">
          Upload JSON
          <input type="file" accept=".json" className="hidden" onChange={handleFile} />
        </label>
      </div>

      <textarea
        className="w-full h-72 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        spellCheck={false}
        placeholder="Paste quiz JSON here…"
      />

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-[#1e3a8a] hover:bg-[#1e3070] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          {loading ? "Running pipeline…" : "Run EduMAS Pipeline"}
        </button>
        <button
          onClick={() => setRaw(SAMPLE)}
          disabled={loading}
          className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2.5 border border-slate-200 rounded-lg"
        >
          Load sample
        </button>
      </div>

      <p className="text-xs text-slate-400">
        JSON must contain a <code className="bg-slate-100 px-1 rounded">questions</code> array with{" "}
        <code className="bg-slate-100 px-1 rounded">student_answer</code>,{" "}
        <code className="bg-slate-100 px-1 rounded">correct_answer</code>, and{" "}
        <code className="bg-slate-100 px-1 rounded">score</code> fields.
      </p>
    </div>
  );
}
