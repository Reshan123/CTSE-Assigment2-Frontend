export interface PracticeQuestion {
  question: string;
  answer: string;
}

export interface RunResult {
  weak_topic: string;
  knowledge_brief: string;
  practice_questions: PracticeQuestion[];
  study_plan: string;
  study_plan_path: string;
  study_plan_pdf_path: string;
  logs: string[];
}

export type AgentId = "assessment" | "gap_analyst" | "question_generator" | "study_planner";
export type AgentStatus = "pending" | "running" | "done" | "error";

export interface AgentInfo {
  id: AgentId;
  label: string;
  description: string;
}

export const AGENTS: AgentInfo[] = [
  { id: "assessment", label: "Assessment", description: "Identifies weak topic" },
  { id: "gap_analyst", label: "Gap Analyst", description: "Builds knowledge brief" },
  { id: "question_generator", label: "Question Generator", description: "Creates practice Q&A" },
  { id: "study_planner", label: "Study Planner", description: "Writes 7-day plan" },
];
