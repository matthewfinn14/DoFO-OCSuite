import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Shield,
  Construction,
  HelpCircle,
  LogOut
} from 'lucide-react';

// Footer navigation item
function FooterNavItem({ to, icon: Icon, label, collapsed, danger = false }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
          collapsed ? 'justify-center' : ''
        } ${
          isActive
            ? 'bg-sky-500/20 text-sky-400'
            : danger
              ? 'text-red-400/80 hover:text-red-400 hover:bg-slate-800/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`
      }
    >
      <Icon size={16} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

export default function SidebarFooter({ collapsed }) {
  const { user, logout, isSiteAdmin, isHeadCoach, isTeamAdmin } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="p-4 border-t border-slate-800">
      {/* User info */}
      {!collapsed && (
        <div className="mb-3">
          <div className="text-sm text-slate-400 truncate">{user?.email}</div>
          {isSiteAdmin && (
            <span className="text-xs text-emerald-400 font-medium">Site Admin</span>
          )}
        </div>
      )}

      {/* Navigation links */}
      <div className="flex flex-col gap-1 mb-2">
        <FooterNavItem
          to="/settings"
          icon={Settings}
          label="Settings"
          collapsed={collapsed}
        />

        {isSiteAdmin && (
          <FooterNavItem
            to="/admin"
            icon={Shield}
            label="Site Admin"
            collapsed={collapsed}
          />
        )}

        <FooterNavItem
          to="/roadmap"
          icon={Construction}
          label="Under Construction"
          collapsed={collapsed}
        />

        <FooterNavItem
          to="/help"
          icon={HelpCircle}
          label="How to Use"
          collapsed={collapsed}
        />
      </div>

      {/* Logout */}
      {showLogoutConfirm ? (
        <div className="flex gap-2">
          <button
            onClick={handleLogout}
            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
          >
            Confirm
          </button>
          <button
            onClick={() => setShowLogoutConfirm(false)}
            className="flex-1 px-3 py-2 bg-slate-700 text-slate-300 rounded-md text-sm font-medium hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-red-400/80 hover:text-red-400 hover:bg-slate-800/50 transition-colors ${
            collapsed ? 'justify-center w-full' : ''
          }`}
        >
          <LogOut size={16} />
          {!collapsed && <span className="text-sm">Log Out</span>}
        </button>
      )}
    </div>
  );
}
