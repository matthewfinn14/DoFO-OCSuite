import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

// Site admins with full access
export const SITE_ADMINS = ['matthewfinn14@gmail.com', 'admin@digitaldofo.com'];

/**
 * Sign in with email and password
 */
export const signInWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

/**
 * Create account with email and password
 */
export const createAccount = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

/**
 * Sign out
 */
export const logout = () => {
  return signOut(auth);
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChanged = (callback) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

/**
 * Check if user is a site admin
 */
export const isSiteAdmin = (email) => {
  return email && SITE_ADMINS.includes(email.toLowerCase());
};

/**
 * Get user's access request status
 */
export const getAccessRequest = async (email) => {
  const normalizedEmail = email.toLowerCase().replace(/\./g, '_');
  const requestRef = doc(db, 'access_requests', normalizedEmail);
  const requestDoc = await getDoc(requestRef);

  if (requestDoc.exists()) {
    return { id: requestDoc.id, ...requestDoc.data() };
  }
  return null;
};

/**
 * Submit access request
 */
export const submitAccessRequest = async (data) => {
  const normalizedEmail = data.email.toLowerCase().replace(/\./g, '_');
  const requestRef = doc(db, 'access_requests', normalizedEmail);

  await setDoc(requestRef, {
    ...data,
    email: data.email.toLowerCase(),
    status: 'pending',
    requestedAt: new Date().toISOString(),
  });
};

/**
 * Get user profile and memberships
 */
export const getUserProfile = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return null;
  }

  const userData = userDoc.data();

  // Get memberships
  const membershipsRef = collection(db, 'users', userId, 'memberships');
  const membershipsSnapshot = await getDocs(membershipsRef);
  const memberships = {};

  membershipsSnapshot.forEach((doc) => {
    memberships[doc.id] = doc.data();
  });

  return {
    ...userData,
    memberships
  };
};

/**
 * Create or update user profile
 */
export const updateUserProfile = async (userId, data) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, data, { merge: true });
};

/**
 * Add school membership for user
 */
export const addSchoolMembership = async (userId, schoolId, role = 'member') => {
  const membershipRef = doc(db, 'users', userId, 'memberships', schoolId);
  await setDoc(membershipRef, {
    role,
    joinedAt: new Date().toISOString(),
    status: 'active'
  });
};

/**
 * Ensure membership document exists for user (repair if missing)
 */
export const ensureMembership = async (userId, schoolId, role = 'member') => {
  const membershipRef = doc(db, 'users', userId, 'memberships', schoolId);
  const membershipDoc = await getDoc(membershipRef);

  if (!membershipDoc.exists()) {
    console.log(`Creating missing membership for user ${userId} in school ${schoolId}`);
    await setDoc(membershipRef, {
      role,
      joinedAt: new Date().toISOString(),
      status: 'active',
      repairedAt: new Date().toISOString()
    });
    return true; // Created new membership
  }
  return false; // Membership already exists
};

/**
 * Get school by ID
 */
export const getSchool = async (schoolId) => {
  const schoolRef = doc(db, 'schools', schoolId);
  const schoolDoc = await getDoc(schoolRef);

  if (schoolDoc.exists()) {
    return { id: schoolDoc.id, ...schoolDoc.data() };
  }
  return null;
};

/**
 * Check if user has access to any school (via staff list or memberList)
 */
export const findUserSchool = async (email) => {
  const normalizedEmail = email.toLowerCase();

  // Check all schools for membership
  const schoolsRef = collection(db, 'schools');
  const schoolsSnapshot = await getDocs(schoolsRef);

  for (const schoolDoc of schoolsSnapshot.docs) {
    const schoolData = schoolDoc.data();
    const memberList = schoolData.memberList || [];
    const staff = schoolData.staff || [];

    // Check memberList
    const inMemberList = memberList.some(m =>
      (typeof m === 'string' ? m : m.email)?.toLowerCase() === normalizedEmail
    );

    // Check staff array
    const inStaff = staff.some(s =>
      s.email?.toLowerCase() === normalizedEmail
    );

    if (inMemberList || inStaff) {
      return { id: schoolDoc.id, ...schoolData };
    }
  }

  return null;
};

/**
 * Check invite status
 */
export const getInvite = async (email) => {
  const normalizedEmail = email.toLowerCase();
  const inviteRef = doc(db, 'invites', normalizedEmail);
  const inviteDoc = await getDoc(inviteRef);

  if (inviteDoc.exists()) {
    return { id: inviteDoc.id, ...inviteDoc.data() };
  }
  return null;
};
