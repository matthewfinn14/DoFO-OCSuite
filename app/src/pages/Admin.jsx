import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import {
  Shield,
  School,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Mail,
  Building,
  Calendar,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Plus,
  Edit2,
  X,
  Pause,
  Play,
  AlertTriangle,
  CalendarPlus,
  Copy
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getSubscriptionStatus, SUBSCRIPTION_STATUS, calculateTrialEndDate } from '../hooks/useSubscriptionStatus';
import { sendSchoolAdminInvite } from '../services/email';

// Generate a unique join code (6 characters, uppercase alphanumeric)
const generateJoinCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0, O, 1, I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Tab options
const TABS = [
  { id: 'requests', label: 'Access Requests', icon: Clock },
  { id: 'schools', label: 'Schools', icon: School },
  { id: 'create', label: 'Create School', icon: Plus }
];

// Trial duration options (in days)
const TRIAL_DURATIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' }
];

// Subscription status options for editing
const STATUS_OPTIONS = [
  { value: 'trial', label: 'Trial', color: 'sky' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'expired', label: 'Expired', color: 'red' },
  { value: 'suspended', label: 'Suspended', color: 'amber' }
];

export default function Admin() {
  const { user, isSiteAdmin } = useAuth();
  const { settings } = useSchool();
  const isLight = settings?.theme === 'light';

  const [activeTab, setActiveTab] = useState('requests');
  const [accessRequests, setAccessRequests] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSchool, setExpandedSchool] = useState(null);

  // Create school form state
  const [newSchool, setNewSchool] = useState({
    name: '',
    mascot: '',
    adminEmail: '',
    trialDuration: 30,
    notes: '',
    sendInviteEmail: true
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Edit school modal state
  const [editingSchool, setEditingSchool] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load access requests
      const requestsSnap = await getDocs(collection(db, 'access_requests'));
      const requestsData = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAccessRequests(requestsData);

      // Load schools
      const schoolsSnap = await getDocs(collection(db, 'schools'));
      const schoolsData = schoolsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSchools(schoolsData);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
    setLoading(false);
  };

  // Approve access request
  const approveRequest = async (request) => {
    try {
      // Update request status
      await updateDoc(doc(db, 'access_requests', request.id), {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: user?.uid
      });

      // Refresh data
      loadData();
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Failed to approve request');
    }
  };

  // Deny access request
  const denyRequest = async (request) => {
    if (!confirm('Deny this access request?')) return;

    try {
      await updateDoc(doc(db, 'access_requests', request.id), {
        status: 'denied',
        deniedAt: new Date().toISOString(),
        deniedBy: user?.uid
      });

      loadData();
    } catch (err) {
      console.error('Error denying request:', err);
      alert('Failed to deny request');
    }
  };

  // Delete access request
  const deleteRequest = async (requestId) => {
    if (!confirm('Delete this request permanently?')) return;

    try {
      await deleteDoc(doc(db, 'access_requests', requestId));
      loadData();
    } catch (err) {
      console.error('Error deleting request:', err);
      alert('Failed to delete request');
    }
  };

  // Create new school
  const createSchool = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(false);

    if (!newSchool.name || !newSchool.adminEmail) {
      setCreateError('School name and admin email are required');
      return;
    }

    setCreating(true);
    try {
      const schoolId = `school_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const trialEndDate = calculateTrialEndDate(now, newSchool.trialDuration);

      const schoolData = {
        name: newSchool.name,
        mascot: newSchool.mascot || '',
        schoolAdminEmail: newSchool.adminEmail.toLowerCase(),
        memberList: [newSchool.adminEmail.toLowerCase()],
        staff: [{
          id: `staff_${Date.now()}`,
          email: newSchool.adminEmail.toLowerCase(),
          name: '',
          role: 'Head Coach',
          roles: ['Head Coach', 'Team Admin'],
          permissionLevel: 'admin',
          isSchoolAdmin: true
        }],
        subscription: {
          status: SUBSCRIPTION_STATUS.TRIAL,
          trialStartDate: now.toISOString(),
          trialEndDate: trialEndDate.toISOString(),
          activatedAt: null,
          suspendedAt: null,
          suspendedReason: null,
          notes: newSchool.notes || ''
        },
        joinCode: generateJoinCode(),
        createdBy: user?.email,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        // Initialize empty arrays for school data
        roster: [],
        plays: {},
        weeks: [],
        depthChart: {},
        wristbands: {},
        gamePlans: {},
        settings: { theme: 'light' },
        programLevels: [],
        culture: {},
        setupConfig: {}
      };

      await setDoc(doc(db, 'schools', schoolId), schoolData);

      // Send invite email if checkbox is checked
      if (newSchool.sendInviteEmail) {
        try {
          await sendSchoolAdminInvite({
            toEmail: newSchool.adminEmail.toLowerCase(),
            schoolName: newSchool.name,
            inviterName: user?.displayName || user?.email?.split('@')[0] || 'DoFO Team',
            trialDays: newSchool.trialDuration
          });
          console.log('Invite email sent to:', newSchool.adminEmail);
        } catch (emailErr) {
          console.error('Failed to send invite email:', emailErr);
          // Don't fail the whole operation if email fails
        }
      }

      setCreateSuccess(true);
      setNewSchool({
        name: '',
        mascot: '',
        adminEmail: '',
        trialDuration: 30,
        notes: '',
        sendInviteEmail: true
      });

      // Refresh schools list
      loadData();

      // Switch to schools tab after a moment
      setTimeout(() => {
        setActiveTab('schools');
        setCreateSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error creating school:', err);
      setCreateError(err.message || 'Failed to create school');
    }
    setCreating(false);
  };

  // Update school subscription
  const updateSchoolSubscription = async (schoolId, updates) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'schools', schoolId), {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email
      });
      loadData();
      setEditingSchool(null);
    } catch (err) {
      console.error('Error updating school:', err);
      alert('Failed to update school: ' + (err.message || err.code || 'Unknown error'));
    }
    setSaving(false);
  };

  // Quick actions for schools
  const extendTrial = async (school, days) => {
    const currentEnd = school.subscription?.trialEndDate
      ? new Date(school.subscription.trialEndDate)
      : new Date();
    const newEnd = new Date(currentEnd);
    newEnd.setDate(newEnd.getDate() + days);

    await updateSchoolSubscription(school.id, {
      'subscription.trialEndDate': newEnd.toISOString(),
      'subscription.status': SUBSCRIPTION_STATUS.TRIAL
    });
  };

  const suspendSchool = async (school) => {
    const reason = prompt('Reason for suspension (optional):');
    await updateSchoolSubscription(school.id, {
      'subscription.status': SUBSCRIPTION_STATUS.SUSPENDED,
      'subscription.suspendedAt': new Date().toISOString(),
      'subscription.suspendedReason': reason || null
    });
  };

  const reactivateSchool = async (school) => {
    await updateSchoolSubscription(school.id, {
      'subscription.status': SUBSCRIPTION_STATUS.ACTIVE,
      'subscription.suspendedAt': null,
      'subscription.suspendedReason': null,
      'subscription.activatedAt': new Date().toISOString()
    });
  };

  // Schedule school for deletion (30-day grace period)
  const scheduleSchoolDeletion = async (school) => {
    if (!confirm(`Schedule "${school.name}" for deletion?\n\nThe school will be permanently deleted in 30 days. Users will lose access immediately.`)) return;

    try {
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);

      await updateDoc(doc(db, 'schools', school.id), {
        'subscription.status': 'pending_deletion',
        'subscription.scheduledDeletionDate': deletionDate.toISOString(),
        'subscription.scheduledBy': user?.email,
        updatedAt: new Date().toISOString()
      });

      loadData();
      alert(`${school.name} scheduled for deletion on ${deletionDate.toLocaleDateString()}`);
    } catch (err) {
      console.error('Error scheduling deletion:', err);
      alert('Failed to schedule deletion: ' + (err.message || err.code || 'Unknown error'));
    }
  };

  // Cancel scheduled deletion
  const cancelScheduledDeletion = async (school) => {
    try {
      await updateDoc(doc(db, 'schools', school.id), {
        'subscription.status': SUBSCRIPTION_STATUS.TRIAL,
        'subscription.scheduledDeletionDate': null,
        'subscription.scheduledBy': null,
        updatedAt: new Date().toISOString()
      });
      loadData();
    } catch (err) {
      console.error('Error canceling deletion:', err);
      alert('Failed to cancel: ' + (err.message || err.code || 'Unknown error'));
    }
  };

  // Full cascade delete - removes school and ALL related data
  const deleteSchool = async (school, immediate = false) => {
    const message = immediate
      ? `PERMANENTLY DELETE "${school.name}" and all related data?\n\nThis will:\n• Remove all plays, roster, and settings\n• Remove user memberships\n• Delete invites and mail records\n\nThis cannot be undone!`
      : `Delete "${school.name}"?\n\nChoose OK for immediate deletion, or Cancel to schedule for 30 days instead.`;

    if (!confirm(message)) {
      if (!immediate) {
        // Offer 30-day option
        scheduleSchoolDeletion(school);
      }
      return;
    }

    try {
      const schoolId = school.id;
      const memberEmails = school.memberList || [];

      // 1. Delete associated mail documents
      const mailQuery = query(collection(db, 'mail'), where('metadata.schoolName', '==', school.name));
      const mailSnap = await getDocs(mailQuery);
      const deleteMailPromises = mailSnap.docs.map(d => deleteDoc(doc(db, 'mail', d.id)));
      await Promise.all(deleteMailPromises);
      console.log(`Deleted ${mailSnap.docs.length} mail documents`);

      // 2. Delete invites for this school
      const invitesQuery = query(collection(db, 'invites'), where('schoolId', '==', schoolId));
      const invitesSnap = await getDocs(invitesQuery);
      const deleteInvitePromises = invitesSnap.docs.map(d => deleteDoc(doc(db, 'invites', d.id)));
      await Promise.all(deleteInvitePromises);
      console.log(`Deleted ${invitesSnap.docs.length} invites`);

      // 3. Update users who have this as activeSchoolId and delete their memberships
      const usersSnap = await getDocs(collection(db, 'users'));
      const userUpdatePromises = [];

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();

        // Delete membership subcollection for this school
        try {
          const membershipRef = doc(db, 'users', userDoc.id, 'memberships', schoolId);
          await deleteDoc(membershipRef);
        } catch (e) {
          // Membership may not exist, that's ok
        }

        // If this was their active school, clear it
        if (userData.activeSchoolId === schoolId) {
          userUpdatePromises.push(
            updateDoc(doc(db, 'users', userDoc.id), {
              activeSchoolId: null,
              updatedAt: new Date().toISOString()
            })
          );
        }
      }
      await Promise.all(userUpdatePromises);
      console.log(`Updated ${userUpdatePromises.length} user documents`);

      // 4. Update access requests linked to this school
      const accessQuery = query(collection(db, 'access_requests'), where('schoolId', '==', schoolId));
      const accessSnap = await getDocs(accessQuery);
      const accessUpdatePromises = accessSnap.docs.map(d =>
        updateDoc(doc(db, 'access_requests', d.id), {
          schoolId: null,
          schoolDeleted: true,
          schoolDeletedAt: new Date().toISOString()
        })
      );
      await Promise.all(accessUpdatePromises);
      console.log(`Updated ${accessSnap.docs.length} access requests`);

      // 5. Finally delete the school document
      await deleteDoc(doc(db, 'schools', schoolId));
      console.log(`Deleted school: ${school.name}`);

      loadData();
      alert(`${school.name} and all related data have been deleted.`);
    } catch (err) {
      console.error('Error deleting school:', err);
      alert('Failed to delete school: ' + (err.message || err.code || 'Unknown error'));
    }
  };

  // Filter items based on search
  const filterItems = (items, fields) => {
    if (!searchTerm) return items;
    const search = searchTerm.toLowerCase();
    return items.filter(item =>
      fields.some(field => item[field]?.toString().toLowerCase().includes(search))
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color classes
  const getStatusBadgeClasses = (color, lightMode = false) => {
    const darkColors = {
      sky: 'bg-sky-500/20 text-sky-400',
      green: 'bg-green-500/20 text-green-400',
      red: 'bg-red-500/20 text-red-400',
      amber: 'bg-amber-500/20 text-amber-400',
      slate: 'bg-slate-500/20 text-slate-400'
    };
    const lightColors = {
      sky: 'bg-sky-100 text-sky-700',
      green: 'bg-green-100 text-green-700',
      red: 'bg-red-100 text-red-700',
      amber: 'bg-amber-100 text-amber-700',
      slate: 'bg-gray-100 text-gray-700'
    };
    const colors = lightMode ? lightColors : darkColors;
    return colors[color] || colors.slate;
  };

  // Check if user is admin
  if (!isSiteAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-8 text-center">
          <Shield size={48} className="mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  // Filter out invalid requests (no email) and get pending count
  const validRequests = accessRequests.filter(r => r.email && r.email.trim());
  const pendingRequests = validRequests.filter(r => r.status === 'pending');
  const filteredRequests = filterItems(validRequests, ['email', 'schoolName', 'role']);
  const filteredSchools = filterItems(schools, ['name', 'mascot', 'schoolAdminEmail']);

  // Sort schools by creation date (newest first)
  const sortedSchools = [...filteredSchools].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateB - dateA;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-3xl font-bold mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>Admin Panel</h1>
          <p className={isLight ? 'text-gray-500' : 'text-slate-400'}>
            {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''} • {schools.length} school{schools.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 ${
            isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              activeTab === tab.id
                ? 'bg-sky-500 text-white'
                : isLight
                  ? 'bg-gray-100 text-gray-600 hover:text-gray-900'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            {tab.id === 'requests' && pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search (not shown on create tab) */}
      {activeTab !== 'create' && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
            <input
              id="admin-search"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                isLight
                  ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
              }`}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Access Requests Tab */}
          {activeTab === 'requests' && (
            <div className={`rounded-lg border overflow-hidden ${
              isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <table className="w-full">
                <thead>
                  <tr className={isLight ? 'bg-gray-50' : 'bg-slate-800'}>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Email</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>School</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Role</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Status</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Date</th>
                    <th className={`px-4 py-3 text-right text-sm font-semibold ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center">
                        <Clock size={32} className={`mx-auto mb-2 ${isLight ? 'text-gray-400' : 'text-slate-600'}`} />
                        <p className={isLight ? 'text-gray-500' : 'text-slate-500'}>No access requests</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request, idx) => (
                      <tr
                        key={request.id}
                        className={idx % 2 === 0
                          ? isLight ? 'bg-white' : 'bg-slate-900'
                          : isLight ? 'bg-gray-50' : 'bg-slate-900/50'
                        }
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className={isLight ? 'text-gray-400' : 'text-slate-500'} />
                            <span className={isLight ? 'text-gray-900' : 'text-white'}>{request.email}</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>{request.schoolName || '-'}</td>
                        <td className={`px-4 py-3 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>{request.role || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            request.status === 'pending'
                              ? isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'
                              : request.status === 'approved'
                              ? isLight ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'
                              : isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                          {formatDate(request.requestedAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {request.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => approveRequest(request)}
                                className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
                                  isLight ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                }`}
                              >
                                <CheckCircle size={14} />
                                Approve
                              </button>
                              <button
                                onClick={() => denyRequest(request)}
                                className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
                                  isLight ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                }`}
                              >
                                <XCircle size={14} />
                                Deny
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => deleteRequest(request.id)}
                              className={`p-2 ${isLight ? 'text-gray-400 hover:text-red-600' : 'text-slate-400 hover:text-red-400'}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Schools Tab */}
          {activeTab === 'schools' && (
            <div className="space-y-3">
              {sortedSchools.length === 0 ? (
                <div className={`rounded-lg border p-12 text-center ${
                  isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <School size={32} className={`mx-auto mb-2 ${isLight ? 'text-gray-400' : 'text-slate-600'}`} />
                  <p className={`mb-4 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>No schools found</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
                  >
                    <Plus size={18} />
                    Create School
                  </button>
                </div>
              ) : (
                sortedSchools.map(school => {
                  const subStatus = getSubscriptionStatus(school);

                  return (
                    <div
                      key={school.id}
                      className={`rounded-lg border overflow-hidden ${
                        isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div
                        className={`flex items-center gap-4 p-4 cursor-pointer ${
                          isLight ? 'hover:bg-gray-50' : 'hover:bg-slate-800/50'
                        }`}
                        onClick={() => setExpandedSchool(expandedSchool === school.id ? null : school.id)}
                      >
                        <button className={isLight ? 'text-gray-400' : 'text-slate-500'}>
                          {expandedSchool === school.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>

                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: school.primaryColor || '#3b82f6' }}
                        >
                          {school.name?.charAt(0) || '?'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{school.name}</h3>
                          <p className={`text-sm truncate ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                            {school.schoolAdminEmail || school.mascot || 'No admin set'}
                          </p>
                        </div>

                        {/* Subscription Status Badge */}
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusBadgeClasses(subStatus.statusColor, isLight)}`}>
                            {subStatus.statusLabel}
                          </span>
                        </div>

                        <div className={`text-right text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                          {school.roster?.length || 0} players
                        </div>
                      </div>

                      {expandedSchool === school.id && (
                        <div className={`border-t p-4 ${isLight ? 'border-gray-200' : 'border-slate-800'}`}>
                          {/* School details grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <span className={`block ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>School Admin:</span>
                              <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>{school.schoolAdminEmail || 'Not set'}</span>
                            </div>
                            <div>
                              <span className={`block ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Trial Ends:</span>
                              <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>
                                {school.subscription?.trialEndDate
                                  ? formatDate(school.subscription.trialEndDate)
                                  : 'Not set'}
                              </span>
                            </div>
                            <div>
                              <span className={`block ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Created:</span>
                              <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>{formatDate(school.createdAt)}</span>
                            </div>
                            <div>
                              <span className={`block ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>Created By:</span>
                              <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>{school.createdBy || 'Unknown'}</span>
                            </div>
                          </div>

                          {/* Pending Deletion Warning */}
                          {school.subscription?.status === 'pending_deletion' && (
                            <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${
                              isLight ? 'bg-red-50 border border-red-200' : 'bg-red-500/10 border border-red-500/30'
                            }`}>
                              <AlertTriangle className={isLight ? 'text-red-600' : 'text-red-400'} size={20} />
                              <div>
                                <span className={`font-medium ${isLight ? 'text-red-700' : 'text-red-400'}`}>
                                  Scheduled for deletion
                                </span>
                                <span className={`ml-2 ${isLight ? 'text-red-600' : 'text-red-300'}`}>
                                  {school.subscription.scheduledDeletionDate
                                    ? formatDate(school.subscription.scheduledDeletionDate)
                                    : 'Date not set'}
                                </span>
                                {school.subscription.scheduledBy && (
                                  <span className={`block text-sm ${isLight ? 'text-red-500' : 'text-red-400/70'}`}>
                                    by {school.subscription.scheduledBy}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Join Code */}
                          <div className={`mb-4 p-3 rounded-lg flex items-center justify-between ${
                            isLight ? 'bg-sky-50 border border-sky-200' : 'bg-sky-500/10 border border-sky-500/30'
                          }`}>
                            <div>
                              <span className={`text-sm ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>Join Code: </span>
                              <span className={`font-mono font-bold text-lg ${isLight ? 'text-sky-900' : 'text-sky-300'}`}>
                                {school.joinCode || 'Not set'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {school.joinCode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(school.joinCode);
                                    alert('Join code copied!');
                                  }}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                                    isLight ? 'bg-sky-100 text-sky-700 hover:bg-sky-200' : 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
                                  }`}
                                >
                                  <Copy size={14} />
                                  Copy
                                </button>
                              )}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (school.joinCode && !confirm('Generate a new join code? The old code will stop working.')) return;
                                  const newCode = generateJoinCode();
                                  await updateSchoolSubscription(school.id, { joinCode: newCode });
                                }}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                                  isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                              >
                                <RefreshCw size={14} />
                                {school.joinCode ? 'Regenerate' : 'Generate'}
                              </button>
                            </div>
                          </div>

                          {/* Notes if any */}
                          {school.subscription?.notes && (
                            <div className={`mb-4 p-3 rounded-lg text-sm ${
                              isLight ? 'bg-gray-100' : 'bg-slate-800/50'
                            }`}>
                              <span className={isLight ? 'text-gray-500' : 'text-slate-500'}>Notes: </span>
                              <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>{school.subscription.notes}</span>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingSchool(school); }}
                              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
                                isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-800 text-white hover:bg-slate-700'
                              }`}
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>

                            {/* Extend trial dropdown */}
                            <div className="relative group">
                              <button
                                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
                                  isLight ? 'bg-sky-100 text-sky-700 hover:bg-sky-200' : 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
                                }`}
                              >
                                <CalendarPlus size={14} />
                                Extend Trial
                                <ChevronDown size={14} />
                              </button>
                              <div className={`absolute top-full left-0 mt-1 border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 ${
                                isLight ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700'
                              }`}>
                                {[7, 14, 30, 60, 90].map(days => (
                                  <button
                                    key={days}
                                    onClick={(e) => { e.stopPropagation(); extendTrial(school, days); }}
                                    className={`block w-full px-4 py-2 text-left text-sm first:rounded-t-lg last:rounded-b-lg ${
                                      isLight ? 'text-gray-700 hover:bg-gray-100' : 'text-slate-300 hover:bg-slate-700'
                                    }`}
                                  >
                                    +{days} days
                                  </button>
                                ))}
                              </div>
                            </div>

                            {subStatus.isSuspended ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); reactivateSchool(school); }}
                                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
                                  isLight ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                }`}
                              >
                                <Play size={14} />
                                Reactivate
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); suspendSchool(school); }}
                                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
                                  isLight ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                }`}
                              >
                                <Pause size={14} />
                                Suspend
                              </button>
                            )}

                            {/* Delete options based on status */}
                            {school.subscription?.status === 'pending_deletion' ? (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); cancelScheduledDeletion(school); }}
                                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
                                    isLight ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                  }`}
                                >
                                  <X size={14} />
                                  Cancel Deletion
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteSchool(school, true); }}
                                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
                                    isLight ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                  }`}
                                >
                                  <Trash2 size={14} />
                                  Delete Now
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); scheduleSchoolDeletion(school); }}
                                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
                                    isLight ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                  }`}
                                >
                                  <Clock size={14} />
                                  Delete in 30 Days
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteSchool(school, true); }}
                                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
                                    isLight ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                  }`}
                                >
                                  <Trash2 size={14} />
                                  Delete Now
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Create School Tab */}
          {activeTab === 'create' && (
            <div className="max-w-xl mx-auto">
              <div className={`rounded-lg border overflow-hidden ${
                isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className={`p-4 border-b ${isLight ? 'border-gray-200' : 'border-slate-800'}`}>
                  <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Create New School</h2>
                  <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Set up a new school with trial access</p>
                </div>

                <form onSubmit={createSchool} className="p-4 space-y-4">
                  {createError && (
                    <div className={`p-3 border rounded-lg text-sm flex items-center gap-2 ${
                      isLight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-500/20 border-red-500/50 text-red-400'
                    }`}>
                      <AlertTriangle size={16} />
                      {createError}
                    </div>
                  )}

                  {createSuccess && (
                    <div className={`p-3 border rounded-lg text-sm flex items-center gap-2 ${
                      isLight ? 'bg-green-50 border-green-200 text-green-700' : 'bg-green-500/20 border-green-500/50 text-green-400'
                    }`}>
                      <CheckCircle size={16} />
                      School created successfully!
                    </div>
                  )}

                  <div>
                    <label htmlFor="create-school-name" className={`text-sm block mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>School Name *</label>
                    <input
                      id="create-school-name"
                      type="text"
                      value={newSchool.name}
                      onChange={e => setNewSchool({ ...newSchool, name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-slate-800 border-slate-700 text-white'
                      }`}
                      placeholder="Lincoln High School"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="create-school-mascot" className={`text-sm block mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Mascot</label>
                    <input
                      id="create-school-mascot"
                      type="text"
                      value={newSchool.mascot}
                      onChange={e => setNewSchool({ ...newSchool, mascot: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-slate-800 border-slate-700 text-white'
                      }`}
                      placeholder="Vikings"
                    />
                  </div>

                  <div>
                    <label htmlFor="create-school-admin-email" className={`text-sm block mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>School Admin Email * (must be a Google account)</label>
                    <input
                      id="create-school-admin-email"
                      type="email"
                      value={newSchool.adminEmail}
                      onChange={e => setNewSchool({ ...newSchool, adminEmail: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-slate-800 border-slate-700 text-white'
                      }`}
                      placeholder="coach.johnson@gmail.com"
                      required
                    />
                    <p className={`text-xs mt-1 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                      This person will be the school admin and can add other coaches.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="create-school-trial-duration" className={`text-sm block mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Trial Duration</label>
                    <select
                      id="create-school-trial-duration"
                      value={newSchool.trialDuration}
                      onChange={e => setNewSchool({ ...newSchool, trialDuration: parseInt(e.target.value) })}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-slate-800 border-slate-700 text-white'
                      }`}
                    >
                      {TRIAL_DURATIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="create-school-notes" className={`text-sm block mb-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Notes (optional)</label>
                    <textarea
                      id="create-school-notes"
                      value={newSchool.notes}
                      onChange={e => setNewSchool({ ...newSchool, notes: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg resize-none ${
                        isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-slate-800 border-slate-700 text-white'
                      }`}
                      rows={3}
                      placeholder="Friend from coaching clinic, testing for their program..."
                    />
                  </div>

                  <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                    isLight ? 'bg-sky-50 border-sky-200' : 'bg-sky-500/10 border-sky-500/30'
                  }`}>
                    <input
                      id="create-school-send-invite"
                      type="checkbox"
                      checked={newSchool.sendInviteEmail}
                      onChange={e => setNewSchool({ ...newSchool, sendInviteEmail: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                    />
                    <div>
                      <label htmlFor="create-school-send-invite" className={`font-medium cursor-pointer ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        Send invite email
                      </label>
                      <p className={`text-sm mt-0.5 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                        Send a branded welcome email to the admin with sign-up instructions
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('schools')}
                      className={`px-4 py-2 rounded-lg ${
                        isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating || !newSchool.name || !newSchool.adminEmail}
                      className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creating ? 'Creating...' : 'Create School'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit School Modal */}
      {editingSchool && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Edit School</h3>
              <button
                onClick={() => setEditingSchool(null)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="edit-school-name" className="text-sm text-slate-400 block mb-1">School Name</label>
                <input
                  id="edit-school-name"
                  type="text"
                  value={editingSchool.name || ''}
                  onChange={e => setEditingSchool({ ...editingSchool, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label htmlFor="edit-school-mascot" className="text-sm text-slate-400 block mb-1">Mascot</label>
                <input
                  id="edit-school-mascot"
                  type="text"
                  value={editingSchool.mascot || ''}
                  onChange={e => setEditingSchool({ ...editingSchool, mascot: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label htmlFor="edit-school-admin-email" className="text-sm text-slate-400 block mb-1">School Admin Email</label>
                <input
                  id="edit-school-admin-email"
                  type="email"
                  value={editingSchool.schoolAdminEmail || ''}
                  onChange={e => setEditingSchool({ ...editingSchool, schoolAdminEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-school-subscription-status" className="text-sm text-slate-400 block mb-1">Subscription Status</label>
                  <select
                    id="edit-school-subscription-status"
                    value={editingSchool.subscription?.status || 'trial'}
                    onChange={e => setEditingSchool({
                      ...editingSchool,
                      subscription: { ...editingSchool.subscription, status: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-school-trial-end-date" className="text-sm text-slate-400 block mb-1">Trial End Date</label>
                  <input
                    id="edit-school-trial-end-date"
                    type="date"
                    value={editingSchool.subscription?.trialEndDate
                      ? new Date(editingSchool.subscription.trialEndDate).toISOString().split('T')[0]
                      : ''}
                    onChange={e => setEditingSchool({
                      ...editingSchool,
                      subscription: {
                        ...editingSchool.subscription,
                        trialEndDate: e.target.value ? new Date(e.target.value).toISOString() : null
                      }
                    })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-school-notes" className="text-sm text-slate-400 block mb-1">Notes</label>
                <textarea
                  id="edit-school-notes"
                  value={editingSchool.subscription?.notes || ''}
                  onChange={e => setEditingSchool({
                    ...editingSchool,
                    subscription: { ...editingSchool.subscription, notes: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none"
                  rows={2}
                />
              </div>

              {/* Member List Section */}
              <div>
                <label htmlFor="newMemberEmail" className="text-sm text-slate-400 block mb-1">
                  Member List ({editingSchool.memberList?.length || 0} members)
                </label>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 max-h-32 overflow-y-auto mb-2">
                  {editingSchool.memberList?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {editingSchool.memberList.map((email, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => setEditingSchool({
                              ...editingSchool,
                              memberList: editingSchool.memberList.filter((_, i) => i !== idx)
                            })}
                            className="text-slate-500 hover:text-red-400"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No members</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    id="newMemberEmail"
                    placeholder="Add email to member list"
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target;
                        const email = input.value.toLowerCase().trim();
                        if (email && !editingSchool.memberList?.includes(email)) {
                          setEditingSchool({
                            ...editingSchool,
                            memberList: [...(editingSchool.memberList || []), email]
                          });
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('newMemberEmail');
                      const email = input.value.toLowerCase().trim();
                      if (email && !editingSchool.memberList?.includes(email)) {
                        setEditingSchool({
                          ...editingSchool,
                          memberList: [...(editingSchool.memberList || []), email]
                        });
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 text-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Users in this list can access the school when they sign in with Google.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-slate-800">
              <button
                onClick={() => setEditingSchool(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const updates = {
                    name: editingSchool.name || '',
                    mascot: editingSchool.mascot || '',
                    memberList: editingSchool.memberList || []
                  };
                  // Only include fields that are defined
                  if (editingSchool.schoolAdminEmail) {
                    updates.schoolAdminEmail = editingSchool.schoolAdminEmail;
                  }
                  // Clean subscription object - remove undefined values
                  if (editingSchool.subscription) {
                    const cleanSub = {};
                    Object.entries(editingSchool.subscription).forEach(([key, value]) => {
                      if (value !== undefined) {
                        cleanSub[key] = value;
                      }
                    });
                    if (Object.keys(cleanSub).length > 0) {
                      updates.subscription = cleanSub;
                    }
                  }
                  updateSchoolSubscription(editingSchool.id, updates);
                }}
                disabled={saving}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
