import { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

// Tab options
const TABS = [
  { id: 'requests', label: 'Access Requests', icon: Clock },
  { id: 'users', label: 'All Users', icon: Users },
  { id: 'schools', label: 'Schools', icon: School }
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
  const filteredSchools = filterItems(schools, ['name', 'mascot']);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Admin Panel</h1>
          <p className="text-slate-400">
            {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
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
      <div className="flex gap-2 mb-6">
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

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
          />
        </div>
      </div>

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
                          {formatDate(request.createdAt)}
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
              {filteredSchools.length === 0 ? (
                <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
                  <School size={32} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-slate-500">No schools found</p>
                </div>
              ) : (
                filteredSchools.map(school => (
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

                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{school.name}</h3>
                        <p className="text-sm text-slate-400">{school.mascot || 'No mascot set'}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-slate-400">
                          {school.roster?.length || 0} players
                        </div>
                        <div className="text-sm text-slate-500">
                          {Object.keys(school.plays || {}).length} plays
                        </div>
                      </div>
                    </div>

                    {expandedSchool === school.id && (
                      <div className="border-t border-slate-800 p-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">ID:</span>
                          <span className="ml-2 text-slate-300 font-mono">{school.id}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Created:</span>
                          <span className="ml-2 text-slate-300">{formatDate(school.createdAt)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Staff:</span>
                          <span className="ml-2 text-slate-300">{school.staff?.length || 0} members</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Weeks:</span>
                          <span className="ml-2 text-slate-300">{school.weeks?.length || 0} weeks</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
