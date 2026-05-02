import type { RunResult } from "../types";
import StudyPlan from "./StudyPlan";

interface Props {
  result: RunResult;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function ResultsPanel({ result }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#1e3a8a] text-white rounded-xl px-5 py-4">
        <p className="text-xs font-medium text-blue-200 uppercase tracking-wider">Weak Topic Identified</p>
        <p className="text-2xl font-bold mt-1">{result.weak_topic}</p>
      </div>

      <Section title="Knowledge Brief">
        <ul className="space-y-1">
          {result.knowledge_brief
            .split("\n")
            .filter((l) => l.trim())
            .map((line, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{line.replace(/^[-•]\s*/, "")}</span>
              </li>
            ))}
        </ul>
      </Section>

      <Section title={`Practice Questions (${result.practice_questions.length})`}>
        <div className="space-y-3">
          {result.practice_questions.map((q, i) => (
            <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <p className="text-sm font-medium text-slate-800">
                Q{i + 1}. {q.question}
              </p>
              <p className="text-xs text-green-700 mt-1 pl-4">
                <span className="font-semibold">A:</span> {q.answer}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="7-Day Study Plan">
        <StudyPlan plan={result.study_plan} />
      </Section>

      <Section title="Output Files">
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center gap-2 bg-slate-50 rounded px-3 py-2 border border-slate-100">
            <span className="text-slate-400">MD</span>
            <span className="text-slate-700 truncate">{result.study_plan_path}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded px-3 py-2 border border-slate-100">
            <span className="text-slate-400">PDF</span>
            <span className="text-slate-700 truncate">{result.study_plan_pdf_path}</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Files are saved on the server running the Python pipeline.
        </p>
      </Section>

      {result.logs.length > 0 && (
        <details className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <summary className="text-sm font-semibold text-slate-500 uppercase tracking-wider cursor-pointer">
            Execution Logs
          </summary>
          <div className="mt-3 space-y-1">
            {result.logs.map((log, i) => (
              <p key={i} className="text-xs font-mono text-slate-500 bg-slate-50 rounded px-2 py-1">
                {log}
              </p>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
