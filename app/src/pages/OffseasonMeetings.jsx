import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';

export default function OffseasonMeetings() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <Calendar size={64} className="text-amber-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Meeting Schedule</h1>
        <p className="text-slate-400 mb-6">
          Plan and organize your offseason meeting schedule.
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
