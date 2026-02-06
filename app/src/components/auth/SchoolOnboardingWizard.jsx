import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, query, where, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { addSchoolMembership, updateUserProfile, isSiteAdmin } from '../../services/auth';

export default function SchoolOnboardingWizard() {
  const { user, accessRequest, refreshAuthState } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Site Admin check
  const isAdmin = isSiteAdmin(user?.email);
  const [adminMode, setAdminMode] = useState(null); // null, 'select', 'create'
  const [allSchools, setAllSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');

  // Join with code
  const [userMode, setUserMode] = useState(null); // null, 'create', 'join'
  const [joinCode, setJoinCode] = useState('');

  // Form data - Pre-populate from access request if available
  const [schoolName, setSchoolName] = useState(accessRequest?.schoolName || '');
  const [mascot, setMascot] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');

  // Default positions
  const offensePositions = [
    { name: 'QB', type: 'QB' },
    { name: 'RB', type: 'RB' },
    { name: 'WR', type: 'WR' },
    { name: 'TE', type: 'TE' },
    { name: 'LT', type: 'OL' },
    { name: 'LG', type: 'OL' },
    { name: 'C', type: 'OL' },
    { name: 'RG', type: 'OL' },
    { name: 'RT', type: 'OL' }
  ];

  const defensePositions = [
    { name: 'DL', type: 'DL' },
    { name: 'LB', type: 'LB' },
    { name: 'DB', type: 'DB' },
    { name: 'S', type: 'DB' }
  ];

  // Load all schools for site admin
  useEffect(() => {
    if (isAdmin) {
      const loadSchools = async () => {
        const schoolsSnapshot = await getDocs(collection(db, 'schools'));
        const schools = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllSchools(schools);
      };
      loadSchools();
    }
  }, [isAdmin]);

  // Handle joining with a code
  const handleJoinWithCode = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-character join code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Find school with this join code
      const schoolsQuery = query(collection(db, 'schools'), where('joinCode', '==', code));
      const snapshot = await getDocs(schoolsQuery);

      if (snapshot.empty) {
        setError('Invalid join code. Please check and try again.');
        setLoading(false);
        return;
      }

      const schoolDoc = snapshot.docs[0];
      const schoolId = schoolDoc.id;
      const schoolData = schoolDoc.data();

      // Add user to school's member list
      await updateDoc(doc(db, 'schools', schoolId), {
        memberList: arrayUnion(user.email.toLowerCase()),
        staff: arrayUnion({
          email: user.email.toLowerCase(),
          name: user.displayName || '',
          role: 'Coach',
          roles: ['Coach'],
          permissionLevel: 'coach',
          isSchoolAdmin: false,
          joinedAt: new Date().toISOString(),
          joinedViaCode: true
        })
      });

      // Update user profile
      await updateUserProfile(user.uid, {
        email: user.email,
        activeSchoolId: schoolId,
        role: 'Coach',
        updatedAt: new Date().toISOString()
      });

      // Create membership
      await addSchoolMembership(user.uid, schoolId, 'Coach');

      console.log('Joined school:', schoolData.name);
      refreshAuthState();
    } catch (err) {
      console.error('Error joining school:', err);
      setError('Failed to join school: ' + err.message);
    }
    setLoading(false);
  };

  // Handle site admin selecting existing school
  const handleSelectSchool = async () => {
    if (!selectedSchoolId) {
      setError('Please select a school');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Create/update user document with selected school
      await updateUserProfile(user.uid, {
        email: user.email,
        activeSchoolId: selectedSchoolId,
        role: 'Site Admin',
        updatedAt: new Date().toISOString()
      });

      // Create membership
      await addSchoolMembership(user.uid, selectedSchoolId, 'Site Admin');

      // Refresh auth state to move to main app
      refreshAuthState();
    } catch (err) {
      setError('Failed to select school: ' + err.message);
    }
    setLoading(false);
  };

  // Handle creating new school
  const handleSave = async () => {
    if (!schoolName || !mascot || !zipCode) {
      setError('Please fill in all fields (School Name, Mascot, Zip Code).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create School Document
      const schoolData = {
        name: schoolName,
        mascot: mascot,
        zipCode: zipCode,
        colors: { primary: primaryColor, secondary: secondaryColor },
        settings: {
          schoolName: schoolName,
          mascot: mascot,
          zipCode: zipCode,
          accentColor: primaryColor,
          offensePositions: offensePositions,
          defensePositions: defensePositions,
          activeYear: new Date().getFullYear().toString(),
          theme: 'light',
          initialized: true,
          createdAt: new Date().toISOString(),
          createdBy: user.uid
        },
        linkedAccessRequest: user.email.toLowerCase(),
        schoolAdminEmail: user.email.toLowerCase(),
        roster: [],
        plays: {},
        staff: [{
          email: user.email,
          role: 'Head Coach',
          name: user.displayName || 'Coach',
          uid: user.uid,
          permissions: ['ADMIN'],
          isSchoolAdmin: true
        }],
        memberList: [user.email.toLowerCase()],
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      };

      const schoolRef = await addDoc(collection(db, 'schools'), schoolData);
      const schoolId = schoolRef.id;

      // Update User Profile with School ID
      await updateUserProfile(user.uid, {
        email: user.email,
        activeSchoolId: schoolId,
        role: 'Head Coach',
        updatedAt: new Date().toISOString()
      });

      // Create membership
      await addSchoolMembership(user.uid, schoolId, 'Head Coach');

      // Link access request to school (if exists)
      try {
        const normalizedEmail = user.email.toLowerCase().replace(/\./g, '_');
        const requestRef = doc(db, 'access_requests', normalizedEmail);
        await setDoc(requestRef, {
          schoolId: schoolId,
          schoolCreatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (linkErr) {
        console.warn("Could not link access request:", linkErr);
      }

      console.log("School Created:", schoolId);

      // Refresh auth state to move to main app
      refreshAuthState();

    } catch (err) {
      console.error("Error creating school:", err);
      setError("Failed to create school: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="bg-slate-800 p-8 rounded-xl w-full max-w-lg shadow-2xl">
        <h1 className="text-2xl font-bold mb-2 text-center text-sky-400">
          Welcome to DoFO!
        </h1>
        <p className="text-center text-slate-400 mb-8">
          Let's get your team set up in seconds.
        </p>

        {error && (
          <div className="bg-red-900/50 text-red-300 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Site Admin: Choose Mode */}
        {isAdmin && !adminMode && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900 p-4 rounded-lg border border-emerald-500">
              <p className="text-emerald-400 font-bold mb-1">Site Admin Detected</p>
              <p className="text-slate-400 text-sm">You can select an existing school or create a new one.</p>
            </div>
            <button
              onClick={() => setAdminMode('select')}
              className="w-full p-4 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600"
            >
              Select Existing School ({allSchools.length} available)
            </button>
            <button
              onClick={() => setAdminMode('create')}
              className="w-full p-4 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-500"
            >
              Create New School
            </button>
          </div>
        )}

        {/* Site Admin: Select School */}
        {isAdmin && adminMode === 'select' && (
          <div>
            <button
              onClick={() => setAdminMode(null)}
              className="text-slate-400 hover:text-slate-300 mb-4"
            >
              &larr; Back
            </button>
            <label htmlFor="onboarding-school-select" className="block mb-2 text-slate-300">Select School</label>
            <select
              id="onboarding-school-select"
              value={selectedSchoolId}
              onChange={e => setSelectedSchoolId(e.target.value)}
              className="w-full p-3 rounded-md bg-slate-900 border border-slate-600 text-white mb-4"
            >
              <option value="">-- Choose a school --</option>
              {allSchools.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id} {s.joinCode ? `(${s.joinCode})` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={handleSelectSchool}
              disabled={loading || !selectedSchoolId}
              className="w-full p-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connecting...' : 'Connect to School'}
            </button>
          </div>
        )}

        {/* Regular User: Choose Mode */}
        {!isAdmin && !userMode && (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setUserMode('join')}
              className="w-full p-4 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600"
            >
              Join with Code
            </button>
            <p className="text-center text-slate-500 text-sm">Have a join code from your head coach?</p>
            <div className="border-t border-slate-700 my-2"></div>
            <button
              onClick={() => setUserMode('create')}
              className="w-full p-4 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-500"
            >
              Create New School
            </button>
            <p className="text-center text-slate-500 text-sm">Setting up a new program?</p>
          </div>
        )}

        {/* Join with Code Form */}
        {!isAdmin && userMode === 'join' && (
          <div>
            <button
              onClick={() => { setUserMode(null); setJoinCode(''); setError(''); }}
              className="text-slate-400 hover:text-slate-300 mb-4"
            >
              &larr; Back
            </button>
            <div className="mb-6">
              <label htmlFor="join-code-input" className="block mb-2 text-slate-300">Enter Join Code</label>
              <input
                id="join-code-input"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                className="w-full p-4 rounded-md bg-slate-900 border border-slate-600 text-white text-center text-2xl font-mono tracking-widest uppercase placeholder-slate-600"
                placeholder="ABC123"
                maxLength={6}
              />
              <p className="text-slate-500 text-sm mt-2 text-center">
                Get this code from your school's admin or head coach
              </p>
            </div>
            <button
              onClick={handleJoinWithCode}
              disabled={loading || joinCode.length !== 6}
              className="w-full p-4 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join School'}
            </button>
          </div>
        )}

        {/* Create School Form */}
        {((!isAdmin && userMode === 'create') || (isAdmin && adminMode === 'create')) && (
          <div>
            {isAdmin && (
              <button
                onClick={() => setAdminMode(null)}
                className="text-slate-400 hover:text-slate-300 mb-4"
              >
                &larr; Back
              </button>
            )}
            {!isAdmin && (
              <button
                onClick={() => { setUserMode(null); setError(''); }}
                className="text-slate-400 hover:text-slate-300 mb-4"
              >
                &larr; Back
              </button>
            )}

            <div className="mb-4">
              <label htmlFor="onboarding-school-name" className="block mb-2 text-slate-300">School Name</label>
              <input
                id="onboarding-school-name"
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
                className="w-full p-3 rounded-md bg-slate-900 border border-slate-600 text-white placeholder-slate-500"
                placeholder="e.g. East Dillon Lions"
              />
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label htmlFor="onboarding-mascot" className="block mb-2 text-slate-300">Mascot</label>
                <input
                  id="onboarding-mascot"
                  value={mascot}
                  onChange={e => setMascot(e.target.value)}
                  className="w-full p-3 rounded-md bg-slate-900 border border-slate-600 text-white placeholder-slate-500"
                  placeholder="e.g. Lions"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="onboarding-zipcode" className="block mb-2 text-slate-300">Zip Code</label>
                <input
                  id="onboarding-zipcode"
                  value={zipCode}
                  onChange={e => setZipCode(e.target.value)}
                  className="w-full p-3 rounded-md bg-slate-900 border border-slate-600 text-white placeholder-slate-500"
                  placeholder="e.g. 90210"
                />
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <div className="flex-1">
                <label htmlFor="onboarding-primary-color" className="block mb-2 text-slate-300">School Colors</label>
                <div className="flex gap-2 items-center bg-slate-900 p-2 rounded-md border border-slate-600">
                  <input
                    id="onboarding-primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 cursor-pointer border-0 bg-transparent"
                  />
                  <label htmlFor="onboarding-primary-color" className="text-slate-400 text-sm">Primary</label>
                </div>
              </div>
              <div className="flex-1">
                <label htmlFor="onboarding-secondary-color" className="block mb-2 text-slate-300">&nbsp;</label>
                <div className="flex gap-2 items-center bg-slate-900 p-2 rounded-md border border-slate-600">
                  <input
                    id="onboarding-secondary-color"
                    type="color"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 cursor-pointer border-0 bg-transparent"
                  />
                  <label htmlFor="onboarding-secondary-color" className="text-slate-400 text-sm">Secondary</label>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full p-4 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating School...' : 'Complete Setup'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
