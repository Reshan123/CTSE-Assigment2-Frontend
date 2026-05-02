import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  plan: string;
}

export default function StudyPlan({ plan }: Props) {
  return (
    <div className="prose-plan space-y-1">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan}</ReactMarkdown>
    </div>
  );
}
