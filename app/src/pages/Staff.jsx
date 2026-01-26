import { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
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
  ChevronDown
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

// Permission levels
const PERMISSION_LEVELS = [
  { id: 'admin', label: 'Admin', description: 'Full access to all features' },
  { id: 'coordinator', label: 'Coordinator', description: 'Can edit plays and game plans' },
  { id: 'coach', label: 'Coach', description: 'Can view and add notes' },
  { id: 'viewer', label: 'Viewer', description: 'View only access' }
];

export default function Staff() {
  const { staff, updateStaff, setupConfig, programLevels } = useSchool();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Get all position groups from setup config (all phases)
  const allPositionGroups = useMemo(() => {
    const groups = [];
    const positionGroups = setupConfig?.positionGroups || {};

    // Collect from all phases
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
      levels: {} // { levelId: { name, staff: [] } }
    };

    // Initialize levels
    programLevels.forEach(level => {
      hierarchy.levels[level.id] = { name: level.name, staff: [] };
    });

    staff.forEach(member => {
      // Apply search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matches =
          member.name?.toLowerCase().includes(search) ||
          member.email?.toLowerCase().includes(search) ||
          member.title?.toLowerCase().includes(search);
        if (!matches) return;
      }

      // Apply role filter
      if (filterRole !== 'all' && member.role !== filterRole) return;

      // If assigned to a sub-level, put them there
      if (member.levelId && hierarchy.levels[member.levelId]) {
        hierarchy.levels[member.levelId].staff.push(member);
        return;
      }

      // Otherwise, categorize by role
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

  // Get role config
  const getRoleConfig = (roleId) =>
    STAFF_ROLES.find(r => r.id === roleId) || STAFF_ROLES[STAFF_ROLES.length - 1];

  // Open editor
  const openEditor = (member = null) => {
    setEditingStaff(member || {
      id: `staff_${Date.now()}`,
      name: '',
      email: '',
      phone: '',
      title: '',
      role: 'position_coach',
      permissionLevel: 'coach',
      positionGroup: '',
      levelId: '', // Empty = Varsity/Main staff
      notes: ''
    });
    setShowEditor(true);
  };

  // Staff card component
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
          {member.positionGroup && (
            <div className="flex items-center gap-2 text-sm">
              <UserCog size={14} className="text-slate-500" />
              <span className="text-slate-300">{member.positionGroup}</span>
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

  // Section component for hierarchy
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

  // Save staff member
  const saveStaff = () => {
    if (!editingStaff.name) return;

    const exists = staff.find(s => s.id === editingStaff.id);
    let newStaff;

    if (exists) {
      newStaff = staff.map(s => s.id === editingStaff.id ? editingStaff : s);
    } else {
      newStaff = [...staff, editingStaff];
    }

    updateStaff(newStaff);
    setShowEditor(false);
    setEditingStaff(null);
  };

  // Delete staff member
  const deleteStaff = (staffId) => {
    if (!confirm('Remove this staff member?')) return;
    const newStaff = staff.filter(s => s.id !== staffId);
    updateStaff(newStaff);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Coaching Staff</h1>
          <p className="text-slate-400">
            {staff.length} staff member{staff.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
          >
            <Plus size={18} />
            Add Staff
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or title..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            />
          </div>

          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          >
            <option value="all">All Roles</option>
            {STAFF_ROLES.map(role => (
              <option key={role.id} value={role.id}>{role.label}</option>
            ))}
          </select>
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
          {/* Head Coach */}
          <StaffSection
            title="Head Coach"
            members={staffHierarchy.headCoach}
            color="red"
          />

          {/* Coordinators */}
          <StaffSection
            title="Coordinators"
            members={staffHierarchy.coordinators}
            color="blue"
          />

          {/* Position Coaches */}
          <StaffSection
            title="Position Coaches"
            members={staffHierarchy.positionCoaches}
            color="purple"
          />

          {/* Other Varsity Staff */}
          <StaffSection
            title="Support Staff"
            members={staffHierarchy.otherVarsity}
            color="slate"
          />

          {/* Sub-Level Staff */}
          {programLevels.map(level => (
            <StaffSection
              key={level.id}
              title={`${level.name} Staff`}
              members={staffHierarchy.levels[level.id]?.staff || []}
              color="amber"
            />
          ))}

          {/* Show message if filters result in no visible staff */}
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
                <label className="text-sm text-slate-400 block mb-1">Name *</label>
                <input
                  type="text"
                  value={editingStaff.name}
                  onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  placeholder="Coach name"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-1">Title</label>
                <input
                  type="text"
                  value={editingStaff.title || ''}
                  onChange={e => setEditingStaff({ ...editingStaff, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  placeholder="e.g. Wide Receivers Coach"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Role</label>
                  <select
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
                  <label className="text-sm text-slate-400 block mb-1">Permission Level</label>
                  <select
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
                  <label className="text-sm text-slate-400 block mb-1">Position Group</label>
                  {allPositionGroups.length > 0 ? (
                    <select
                      value={editingStaff.positionGroup || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, positionGroup: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="">Select group...</option>
                      {['OFFENSE', 'DEFENSE', 'SPECIAL_TEAMS'].map(phase => {
                        const phaseGroups = allPositionGroups.filter(g => g.phase === phase);
                        if (phaseGroups.length === 0) return null;
                        const phaseLabel = phase === 'SPECIAL_TEAMS' ? 'Special Teams' : phase.charAt(0) + phase.slice(1).toLowerCase();
                        return (
                          <optgroup key={phase} label={phaseLabel}>
                            {phaseGroups.map(group => (
                              <option key={group.id} value={group.name}>
                                {group.name}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editingStaff.positionGroup || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, positionGroup: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      placeholder="e.g. Wide Receivers"
                    />
                  )}
                </div>

                <div>
                  <label className="text-sm text-slate-400 block mb-1">Program Level</label>
                  <select
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
                  <label className="text-sm text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={editingStaff.email || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="coach@school.edu"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingStaff.phone || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-1">Notes</label>
                <textarea
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
                disabled={!editingStaff.name}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
