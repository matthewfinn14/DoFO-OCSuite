import { useParams, Link } from 'react-router-dom';
import { Users, ArrowLeft } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';

export default function SubLevelDepth() {
  const { levelId } = useParams();
  const { programLevels } = useSchool();

  const level = programLevels.find(l => l.id === levelId);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <Users size={64} className="text-amber-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">
          {level?.name || 'Sub-Level'} Depth Chart
        </h1>
        <p className="text-slate-400 mb-6">
          Manage the depth chart for this program level.
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
