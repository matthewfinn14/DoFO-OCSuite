import { useLocation, Link } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';

export default function ComingSoon() {
  const location = useLocation();

  // Get the page name from the route
  const pageName = location.pathname.split('/').filter(Boolean).pop() || 'This page';
  const displayName = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ');

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <Construction size={64} className="text-amber-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">{displayName}</h1>
        <p className="text-slate-400 mb-6">
          This feature is being ported to the new architecture.
          Check back soon!
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
