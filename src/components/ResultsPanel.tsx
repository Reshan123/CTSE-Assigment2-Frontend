import type { RunResult } from "../types";
import StudyPlan from "./StudyPlan";
import PdfViewer from "./PdfViewer";

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

      {result.study_plan_pdf_path && (
        <PdfViewer path={result.study_plan_pdf_path} />
      )}
    </div>
  );
}
