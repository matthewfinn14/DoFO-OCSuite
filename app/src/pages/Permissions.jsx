import { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  Shield,
  Users,
  Check,
  X,
  Search,
  Save,
  Info
} from 'lucide-react';

// Permission categories
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

export default function Permissions() {
  const { staff, updateStaff } = useSchool();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [saving, setSaving] = useState(false);

  // Filter staff
  const filteredStaff = useMemo(() => {
    if (!searchTerm) return staff;
    const search = searchTerm.toLowerCase();
    return staff.filter(s =>
      s.name?.toLowerCase().includes(search) ||
      s.email?.toLowerCase().includes(search)
    );
  }, [staff, searchTerm]);

  // Get member permissions
  const getMemberPermissions = (member) => {
    return member?.permissions || [];
  };

  // Check if member has permission
  const hasPermission = (member, permissionId) => {
    return getMemberPermissions(member).includes(permissionId);
  };

  // Toggle permission
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

  // Apply role preset
  const applyPreset = (presetId) => {
    if (!selectedMember) return;
    const preset = ROLE_PRESETS[presetId];
    if (preset) {
      setSelectedMember({ ...selectedMember, permissions: [...preset.permissions] });
    }
  };

  // Save permissions
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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Permissions</h1>
          <p className="text-slate-400">Manage staff access levels</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Staff List */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
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
    </div>
  );
}
