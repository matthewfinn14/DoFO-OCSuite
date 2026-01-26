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
        `flex items-center gap-2 px-3 py-1 rounded text-xs transition-colors ${
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
      <Icon size={14} />
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
    <div className="px-2 py-1.5 border-t border-slate-800">
      {/* User info */}
      {!collapsed && (
        <div className="mb-1 px-1">
          <div className="text-xs text-slate-400 truncate">{user?.email}</div>
          {isSiteAdmin && (
            <span className="text-[0.65rem] text-emerald-400 font-medium">Site Admin</span>
          )}
        </div>
      )}

      {/* Navigation links */}
      <div className="flex flex-col gap-0.5 mb-1">
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
        <div className="flex gap-1">
          <button
            onClick={handleLogout}
            className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
          >
            Confirm
          </button>
          <button
            onClick={() => setShowLogoutConfirm(false)}
            className="flex-1 px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs font-medium hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={`flex items-center gap-2 px-3 py-1 rounded text-red-400/80 hover:text-red-400 hover:bg-slate-800/50 transition-colors ${
            collapsed ? 'justify-center w-full' : ''
          }`}
        >
          <LogOut size={14} />
          {!collapsed && <span className="text-xs">Log Out</span>}
        </button>
      )}
    </div>
  );
}
