import { AGENTS, type AgentStatus, type AgentId } from "../types";

interface Props {
  statuses: Record<AgentId, AgentStatus>;
}

const statusStyles: Record<AgentStatus, string> = {
  pending: "bg-slate-100 text-slate-400 border-slate-200",
  running: "bg-blue-50 text-blue-700 border-blue-300 animate-pulse",
  done: "bg-green-50 text-green-700 border-green-300",
  error: "bg-red-50 text-red-700 border-red-300",
};

const statusIcon: Record<AgentStatus, string> = {
  pending: "○",
  running: "◌",
  done: "✓",
  error: "✗",
};

export default function PipelineStatus({ statuses }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {AGENTS.map((agent, idx) => (
        <div key={agent.id} className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${statusStyles[statuses[agent.id]]}`}
          >
            <span className="text-base leading-none">{statusIcon[statuses[agent.id]]}</span>
            <div>
              <div className="font-semibold">{agent.label}</div>
              <div className="opacity-70">{agent.description}</div>
            </div>
          </div>
          {idx < AGENTS.length - 1 && (
            <span className="text-slate-300 text-lg">→</span>
          )}
        </div>
      ))}
    </div>
  );
}
