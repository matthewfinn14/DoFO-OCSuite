import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, Building2 } from 'lucide-react';

export default function SchoolSwitcher() {
  const { user, currentSchool, setActiveSchool } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch user's school memberships
  useEffect(() => {
    async function fetchMemberships() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const membershipsRef = collection(db, 'users', user.uid, 'memberships');
        const snapshot = await getDocs(membershipsRef);
        const schools = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMemberships(schools);
      } catch (error) {
        console.error('Error fetching memberships:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMemberships();
  }, [user?.uid]);

  // Only show if user has 2+ schools
  if (loading || memberships.length < 2) {
    return null;
  }

  const handleSchoolChange = async (schoolId) => {
    if (schoolId !== currentSchool?.id) {
      await setActiveSchool(schoolId);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-slate-800/50 border border-slate-700 rounded-md text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 size={14} className="text-slate-400 flex-shrink-0" />
          <span className="truncate">{currentSchool?.name || 'Select School'}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-lg overflow-hidden">
            {memberships.map((membership) => (
              <button
                key={membership.id}
                onClick={() => handleSchoolChange(membership.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                  membership.id === currentSchool?.id
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <Building2 size={14} className="flex-shrink-0" />
                <span className="truncate">{membership.schoolName || membership.id}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
