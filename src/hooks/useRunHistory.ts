import { useState } from "react";
import type { RunResult } from "../types";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  quizJson: object;
  result: RunResult;
}

const KEY = "edumas_run_history";
const MAX = 20;

function load(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function persist(entries: HistoryEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
}

export function useRunHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(load);

  function add(quizJson: object, result: RunResult) {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      quizJson,
      result,
    };
    const updated = [entry, ...history];
    persist(updated);
    setHistory(updated);
    return entry;
  }

  function remove(id: string) {
    const updated = history.filter((e) => e.id !== id);
    persist(updated);
    setHistory(updated);
  }

  function clear() {
    persist([]);
    setHistory([]);
  }

  return { history, add, remove, clear };
}
