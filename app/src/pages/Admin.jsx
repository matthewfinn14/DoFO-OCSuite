import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Users,
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
  CalendarPlus
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getSubscriptionStatus, SUBSCRIPTION_STATUS, calculateTrialEndDate } from '../hooks/useSubscriptionStatus';

// Tab options
const TABS = [
  { id: 'requests', label: 'Access Requests', icon: Clock },
  { id: 'users', label: 'All Users', icon: Users },
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

  const [activeTab, setActiveTab] = useState('requests');
  const [accessRequests, setAccessRequests] = useState([]);
  const [users, setUsers] = useState([]);
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
    notes: ''
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

      // Load users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersData);

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
        settings: {},
        programLevels: [],
        culture: {},
        setupConfig: {}
      };

      await setDoc(doc(db, 'schools', schoolId), schoolData);

      setCreateSuccess(true);
      setNewSchool({
        name: '',
        mascot: '',
        adminEmail: '',
        trialDuration: 30,
        notes: ''
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
  const getStatusBadgeClasses = (color) => {
    const colors = {
      sky: 'bg-sky-500/20 text-sky-400',
      green: 'bg-green-500/20 text-green-400',
      red: 'bg-red-500/20 text-red-400',
      amber: 'bg-amber-500/20 text-amber-400',
      slate: 'bg-slate-500/20 text-slate-400'
    };
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

  const pendingRequests = accessRequests.filter(r => r.status === 'pending');
  const filteredRequests = filterItems(accessRequests, ['email', 'schoolName', 'role']);
  const filteredUsers = filterItems(users, ['email', 'displayName']);
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
          <h1 className="text-3xl font-bold text-white mb-1">Admin Panel</h1>
          <p className="text-slate-400">
            {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''} • {schools.length} school{schools.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
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
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="admin-search"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
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
            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">School</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Date</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center">
                        <Clock size={32} className="mx-auto mb-2 text-slate-600" />
                        <p className="text-slate-500">No access requests</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request, idx) => (
                      <tr
                        key={request.id}
                        className={idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-slate-500" />
                            <span className="text-white">{request.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{request.schoolName || '-'}</td>
                        <td className="px-4 py-3 text-slate-300">{request.role || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            request.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400'
                              : request.status === 'approved'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {formatDate(request.requestedAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {request.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => approveRequest(request)}
                                className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                              >
                                <CheckCircle size={14} />
                                Approve
                              </button>
                              <button
                                onClick={() => denyRequest(request)}
                                className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                              >
                                <XCircle size={14} />
                                Deny
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => deleteRequest(request.id)}
                              className="p-2 text-slate-400 hover:text-red-400"
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

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-12 text-center">
                        <Users size={32} className="mx-auto mb-2 text-slate-600" />
                        <p className="text-slate-500">No users found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, idx) => (
                      <tr
                        key={u.id}
                        className={idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sky-400 font-bold">
                              {u.displayName?.charAt(0) || u.email?.charAt(0) || '?'}
                            </div>
                            <span className="font-medium text-white">{u.displayName || 'No name'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{u.email}</td>
                        <td className="px-4 py-3">
                          {u.isAdmin && (
                            <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full">
                              Admin
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {formatDate(u.lastActive)}
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
                <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
                  <School size={32} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-slate-500 mb-4">No schools found</p>
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
                      className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden"
                    >
                      <div
                        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-800/50"
                        onClick={() => setExpandedSchool(expandedSchool === school.id ? null : school.id)}
                      >
                        <button className="text-slate-500">
                          {expandedSchool === school.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>

                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: school.primaryColor || '#3b82f6' }}
                        >
                          {school.name?.charAt(0) || '?'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white">{school.name}</h3>
                          <p className="text-sm text-slate-400 truncate">
                            {school.schoolAdminEmail || school.mascot || 'No admin set'}
                          </p>
                        </div>

                        {/* Subscription Status Badge */}
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusBadgeClasses(subStatus.statusColor)}`}>
                            {subStatus.statusLabel}
                          </span>
                        </div>

                        <div className="text-right text-sm text-slate-400">
                          {school.roster?.length || 0} players
                        </div>
                      </div>

                      {expandedSchool === school.id && (
                        <div className="border-t border-slate-800 p-4">
                          {/* School details grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-slate-500 block">School Admin:</span>
                              <span className="text-slate-300">{school.schoolAdminEmail || 'Not set'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Trial Ends:</span>
                              <span className="text-slate-300">
                                {school.subscription?.trialEndDate
                                  ? formatDate(school.subscription.trialEndDate)
                                  : 'Not set'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Created:</span>
                              <span className="text-slate-300">{formatDate(school.createdAt)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Created By:</span>
                              <span className="text-slate-300">{school.createdBy || 'Unknown'}</span>
                            </div>
                          </div>

                          {/* Notes if any */}
                          {school.subscription?.notes && (
                            <div className="mb-4 p-3 bg-slate-800/50 rounded-lg text-sm">
                              <span className="text-slate-500">Notes: </span>
                              <span className="text-slate-300">{school.subscription.notes}</span>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingSchool(school); }}
                              className="flex items-center gap-1 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm"
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>

                            {/* Extend trial dropdown */}
                            <div className="relative group">
                              <button
                                className="flex items-center gap-1 px-3 py-2 bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/30 text-sm"
                              >
                                <CalendarPlus size={14} />
                                Extend Trial
                                <ChevronDown size={14} />
                              </button>
                              <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                {[7, 14, 30, 60, 90].map(days => (
                                  <button
                                    key={days}
                                    onClick={(e) => { e.stopPropagation(); extendTrial(school, days); }}
                                    className="block w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg"
                                  >
                                    +{days} days
                                  </button>
                                ))}
                              </div>
                            </div>

                            {subStatus.isSuspended ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); reactivateSchool(school); }}
                                className="flex items-center gap-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 text-sm"
                              >
                                <Play size={14} />
                                Reactivate
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); suspendSchool(school); }}
                                className="flex items-center gap-1 px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 text-sm"
                              >
                                <Pause size={14} />
                                Suspend
                              </button>
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
              <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h2 className="text-xl font-semibold text-white">Create New School</h2>
                  <p className="text-slate-400 text-sm">Set up a new school with trial access</p>
                </div>

                <form onSubmit={createSchool} className="p-4 space-y-4">
                  {createError && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
                      <AlertTriangle size={16} />
                      {createError}
                    </div>
                  )}

                  {createSuccess && (
                    <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-center gap-2">
                      <CheckCircle size={16} />
                      School created successfully!
                    </div>
                  )}

                  <div>
                    <label htmlFor="create-school-name" className="text-sm text-slate-400 block mb-1">School Name *</label>
                    <input
                      id="create-school-name"
                      type="text"
                      value={newSchool.name}
                      onChange={e => setNewSchool({ ...newSchool, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      placeholder="Lincoln High School"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="create-school-mascot" className="text-sm text-slate-400 block mb-1">Mascot</label>
                    <input
                      id="create-school-mascot"
                      type="text"
                      value={newSchool.mascot}
                      onChange={e => setNewSchool({ ...newSchool, mascot: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      placeholder="Vikings"
                    />
                  </div>

                  <div>
                    <label htmlFor="create-school-admin-email" className="text-sm text-slate-400 block mb-1">School Admin Email * (must be a Google account)</label>
                    <input
                      id="create-school-admin-email"
                      type="email"
                      value={newSchool.adminEmail}
                      onChange={e => setNewSchool({ ...newSchool, adminEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      placeholder="coach.johnson@gmail.com"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      This person will be the school admin and can add other coaches.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="create-school-trial-duration" className="text-sm text-slate-400 block mb-1">Trial Duration</label>
                    <select
                      id="create-school-trial-duration"
                      value={newSchool.trialDuration}
                      onChange={e => setNewSchool({ ...newSchool, trialDuration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      {TRIAL_DURATIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="create-school-notes" className="text-sm text-slate-400 block mb-1">Notes (optional)</label>
                    <textarea
                      id="create-school-notes"
                      value={newSchool.notes}
                      onChange={e => setNewSchool({ ...newSchool, notes: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none"
                      rows={3}
                      placeholder="Friend from coaching clinic, testing for their program..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('schools')}
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
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
                    name: editingSchool.name,
                    mascot: editingSchool.mascot,
                    memberList: editingSchool.memberList || []
                  };
                  // Only include fields that are defined
                  if (editingSchool.schoolAdminEmail) {
                    updates.schoolAdminEmail = editingSchool.schoolAdminEmail;
                  }
                  if (editingSchool.subscription) {
                    updates.subscription = editingSchool.subscription;
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
