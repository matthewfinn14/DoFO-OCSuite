import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  onAuthStateChanged,
  signInWithGoogle,
  signInWithEmail,
  logout as authLogout,
  isSiteAdmin,
  getAccessRequest,
  getUserProfile,
  findUserSchool,
  getSchool,
  getInvite,
  updateUserProfile,
  addSchoolMembership
} from '../services/auth';

// Auth States - Clean state machine
export const AUTH_STATES = {
  LOADING: 'loading',
  UNAUTHENTICATED: 'unauthenticated',
  PENDING_REQUEST: 'pending_request',      // User needs to submit access request
  AWAITING_APPROVAL: 'awaiting_approval',  // Access request submitted, waiting
  NEEDS_SCHOOL: 'needs_school_setup',      // Approved but no school set up
  READY: 'ready'                           // Fully authenticated with school
};

const AuthContext = createContext(null);

// Check if running in local dev mode
const isLocalDev = () => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || window.location.protocol === 'file:';
};

// Mock data for local development bypass
const DEV_USER = {
  uid: 'dev-user-123',
  email: 'dev@localhost.local',
  displayName: 'Dev User'
};

const DEV_PROFILE = {
  email: 'dev@localhost.local',
  activeSchoolId: 'dev-school-123',
  roles: ['Head Coach', 'Team Admin']
};

const DEV_SCHOOL = {
  id: 'dev-school-123',
  name: 'Development High School',
  mascot: 'Developers'
};

export function AuthProvider({ children }) {
  // Core state
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentSchool, setCurrentSchool] = useState(null);
  const [accessRequest, setAccessRequest] = useState(null);
  const [error, setError] = useState(null);
  const [devMode, setDevMode] = useState(false);

  /**
   * Determine auth state based on user data
   * This is the core state machine logic
   */
  const determineAuthState = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      setUser(null);
      setUserProfile(null);
      setCurrentSchool(null);
      setAccessRequest(null);
      return;
    }

    setUser(firebaseUser);
    const email = firebaseUser.email?.toLowerCase();

    try {
      // Site admins always get through
      if (isSiteAdmin(email)) {
        // Check if admin has a school selected
        const profile = await getUserProfile(firebaseUser.uid);
        setUserProfile(profile);

        if (profile?.activeSchoolId) {
          const school = await getSchool(profile.activeSchoolId);
          if (school) {
            setCurrentSchool(school);
            setAuthState(AUTH_STATES.READY);
            return;
          }
        }

        // Admin without school - needs setup
        setAuthState(AUTH_STATES.NEEDS_SCHOOL);
        return;
      }

      // Check for existing access request
      const request = await getAccessRequest(email);
      setAccessRequest(request);

      if (request) {
        if (request.status === 'approved') {
          // Request approved - check for school membership
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);

          if (profile?.activeSchoolId) {
            const school = await getSchool(profile.activeSchoolId);
            if (school) {
              setCurrentSchool(school);
              setAuthState(AUTH_STATES.READY);
              return;
            }
          }

          // Check if user is in any school's staff/memberList
          const existingSchool = await findUserSchool(email);
          if (existingSchool) {
            // Auto-add membership and set as active
            await addSchoolMembership(firebaseUser.uid, existingSchool.id, 'member');
            await updateUserProfile(firebaseUser.uid, {
              email: email,
              activeSchoolId: existingSchool.id,
              updatedAt: new Date().toISOString()
            });
            setCurrentSchool(existingSchool);
            setUserProfile({ ...profile, activeSchoolId: existingSchool.id });
            setAuthState(AUTH_STATES.READY);
            return;
          }

          // Approved but no school - needs setup
          setAuthState(AUTH_STATES.NEEDS_SCHOOL);
          return;
        }

        if (request.status === 'pending') {
          setAuthState(AUTH_STATES.AWAITING_APPROVAL);
          return;
        }

        if (request.status === 'denied') {
          // Treat denied as needing new request
          setAuthState(AUTH_STATES.PENDING_REQUEST);
          return;
        }
      }

      // Check for invite
      const invite = await getInvite(email);
      if (invite && invite.schoolId) {
        // Auto-accept invite
        await addSchoolMembership(firebaseUser.uid, invite.schoolId, invite.role || 'member');
        await updateUserProfile(firebaseUser.uid, {
          email: email,
          activeSchoolId: invite.schoolId,
          updatedAt: new Date().toISOString()
        });
        const school = await getSchool(invite.schoolId);
        if (school) {
          setCurrentSchool(school);
          setUserProfile({ activeSchoolId: invite.schoolId });
          setAuthState(AUTH_STATES.READY);
          return;
        }
      }

      // Check if user is already in a school's staff/memberList
      const existingSchool = await findUserSchool(email);
      if (existingSchool) {
        await addSchoolMembership(firebaseUser.uid, existingSchool.id, 'member');
        await updateUserProfile(firebaseUser.uid, {
          email: email,
          activeSchoolId: existingSchool.id,
          updatedAt: new Date().toISOString()
        });
        setCurrentSchool(existingSchool);
        setUserProfile({ activeSchoolId: existingSchool.id });
        setAuthState(AUTH_STATES.READY);
        return;
      }

      // No access request, no invite, no existing membership - need to request
      setAuthState(AUTH_STATES.PENDING_REQUEST);

    } catch (err) {
      console.error('Error determining auth state:', err);
      setError(err.message);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
    }
  }, []);

  // Check for dev mode bypass on mount
  useEffect(() => {
    // Check URL params for ?dev=true or ?bypass=true
    const urlParams = new URLSearchParams(window.location.search);
    const devParam = urlParams.get('dev') === 'true' || urlParams.get('bypass') === 'true';

    if (isLocalDev() && devParam) {
      console.log('🔧 DEV MODE: Bypassing authentication');
      setDevMode(true);
      setUser(DEV_USER);
      setUserProfile(DEV_PROFILE);
      setCurrentSchool(DEV_SCHOOL);
      setAuthState(AUTH_STATES.READY);
    }
  }, []);

  // Listen to Firebase auth state (skip if dev mode)
  useEffect(() => {
    if (devMode) return;

    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      determineAuthState(firebaseUser);
    });

    return () => unsubscribe();
  }, [determineAuthState, devMode]);

  /**
   * Login with Google
   */
  const loginWithGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      // Auth state change listener will handle the rest
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Login with email/password
   */
  const login = async (email, password) => {
    setError(null);
    try {
      await signInWithEmail(email, password);
      // Auth state change listener will handle the rest
    } catch (err) {
      console.error('Email login error:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    setError(null);
    try {
      // Clear localStorage cache
      localStorage.removeItem('dofo_school_cache');
      localStorage.removeItem('dofo_user_cache');

      await authLogout();
      // Auth state change listener will handle reset
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Refresh auth state (useful after access request approval or school setup)
   */
  const refreshAuthState = () => {
    if (user) {
      determineAuthState(user);
    }
  };

  /**
   * Set active school (for users with multiple schools)
   */
  const setActiveSchool = async (schoolId) => {
    if (!user) return;

    try {
      const school = await getSchool(schoolId);
      if (school) {
        await updateUserProfile(user.uid, {
          activeSchoolId: schoolId,
          updatedAt: new Date().toISOString()
        });
        setCurrentSchool(school);
        setUserProfile(prev => ({ ...prev, activeSchoolId: schoolId }));
      }
    } catch (err) {
      console.error('Error setting active school:', err);
      setError(err.message);
    }
  };

  // Default permissions structure
  const DEFAULT_PERMISSIONS = {
    dashboard: { view: true },
    playbook: { view: true, edit: false, create: false, delete: false },
    gamePlan: { view: true, edit: false },
    depthChart: { view: true, edit: false },
    practice: { view: true, edit: false },
    wristband: { view: true, edit: false },
    roster: { view: true, edit: false },
    staff: { view: true, edit: false },
    settings: { view: false, edit: false },
    admin: { view: false }
  };

  // Role-based permissions
  const ROLE_PERMISSIONS = {
    'Head Coach': {
      dashboard: { view: true },
      playbook: { view: true, edit: true, create: true, delete: true },
      gamePlan: { view: true, edit: true },
      depthChart: { view: true, edit: true },
      practice: { view: true, edit: true },
      wristband: { view: true, edit: true },
      roster: { view: true, edit: true },
      staff: { view: true, edit: true },
      settings: { view: true, edit: true },
      admin: { view: false }
    },
    'Team Admin': {
      dashboard: { view: true },
      playbook: { view: true, edit: true, create: true, delete: true },
      gamePlan: { view: true, edit: true },
      depthChart: { view: true, edit: true },
      practice: { view: true, edit: true },
      wristband: { view: true, edit: true },
      roster: { view: true, edit: true },
      staff: { view: true, edit: true },
      settings: { view: true, edit: true },
      admin: { view: false }
    },
    'Offensive Coordinator': {
      dashboard: { view: true },
      playbook: { view: true, edit: true, create: true, delete: false },
      gamePlan: { view: true, edit: true },
      depthChart: { view: true, edit: true },
      practice: { view: true, edit: true },
      wristband: { view: true, edit: true },
      roster: { view: true, edit: false },
      staff: { view: true, edit: false },
      settings: { view: false, edit: false },
      admin: { view: false }
    },
    'Position Coach': {
      dashboard: { view: true },
      playbook: { view: true, edit: false, create: false, delete: false },
      gamePlan: { view: true, edit: false },
      depthChart: { view: true, edit: true },
      practice: { view: true, edit: true },
      wristband: { view: true, edit: false },
      roster: { view: true, edit: false },
      staff: { view: true, edit: false },
      settings: { view: false, edit: false },
      admin: { view: false }
    }
  };

  // Compute current user permissions based on roles
  const currentPermissions = useMemo(() => {
    const roles = userProfile?.roles || [];

    // Start with default permissions
    let permissions = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));

    // Merge in role-based permissions (most permissive wins)
    roles.forEach(role => {
      const rolePerms = ROLE_PERMISSIONS[role];
      if (rolePerms) {
        Object.keys(rolePerms).forEach(section => {
          Object.keys(rolePerms[section]).forEach(action => {
            if (rolePerms[section][action]) {
              permissions[section][action] = true;
            }
          });
        });
      }
    });

    // Site admins get full access
    if (user?.email && isSiteAdmin(user.email)) {
      Object.keys(permissions).forEach(section => {
        Object.keys(permissions[section]).forEach(action => {
          permissions[section][action] = true;
        });
      });
      permissions.admin.view = true;
    }

    return permissions;
  }, [userProfile?.roles, user?.email]);

  // Helper booleans for common permission checks
  const isHeadCoach = userProfile?.roles?.includes('Head Coach') || false;
  const isTeamAdmin = userProfile?.roles?.includes('Team Admin') || false;

  const value = {
    // State
    authState,
    user,
    userProfile,
    currentSchool,
    accessRequest,
    error,
    devMode,

    // Computed
    isAuthenticated: authState === AUTH_STATES.READY,
    isLoading: authState === AUTH_STATES.LOADING,
    isSiteAdmin: devMode || (user?.email ? isSiteAdmin(user.email) : false),
    currentPermissions,
    isHeadCoach: devMode || isHeadCoach,
    isTeamAdmin: devMode || isTeamAdmin,

    // Actions
    login,
    loginWithGoogle,
    logout,
    refreshAuthState,
    setActiveSchool,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
