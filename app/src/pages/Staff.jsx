import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Shield,
  Mail,
  Phone,
  UserCog,
  ChevronDown,
  Check,
  Save,
  Info,
  Filter,
  Download,
  Upload,
  Archive as ArchiveIcon,
  UserCheck,
  GraduationCap,
  RotateCcw,
  Play,
  Copy,
  Key
} from 'lucide-react';

// Staff role options
const STAFF_ROLES = [
  { id: 'head_coach', label: 'Head Coach', color: '#ef4444' },
  { id: 'offensive_coordinator', label: 'Offensive Coordinator', color: '#3b82f6' },
  { id: 'defensive_coordinator', label: 'Defensive Coordinator', color: '#22c55e' },
  { id: 'special_teams_coordinator', label: 'Special Teams Coord', color: '#f97316' },
  { id: 'position_coach', label: 'Position Coach', color: '#a855f7' },
  { id: 'graduate_assistant', label: 'Graduate Assistant', color: '#6b7280' },
  { id: 'student_assistant', label: 'Student Assistant', color: '#6b7280' },
  { id: 'analyst', label: 'Analyst', color: '#eab308' },
  { id: 'other', label: 'Other', color: '#374151' }
];

// Permission levels (for staff editor)
const PERMISSION_LEVELS = [
  { id: 'admin', label: 'Admin', description: 'Full access to all features' },
  { id: 'coordinator', label: 'Coordinator', description: 'Can edit plays and game plans' },
  { id: 'coach', label: 'Coach', description: 'Can view and add notes' },
  { id: 'viewer', label: 'Viewer', description: 'View only access' }
];

// Permission categories (for permissions tab)
const PERMISSION_CATEGORIES = [
  {
    id: 'playbook',
    label: 'Playbook',
    permissions: [
      { id: 'view_plays', label: 'View Plays' },
      { id: 'edit_plays', label: 'Create/Edit Plays' },
      { id: 'delete_plays', label: 'Delete Plays' },
      { id: 'export_plays', label: 'Export Playbook' }
    ]
  },
  {
    id: 'gameplan',
    label: 'Game Planning',
    permissions: [
      { id: 'view_gameplan', label: 'View Game Plans' },
      { id: 'edit_gameplan', label: 'Edit Game Plans' },
      { id: 'view_callsheet', label: 'View Call Sheets' },
      { id: 'edit_callsheet', label: 'Edit Call Sheets' }
    ]
  },
  {
    id: 'practice',
    label: 'Practice',
    permissions: [
      { id: 'view_practice', label: 'View Practice Planner' },
      { id: 'edit_practice', label: 'Edit Practice Planner' },
      { id: 'view_scripts', label: 'View Scripts' },
      { id: 'edit_scripts', label: 'Edit Scripts' }
    ]
  },
  {
    id: 'roster',
    label: 'Roster',
    permissions: [
      { id: 'view_roster', label: 'View Roster' },
      { id: 'edit_roster', label: 'Edit Players' },
      { id: 'view_depthchart', label: 'View Depth Charts' },
      { id: 'edit_depthchart', label: 'Edit Depth Charts' }
    ]
  },
  {
    id: 'admin',
    label: 'Administration',
    permissions: [
      { id: 'manage_staff', label: 'Manage Staff' },
      { id: 'manage_permissions', label: 'Manage Permissions' },
      { id: 'school_settings', label: 'School Settings' },
      { id: 'export_data', label: 'Export Data' }
    ]
  }
];

// Role presets
const ROLE_PRESETS = {
  admin: {
    name: 'Administrator',
    description: 'Full access to all features',
    permissions: PERMISSION_CATEGORIES.flatMap(c => c.permissions.map(p => p.id))
  },
  coordinator: {
    name: 'Coordinator',
    description: 'Full access except admin features',
    permissions: PERMISSION_CATEGORIES.filter(c => c.id !== 'admin').flatMap(c => c.permissions.map(p => p.id))
  },
  coach: {
    name: 'Position Coach',
    description: 'View access and edit practice/depth charts',
    permissions: ['view_plays', 'view_gameplan', 'view_callsheet', 'view_practice', 'edit_practice', 'view_scripts', 'edit_scripts', 'view_roster', 'view_depthchart', 'edit_depthchart']
  },
  viewer: {
    name: 'Viewer',
    description: 'View-only access',
    permissions: ['view_plays', 'view_gameplan', 'view_callsheet', 'view_practice', 'view_scripts', 'view_roster', 'view_depthchart']
  }
};

// Year/class options for roster
const YEARS = ['FR', 'SO', 'JR', 'SR', 'RS-FR', 'RS-SO', 'RS-JR', 'RS-SR'];

// Tab definitions
const TABS = [
  { id: 'staff', label: 'Staff & Roles', icon: UserCog },
  { id: 'permissions', label: 'Permissions', icon: Shield },
  { id: 'roster', label: 'Manage Roster', icon: Users },
  { id: 'archive', label: 'Archive', icon: ArchiveIcon }
];

// ============================================
// STAFF TAB COMPONENT
// ============================================
function StaffTab() {
  const { staff, updateStaff, setupConfig, programLevels, school, updateSchool } = useSchool();
  const { user, isSiteAdmin } = useAuth();

  // Check if current user is a school admin
  const isSchoolAdmin = useMemo(() => {
    if (isSiteAdmin) return true;
    if (!user?.email || !school) return false;

    const userEmail = user.email.toLowerCase();

    // Check if user is the designated school admin
    if (school.schoolAdminEmail?.toLowerCase() === userEmail) return true;

    // Check if user has isSchoolAdmin flag in staff
    const userStaff = staff.find(s => s.email?.toLowerCase() === userEmail);
    if (userStaff?.isSchoolAdmin) return true;

    // Check permission level
    if (userStaff?.permissionLevel === 'admin') return true;

    return false;
  }, [user?.email, school, staff, isSiteAdmin]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Get all position groups from setup config
  const allPositionGroups = useMemo(() => {
    const groups = [];
    const positionGroups = setupConfig?.positionGroups || {};

    ['OFFENSE', 'DEFENSE', 'SPECIAL_TEAMS'].forEach(phase => {
      const phaseGroups = positionGroups[phase] || [];
      phaseGroups.forEach(group => {
        if (group.name) {
          groups.push({
            id: group.id || group.name,
            name: group.name,
            phase
          });
        }
      });
    });

    return groups;
  }, [setupConfig]);

  // Organize staff into hierarchical groups
  const staffHierarchy = useMemo(() => {
    const hierarchy = {
      headCoach: [],
      coordinators: [],
      positionCoaches: [],
      otherVarsity: [],
      levels: {}
    };

    programLevels.forEach(level => {
      hierarchy.levels[level.id] = { name: level.name, staff: [] };
    });

    staff.forEach(member => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matches =
          member.name?.toLowerCase().includes(search) ||
          member.email?.toLowerCase().includes(search) ||
          member.title?.toLowerCase().includes(search);
        if (!matches) return;
      }

      if (filterRole !== 'all' && member.role !== filterRole) return;

      if (member.levelId && hierarchy.levels[member.levelId]) {
        hierarchy.levels[member.levelId].staff.push(member);
        return;
      }

      switch (member.role) {
        case 'head_coach':
          hierarchy.headCoach.push(member);
          break;
        case 'offensive_coordinator':
        case 'defensive_coordinator':
        case 'special_teams_coordinator':
          hierarchy.coordinators.push(member);
          break;
        case 'position_coach':
          hierarchy.positionCoaches.push(member);
          break;
        default:
          hierarchy.otherVarsity.push(member);
      }
    });

    return hierarchy;
  }, [staff, programLevels, searchTerm, filterRole]);

  const getRoleConfig = (roleId) =>
    STAFF_ROLES.find(r => r.id === roleId) || STAFF_ROLES[STAFF_ROLES.length - 1];

  const openEditor = (member = null) => {
    setEditingStaff(member || {
      id: `staff_${Date.now()}`,
      name: '',
      email: '',
      phone: '',
      title: '',
      role: 'position_coach',
      permissionLevel: 'coach',
      positionGroups: [], // Array of position group names (multi-select)
      levelId: '',
      notes: ''
    });
    setShowEditor(true);
  };

  const StaffCard = ({ member }) => {
    const roleConfig = getRoleConfig(member.role);
    const permLevel = PERMISSION_LEVELS.find(p => p.id === member.permissionLevel);

    return (
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 hover:border-slate-700">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: roleConfig.color }}
            >
              {member.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="font-semibold text-white">{member.name}</h3>
              <p className="text-sm text-slate-400">{member.title || roleConfig.label}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => openEditor(member)}
              className="p-2 text-slate-400 hover:text-white"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => deleteStaff(member.id)}
              className="p-2 text-slate-400 hover:text-red-400"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {member.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-slate-500" />
              <a href={`mailto:${member.email}`} className="text-sky-400 hover:text-sky-300">
                {member.email}
              </a>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-slate-500" />
              <span className="text-slate-300">{member.phone}</span>
            </div>
          )}
          {/* Support both old positionGroup (string) and new positionGroups (array) */}
          {(member.positionGroups?.length > 0 || member.positionGroup) && (
            <div className="flex items-center gap-2 text-sm">
              <UserCog size={14} className="text-slate-500" />
              <span className="text-slate-300">
                {member.positionGroups?.length > 0
                  ? member.positionGroups.join(', ')
                  : member.positionGroup}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
          <span
            className="px-2 py-1 text-xs rounded-full text-white"
            style={{ backgroundColor: roleConfig.color }}
          >
            {roleConfig.label}
          </span>
          {permLevel && (
            <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-slate-800 text-slate-400">
              <Shield size={10} />
              {permLevel.label}
            </span>
          )}
        </div>
      </div>
    );
  };

  const StaffSection = ({ title, members, color = 'slate' }) => {
    if (members.length === 0) return null;

    const colorClasses = {
      red: 'border-red-500/30 bg-red-500/5',
      blue: 'border-blue-500/30 bg-blue-500/5',
      purple: 'border-purple-500/30 bg-purple-500/5',
      slate: 'border-slate-700 bg-slate-800/30',
      amber: 'border-amber-500/30 bg-amber-500/5'
    };

    return (
      <div className={`rounded-lg border p-4 mb-6 ${colorClasses[color] || colorClasses.slate}`}>
        <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(member => (
            <StaffCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    );
  };

  const saveStaff = async () => {
    if (!editingStaff.name) return;

    // For new staff members, email is required for coach access flow
    const isNew = !staff.find(s => s.id === editingStaff.id);
    if (isNew && !editingStaff.email) {
      alert('Email is required for new staff members so they can access the app.');
      return;
    }

    const exists = staff.find(s => s.id === editingStaff.id);
    let newStaff;

    if (exists) {
      newStaff = staff.map(s => s.id === editingStaff.id ? editingStaff : s);
    } else {
      newStaff = [...staff, editingStaff];
    }

    // If adding a new staff member with an email, also add to memberList
    if (isNew && editingStaff.email && school) {
      const email = editingStaff.email.toLowerCase();
      const currentMemberList = school.memberList || [];

      // Only add if not already in memberList
      if (!currentMemberList.some(m =>
        (typeof m === 'string' ? m : m.email)?.toLowerCase() === email
      )) {
        const newMemberList = [...currentMemberList, email];
        // Update both staff and memberList together
        await updateSchool({
          staff: newStaff,
          memberList: newMemberList
        });
        setShowEditor(false);
        setEditingStaff(null);
        return;
      }
    }

    updateStaff(newStaff);
    setShowEditor(false);
    setEditingStaff(null);
  };

  const deleteStaff = async (staffId) => {
    if (!confirm('Remove this staff member? They will lose access to the app.')) return;

    const memberToRemove = staff.find(s => s.id === staffId);
    const newStaff = staff.filter(s => s.id !== staffId);

    // Also remove from memberList if they have an email
    if (memberToRemove?.email && school) {
      const emailToRemove = memberToRemove.email.toLowerCase();
      const currentMemberList = school.memberList || [];
      const newMemberList = currentMemberList.filter(m =>
        (typeof m === 'string' ? m : m.email)?.toLowerCase() !== emailToRemove
      );

      // Update both staff and memberList together
      await updateSchool({
        staff: newStaff,
        memberList: newMemberList
      });
      return;
    }

    updateStaff(newStaff);
  };

  return (
    <div>
      {/* Filters */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="staff-search"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or title..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            />
          </div>

          <select
            id="staff-filter-role"
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          >
            <option value="all">All Roles</option>
            {STAFF_ROLES.map(role => (
              <option key={role.id} value={role.id}>{role.label}</option>
            ))}
          </select>

          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
          >
            <Plus size={18} />
            Add Staff
          </button>
        </div>
      </div>

      {/* Staff Hierarchy */}
      {staff.length === 0 ? (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
          <Users size={48} className="mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">No Staff Members</h3>
          <p className="text-slate-400 mb-4">Add your coaching staff to get started</p>
          <button
            onClick={() => openEditor()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
          >
            <Plus size={18} />
            Add Staff Member
          </button>
        </div>
      ) : (
        <div>
          <StaffSection title="Head Coach" members={staffHierarchy.headCoach} color="red" />
          <StaffSection title="Coordinators" members={staffHierarchy.coordinators} color="blue" />
          <StaffSection title="Position Coaches" members={staffHierarchy.positionCoaches} color="purple" />
          <StaffSection title="Support Staff" members={staffHierarchy.otherVarsity} color="slate" />

          {programLevels.map(level => (
            <StaffSection
              key={level.id}
              title={`${level.name} Staff`}
              members={staffHierarchy.levels[level.id]?.staff || []}
              color="amber"
            />
          ))}

          {staffHierarchy.headCoach.length === 0 &&
           staffHierarchy.coordinators.length === 0 &&
           staffHierarchy.positionCoaches.length === 0 &&
           staffHierarchy.otherVarsity.length === 0 &&
           Object.values(staffHierarchy.levels).every(l => l.staff.length === 0) && (
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-8 text-center">
              <p className="text-slate-400">No staff members match your search criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Staff Editor Modal */}
      {showEditor && editingStaff && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {staff.find(s => s.id === editingStaff.id) ? 'Edit Staff Member' : 'Add Staff Member'}
              </h3>
              <button
                onClick={() => { setShowEditor(false); setEditingStaff(null); }}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="staff-name" className="text-sm text-slate-400 block mb-1">Name *</label>
                <input
                  id="staff-name"
                  type="text"
                  value={editingStaff.name}
                  onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  placeholder="Coach name"
                />
              </div>

              <div>
                <label htmlFor="staff-title" className="text-sm text-slate-400 block mb-1">Title</label>
                <input
                  id="staff-title"
                  type="text"
                  value={editingStaff.title || ''}
                  onChange={e => setEditingStaff({ ...editingStaff, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  placeholder="e.g. Wide Receivers Coach"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="staff-role" className="text-sm text-slate-400 block mb-1">Role</label>
                  <select
                    id="staff-role"
                    value={editingStaff.role}
                    onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    {STAFF_ROLES.map(r => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="staff-permission-level" className="text-sm text-slate-400 block mb-1">Permission Level</label>
                  <select
                    id="staff-permission-level"
                    value={editingStaff.permissionLevel}
                    onChange={e => setEditingStaff({ ...editingStaff, permissionLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    {PERMISSION_LEVELS.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Position Groups</label>
                  {allPositionGroups.length > 0 ? (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 max-h-40 overflow-y-auto">
                      {['OFFENSE', 'DEFENSE', 'SPECIAL_TEAMS'].map(phase => {
                        const phaseGroups = allPositionGroups.filter(g => g.phase === phase);
                        if (phaseGroups.length === 0) return null;
                        const phaseLabel = phase === 'SPECIAL_TEAMS' ? 'Special Teams' : phase.charAt(0) + phase.slice(1).toLowerCase();
                        // Get current selections (support both old string and new array format)
                        const currentSelections = editingStaff.positionGroups || (editingStaff.positionGroup ? [editingStaff.positionGroup] : []);
                        return (
                          <div key={phase} className="mb-2 last:mb-0">
                            <div className="text-xs text-slate-500 font-medium mb-1">{phaseLabel}</div>
                            <div className="space-y-1">
                              {phaseGroups.map(group => {
                                const isSelected = currentSelections.includes(group.name);
                                return (
                                  <label
                                    key={group.id}
                                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-700/50 px-2 py-1 rounded"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        const newSelections = e.target.checked
                                          ? [...currentSelections, group.name]
                                          : currentSelections.filter(g => g !== group.name);
                                        setEditingStaff({ ...editingStaff, positionGroups: newSelections, positionGroup: '' });
                                      }}
                                      className="rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500"
                                    />
                                    <span className="text-sm text-white">{group.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={(editingStaff.positionGroups || []).join(', ') || editingStaff.positionGroup || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, positionGroups: e.target.value.split(',').map(s => s.trim()).filter(Boolean), positionGroup: '' })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      placeholder="e.g. Wide Receivers, Tight Ends"
                    />
                  )}
                </div>

                <div>
                  <label htmlFor="staff-program-level" className="text-sm text-slate-400 block mb-1">Program Level</label>
                  <select
                    id="staff-program-level"
                    value={editingStaff.levelId || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, levelId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="">Varsity (Main Staff)</option>
                    {programLevels.map(level => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="staff-email" className="text-sm text-slate-400 block mb-1">
                    Email {!staff.find(s => s.id === editingStaff?.id) && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    id="staff-email"
                    type="email"
                    value={editingStaff.email || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="coach@school.edu"
                    required={!staff.find(s => s.id === editingStaff?.id)}
                  />
                  {!staff.find(s => s.id === editingStaff?.id) && (
                    <p className="text-xs text-slate-500 mt-1">
                      Required for app access. Use their Google account email.
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="staff-phone" className="text-sm text-slate-400 block mb-1">Phone</label>
                  <input
                    id="staff-phone"
                    type="tel"
                    value={editingStaff.phone || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="staff-notes" className="text-sm text-slate-400 block mb-1">Notes</label>
                <textarea
                  id="staff-notes"
                  value={editingStaff.notes || ''}
                  onChange={e => setEditingStaff({ ...editingStaff, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-slate-800">
              <button
                onClick={() => { setShowEditor(false); setEditingStaff(null); }}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={saveStaff}
                disabled={!editingStaff.name || (!staff.find(s => s.id === editingStaff?.id) && !editingStaff.email)}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info box for school admins */}
      {isSchoolAdmin && (
        <div className="mt-6 p-4 bg-sky-500/10 border border-sky-500/30 rounded-lg">
          <h4 className="font-medium text-sky-400 mb-2">Adding Coaches</h4>
          <p className="text-sm text-slate-400">
            As a school admin, when you add a staff member with their Google email address,
            they'll be able to sign in to DoFO and automatically access your school's data.
            Make sure to use the email address associated with their Google account.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// PERMISSIONS TAB COMPONENT
// ============================================
function PermissionsTab() {
  const { staff, updateStaff } = useSchool();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [saving, setSaving] = useState(false);

  const filteredStaff = useMemo(() => {
    if (!searchTerm) return staff;
    const search = searchTerm.toLowerCase();
    return staff.filter(s =>
      s.name?.toLowerCase().includes(search) ||
      s.email?.toLowerCase().includes(search)
    );
  }, [staff, searchTerm]);

  const getMemberPermissions = (member) => {
    return member?.permissions || [];
  };

  const hasPermission = (member, permissionId) => {
    return getMemberPermissions(member).includes(permissionId);
  };

  const togglePermission = (permissionId) => {
    if (!selectedMember) return;

    const currentPerms = getMemberPermissions(selectedMember);
    let newPerms;

    if (currentPerms.includes(permissionId)) {
      newPerms = currentPerms.filter(p => p !== permissionId);
    } else {
      newPerms = [...currentPerms, permissionId];
    }

    setSelectedMember({ ...selectedMember, permissions: newPerms });
  };

  const applyPreset = (presetId) => {
    if (!selectedMember) return;
    const preset = ROLE_PRESETS[presetId];
    if (preset) {
      setSelectedMember({ ...selectedMember, permissions: [...preset.permissions] });
    }
  };

  const savePermissions = async () => {
    if (!selectedMember) return;

    setSaving(true);
    try {
      const newStaff = staff.map(s =>
        s.id === selectedMember.id ? { ...s, permissions: selectedMember.permissions } : s
      );
      await updateStaff(newStaff);
    } catch (err) {
      console.error('Error saving permissions:', err);
    }
    setSaving(false);
  };

  return (
    <div className="flex gap-6">
      {/* Staff List */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="permissions-search"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search staff..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            />
          </div>

          {filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users size={32} className="mx-auto mb-2" />
              <p>No staff members</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStaff.map(member => {
                const permCount = getMemberPermissions(member).length;
                const isSelected = selectedMember?.id === member.id;

                return (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember({ ...member })}
                    className={`w-full p-3 rounded-lg text-left ${
                      isSelected
                        ? 'bg-sky-500/20 border border-sky-500'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    <div className="font-medium text-white">{member.name}</div>
                    <div className="text-sm text-slate-400">{member.title || member.role}</div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                      <Shield size={10} />
                      {permCount} permission{permCount !== 1 ? 's' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Permissions Editor */}
      <div className="flex-1">
        {!selectedMember ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
            <Shield size={48} className="mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold text-white mb-2">Select a Staff Member</h3>
            <p className="text-slate-400">Choose someone from the list to manage their permissions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Member Header */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedMember.name}</h2>
                  <p className="text-slate-400">{selectedMember.title || selectedMember.role}</p>
                </div>
                <button
                  onClick={savePermissions}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {/* Role Presets */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-400 mb-2">Quick Apply Role:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ROLE_PRESETS).map(([id, preset]) => (
                    <button
                      key={id}
                      onClick={() => applyPreset(id)}
                      className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm hover:bg-slate-700"
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Permission Categories */}
            {PERMISSION_CATEGORIES.map(category => (
              <div
                key={category.id}
                className="bg-slate-900 rounded-lg border border-slate-800 p-4"
              >
                <h3 className="font-semibold text-white mb-3">{category.label}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {category.permissions.map(permission => {
                    const enabled = hasPermission(selectedMember, permission.id);

                    return (
                      <button
                        key={permission.id}
                        onClick={() => togglePermission(permission.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg text-left ${
                          enabled
                            ? 'bg-green-500/20 border border-green-500'
                            : 'bg-slate-800 hover:bg-slate-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          enabled ? 'bg-green-500' : 'bg-slate-700'
                        }`}>
                          {enabled && <Check size={14} className="text-white" />}
                        </div>
                        <span className={enabled ? 'text-green-400' : 'text-slate-300'}>
                          {permission.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Info */}
            <div className="bg-slate-800/50 rounded-lg p-4 flex items-start gap-3">
              <Info size={18} className="text-slate-400 mt-0.5" />
              <div className="text-sm text-slate-400">
                <p>Changes take effect immediately after saving. Staff members may need to refresh their browser to see updated permissions.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// ROSTER TAB COMPONENT
// ============================================
function RosterTab() {
  const { roster, updateRoster } = useSchool();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [sortBy, setSortBy] = useState('number');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [showEditor, setShowEditor] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  const allPositions = useMemo(() => {
    const positions = new Set();
    roster.forEach(p => p.position && positions.add(p.position));
    return ['all', ...Array.from(positions).sort()];
  }, [roster]);

  const filteredRoster = useMemo(() => {
    let filtered = roster.filter(p => {
      // Exclude archived players
      if (p.archived) return false;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matches =
          p.name?.toLowerCase().includes(search) ||
          p.number?.toString().includes(search) ||
          p.position?.toLowerCase().includes(search);
        if (!matches) return false;
      }

      if (filterPosition !== 'all' && p.position !== filterPosition) return false;
      if (filterYear !== 'all' && p.year !== filterYear) return false;

      return true;
    });

    filtered.sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';

      if (sortBy === 'number') {
        aVal = parseInt(aVal) || 999;
        bVal = parseInt(bVal) || 999;
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [roster, searchTerm, filterPosition, filterYear, sortBy, sortDir]);

  const stats = useMemo(() => {
    const active = roster.filter(p => !p.archived);
    const archived = roster.filter(p => p.archived);
    return { active: active.length, archived: archived.length, total: roster.length };
  }, [roster]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const togglePlayerSelection = (playerId) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedPlayers.size === filteredRoster.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(filteredRoster.map(p => p.id)));
    }
  };

  const openEditor = (player = null) => {
    setEditingPlayer(player || {
      id: `player_${Date.now()}`,
      name: '',
      number: '',
      position: '',
      year: '',
      height: '',
      weight: '',
      email: '',
      phone: '',
      notes: ''
    });
    setShowEditor(true);
  };

  const savePlayer = () => {
    if (!editingPlayer.name) return;

    const exists = roster.find(p => p.id === editingPlayer.id);
    let newRoster;

    if (exists) {
      newRoster = roster.map(p => p.id === editingPlayer.id ? editingPlayer : p);
    } else {
      newRoster = [...roster, editingPlayer];
    }

    updateRoster(newRoster);
    setShowEditor(false);
    setEditingPlayer(null);
  };

  const deleteSelected = () => {
    if (selectedPlayers.size === 0) return;
    if (!confirm(`Delete ${selectedPlayers.size} player(s)?`)) return;

    const newRoster = roster.filter(p => !selectedPlayers.has(p.id));
    updateRoster(newRoster);
    setSelectedPlayers(new Set());
  };

  const archiveSelected = () => {
    if (selectedPlayers.size === 0) return;

    const newRoster = roster.map(p => {
      if (selectedPlayers.has(p.id)) {
        return { ...p, archived: true };
      }
      return p;
    });

    updateRoster(newRoster);
    setSelectedPlayers(new Set());
  };

  return (
    <div>
      {/* Filters */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="roster-search"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, number, position..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            />
          </div>

          <select
            id="roster-filter-position"
            value={filterPosition}
            onChange={e => setFilterPosition(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          >
            {allPositions.map(pos => (
              <option key={pos} value={pos}>
                {pos === 'all' ? 'All Positions' : pos}
              </option>
            ))}
          </select>

          <select
            id="roster-filter-year"
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          >
            <option value="all">All Years</option>
            {YEARS.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
          >
            <Plus size={18} />
            Add Player
          </button>
        </div>

        {/* Bulk actions */}
        {selectedPlayers.size > 0 && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800">
            <span className="text-slate-400">{selectedPlayers.size} selected</span>
            <button
              onClick={archiveSelected}
              className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30"
            >
              <ArchiveIcon size={14} />
              Archive
            </button>
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button
              onClick={() => setSelectedPlayers(new Set())}
              className="text-slate-500 hover:text-white ml-auto"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mb-4 text-sm text-slate-400">
        {stats.active} active players • {stats.archived} archived
      </div>

      {/* Roster Table */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800">
              <th className="px-4 py-3 text-left">
                <input
                  id="roster-select-all"
                  type="checkbox"
                  checked={selectedPlayers.size === filteredRoster.length && filteredRoster.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-sky-500"
                  aria-label="Select all players"
                />
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-slate-400 cursor-pointer hover:text-white"
                onClick={() => toggleSort('number')}
              >
                # {sortBy === 'number' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-slate-400 cursor-pointer hover:text-white"
                onClick={() => toggleSort('name')}
              >
                Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-slate-400 cursor-pointer hover:text-white"
                onClick={() => toggleSort('position')}
              >
                Position {sortBy === 'position' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-slate-400 cursor-pointer hover:text-white"
                onClick={() => toggleSort('year')}
              >
                Year {sortBy === 'year' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Height</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Weight</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoster.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center">
                  <Users size={32} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-slate-500">No players found</p>
                </td>
              </tr>
            ) : (
              filteredRoster.map((player, idx) => (
                <tr
                  key={player.id}
                  className={`${idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'} hover:bg-slate-800/50`}
                >
                  <td className="px-4 py-3">
                    <input
                      id={`roster-player-${player.id}`}
                      type="checkbox"
                      checked={selectedPlayers.has(player.id)}
                      onChange={() => togglePlayerSelection(player.id)}
                      className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-sky-500"
                      aria-label={`Select ${player.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sky-400 font-bold">{player.number || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-white">{player.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{player.position || '-'}</td>
                  <td className="px-4 py-3 text-slate-300">{player.year || '-'}</td>
                  <td className="px-4 py-3 text-slate-300">{player.height || '-'}</td>
                  <td className="px-4 py-3 text-slate-300">{player.weight || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEditor(player)}
                      className="p-2 text-slate-400 hover:text-white"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Player Editor Modal */}
      {showEditor && editingPlayer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {roster.find(p => p.id === editingPlayer.id) ? 'Edit Player' : 'Add Player'}
              </h3>
              <button
                onClick={() => { setShowEditor(false); setEditingPlayer(null); }}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="player-name" className="text-sm text-slate-400 block mb-1">Name *</label>
                  <input
                    id="player-name"
                    type="text"
                    value={editingPlayer.name}
                    onChange={e => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="Player name"
                  />
                </div>
                <div>
                  <label htmlFor="player-number" className="text-sm text-slate-400 block mb-1">Number</label>
                  <input
                    id="player-number"
                    type="text"
                    value={editingPlayer.number}
                    onChange={e => setEditingPlayer({ ...editingPlayer, number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="Jersey #"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="player-position" className="text-sm text-slate-400 block mb-1">Position</label>
                  <input
                    id="player-position"
                    type="text"
                    value={editingPlayer.position}
                    onChange={e => setEditingPlayer({ ...editingPlayer, position: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="QB, WR, etc."
                  />
                </div>
                <div>
                  <label htmlFor="player-year" className="text-sm text-slate-400 block mb-1">Year</label>
                  <select
                    id="player-year"
                    value={editingPlayer.year}
                    onChange={e => setEditingPlayer({ ...editingPlayer, year: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="">Select Year</option>
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="player-height" className="text-sm text-slate-400 block mb-1">Height</label>
                  <input
                    id="player-height"
                    type="text"
                    value={editingPlayer.height}
                    onChange={e => setEditingPlayer({ ...editingPlayer, height: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="6'2&quot;"
                  />
                </div>
                <div>
                  <label htmlFor="player-weight" className="text-sm text-slate-400 block mb-1">Weight</label>
                  <input
                    id="player-weight"
                    type="text"
                    value={editingPlayer.weight}
                    onChange={e => setEditingPlayer({ ...editingPlayer, weight: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="185 lbs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="player-email" className="text-sm text-slate-400 block mb-1">Email</label>
                <input
                  id="player-email"
                  type="email"
                  value={editingPlayer.email || ''}
                  onChange={e => setEditingPlayer({ ...editingPlayer, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  placeholder="player@school.edu"
                />
              </div>

              <div>
                <label htmlFor="player-notes" className="text-sm text-slate-400 block mb-1">Notes</label>
                <textarea
                  id="player-notes"
                  value={editingPlayer.notes || ''}
                  onChange={e => setEditingPlayer({ ...editingPlayer, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-slate-800">
              <button
                onClick={() => { setShowEditor(false); setEditingPlayer(null); }}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={savePlayer}
                disabled={!editingPlayer.name}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// ARCHIVE TAB COMPONENT
// ============================================
function ArchiveTab() {
  const { roster, plays, updateRoster, updatePlays } = useSchool();

  const [archiveType, setArchiveType] = useState('players');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());

  const archivedPlayers = useMemo(() => {
    return roster.filter(p => p.archived);
  }, [roster]);

  const archivedPlays = useMemo(() => {
    return plays.filter(p => p.archived);
  }, [plays]);

  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return archivedPlayers;
    const search = searchTerm.toLowerCase();
    return archivedPlayers.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.number?.toString().includes(search) ||
      p.position?.toLowerCase().includes(search)
    );
  }, [archivedPlayers, searchTerm]);

  const filteredPlays = useMemo(() => {
    if (!searchTerm) return archivedPlays;
    const search = searchTerm.toLowerCase();
    return archivedPlays.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.formation?.toLowerCase().includes(search)
    );
  }, [archivedPlays, searchTerm]);

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const restorePlayer = (playerId) => {
    const newRoster = roster.map(p =>
      p.id === playerId ? { ...p, archived: false } : p
    );
    updateRoster(newRoster);
  };

  const restorePlay = (playId) => {
    const newPlays = plays.map(p =>
      p.id === playId ? { ...p, archived: false } : p
    );
    updatePlays(newPlays);
  };

  const deletePlayer = (playerId) => {
    if (!confirm('Permanently delete this player? This cannot be undone.')) return;
    const newRoster = roster.filter(p => p.id !== playerId);
    updateRoster(newRoster);
  };

  const deletePlay = (playId) => {
    if (!confirm('Permanently delete this play? This cannot be undone.')) return;
    const newPlays = plays.filter(p => p.id !== playId);
    updatePlays(newPlays);
  };

  const bulkRestore = () => {
    if (selectedItems.size === 0) return;

    if (archiveType === 'players') {
      const newRoster = roster.map(p =>
        selectedItems.has(p.id) ? { ...p, archived: false } : p
      );
      updateRoster(newRoster);
    } else {
      const newPlays = plays.map(p =>
        selectedItems.has(p.id) ? { ...p, archived: false } : p
      );
      updatePlays(newPlays);
    }

    setSelectedItems(new Set());
  };

  const bulkDelete = () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Permanently delete ${selectedItems.size} item(s)? This cannot be undone.`)) return;

    if (archiveType === 'players') {
      const newRoster = roster.filter(p => !selectedItems.has(p.id));
      updateRoster(newRoster);
    } else {
      const newPlays = plays.filter(p => !selectedItems.has(p.id));
      updatePlays(newPlays);
    }

    setSelectedItems(new Set());
  };

  const currentItems = archiveType === 'players' ? filteredPlayers : filteredPlays;

  const ARCHIVE_TABS = [
    { id: 'players', label: 'Players', icon: Users },
    { id: 'plays', label: 'Plays', icon: Play }
  ];

  return (
    <div>
      {/* Archive type tabs */}
      <div className="flex gap-2 mb-6">
        {ARCHIVE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setArchiveType(tab.id); setSelectedItems(new Set()); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              archiveType === tab.id
                ? 'bg-sky-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-300">
              {tab.id === 'players' ? archivedPlayers.length : archivedPlays.length}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Actions */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="archive-search"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={`Search archived ${archiveType}...`}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            />
          </div>

          {selectedItems.size > 0 && (
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-slate-400">{selectedItems.size} selected</span>
              <button
                onClick={bulkRestore}
                className="flex items-center gap-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
              >
                <RotateCcw size={16} />
                Restore
              </button>
              <button
                onClick={bulkDelete}
                className="flex items-center gap-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {currentItems.length === 0 ? (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
          <ArchiveIcon size={48} className="mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">No Archived {archiveType === 'players' ? 'Players' : 'Plays'}</h3>
          <p className="text-slate-400">
            {archiveType === 'players'
              ? 'Archived players will appear here'
              : 'Archived plays will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800">
                <th className="px-4 py-3 text-left w-12">
                  <input
                    id="archive-select-all"
                    type="checkbox"
                    checked={selectedItems.size === currentItems.length && currentItems.length > 0}
                    onChange={() => {
                      if (selectedItems.size === currentItems.length) {
                        setSelectedItems(new Set());
                      } else {
                        setSelectedItems(new Set(currentItems.map(i => i.id)));
                      }
                    }}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-sky-500"
                    aria-label="Select all archived items"
                  />
                </th>
                {archiveType === 'players' ? (
                  <>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Position</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Year</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Play Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Formation</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Phase</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400">Category</th>
                  </>
                )}
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, idx) => (
                <tr
                  key={item.id}
                  className={idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'}
                >
                  <td className="px-4 py-3">
                    <input
                      id={`archive-item-${item.id}`}
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-sky-500"
                      aria-label={`Select ${item.name}`}
                    />
                  </td>
                  {archiveType === 'players' ? (
                    <>
                      <td className="px-4 py-3 text-sky-400 font-bold">{item.number || '-'}</td>
                      <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-slate-300">{item.position || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{item.year || '-'}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-slate-300">{item.formation || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.phase === 'offense' ? 'bg-blue-500/20 text-blue-400' :
                          item.phase === 'defense' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {item.phase || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{item.bucket || '-'}</td>
                    </>
                  )}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => archiveType === 'players' ? restorePlayer(item.id) : restorePlay(item.id)}
                        className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg"
                        title="Restore"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={() => archiveType === 'players' ? deletePlayer(item.id) : deletePlay(item.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                        title="Delete permanently"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN STAFF PAGE COMPONENT
// ============================================
export default function Staff() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { staff, roster, school } = useSchool();
  const { user } = useAuth();
  const [codeCopied, setCodeCopied] = useState(false);

  // Check if current user is a school admin
  const currentUserStaff = staff.find(s => s.email?.toLowerCase() === user?.email?.toLowerCase());
  const isSchoolAdmin = currentUserStaff?.isSchoolAdmin || currentUserStaff?.permissionLevel === 'admin';

  // Default to 'staff' tab if no tab specified
  const activeTab = tab || 'staff';

  // Handle tab change
  const handleTabChange = (newTab) => {
    navigate(`/staff/${newTab}`);
  };

  // Render appropriate tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'staff':
        return <StaffTab />;
      case 'permissions':
        return <PermissionsTab />;
      case 'roster':
        return <RosterTab />;
      case 'archive':
        return <ArchiveTab />;
      default:
        return <StaffTab />;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Staff & Roster</h1>
        <p className="text-slate-400">
          {staff.length} staff member{staff.length !== 1 ? 's' : ''} • {roster.filter(p => !p.archived).length} active players
        </p>
      </div>

      {/* Join Code Section - Only visible to school admins */}
      {isSchoolAdmin && school?.joinCode && (
        <div className="mb-6 p-4 bg-gradient-to-r from-sky-500/10 to-sky-500/5 border border-sky-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-500/20 rounded-lg">
                <Key size={20} className="text-sky-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Invite coaches to join your team</p>
                <p className="text-lg font-mono font-bold text-white tracking-widest">{school.joinCode}</p>
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(school.joinCode);
                setCodeCopied(true);
                setTimeout(() => setCodeCopied(false), 2000);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                codeCopied
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
              }`}
            >
              {codeCopied ? <Check size={16} /> : <Copy size={16} />}
              {codeCopied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Share this code with assistant coaches. They can use it to join when signing up at digitaldofo.com
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-slate-900 rounded-lg p-1 border border-slate-800">
        {TABS.map(tabDef => (
          <button
            key={tabDef.id}
            onClick={() => handleTabChange(tabDef.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tabDef.id
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <tabDef.icon size={16} />
            {tabDef.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}
