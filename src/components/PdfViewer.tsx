import { useState } from "react";

interface Props {
  path: string;
}

export default function PdfViewer({ path }: Props) {
  const [failed, setFailed] = useState(false);
  const url = `/api/pdf?path=${encodeURIComponent(path)}`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-red-500 text-base">⬛</span>
          <h3 className="text-sm font-semibold text-slate-700">Study Plan PDF</h3>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={url}
            download
            className="text-xs font-medium text-white bg-[#1e3a8a] hover:bg-[#1e3070] px-3 py-1.5 rounded-lg transition-colors"
          >
            Download
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-slate-600 hover:text-slate-800 px-3 py-1.5 border border-slate-200 rounded-lg transition-colors"
          >
            Open tab
          </a>
        </div>
      </div>

      {failed ? (
        <div className="p-8 text-center text-slate-400">
          <p className="text-sm font-medium">Could not load PDF preview</p>
          <p className="text-xs mt-1">The server may not be running, or the file was moved.</p>
          <a
            href={url}
            download
            className="mt-4 inline-block text-xs text-blue-600 hover:underline"
          >
            Try downloading directly
          </a>
        </div>
      ) : (
        <iframe
          src={url}
          title="Study Plan PDF"
          className="w-full h-[640px] border-0"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
