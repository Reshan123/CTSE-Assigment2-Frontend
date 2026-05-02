export default function Header() {
  return (
    <header className="bg-[#1e3a8a] text-white shadow-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-lg font-bold">
            E
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">EduMAS</h1>
            <p className="text-xs text-blue-200 leading-none mt-0.5">
              Multi-Agent AI Study Planner
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-blue-200">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
          Powered by Ollama · LangGraph
        </div>
      </div>
    </header>
  );
}
