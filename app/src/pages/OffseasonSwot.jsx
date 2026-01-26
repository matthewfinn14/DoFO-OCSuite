import { Link } from 'react-router-dom';
import { Target, ArrowLeft } from 'lucide-react';

export default function OffseasonSwot() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <Target size={64} className="text-amber-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">SWOT Analysis</h1>
        <p className="text-slate-400 mb-6">
          Analyze your team's Strengths, Weaknesses, Opportunities, and Threats.
          Coming soon!
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
