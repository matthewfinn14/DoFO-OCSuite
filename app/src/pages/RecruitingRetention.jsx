import { Link } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';

export default function RecruitingRetention() {
  const { settings } = useSchool();
  const isLight = settings?.theme === 'light';

  return (
    <div className={`flex items-center justify-center h-full ${isLight ? 'bg-gray-50' : 'bg-slate-950'}`}>
      <div className="text-center max-w-md">
        <UserPlus size={64} className="text-sky-400 mx-auto mb-4" />
        <h1 className={`text-2xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
          Recruiting / Retention Plan
        </h1>
        <p className={`mb-6 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
          Plan your recruiting efforts and player retention strategies for the upcoming season.
          Coming soon!
        </p>
        <Link
          to="/dashboard"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
            isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
