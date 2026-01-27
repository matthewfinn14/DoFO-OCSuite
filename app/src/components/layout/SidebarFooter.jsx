import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import {
  Settings,
  Shield,
  Construction,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Footer navigation item
function FooterNavItem({ to, icon: Icon, label, collapsed, danger = false, isLight = false }) {
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
              : isLight
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
  const { settings } = useSchool();
  const isLight = settings?.theme === 'light';
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={`px-2 py-1.5 border-t ${isLight ? 'border-gray-200' : 'border-slate-800'}`}>
      {/* Collapsible header - User info with toggle */}
      {!collapsed && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center justify-between px-1 py-1 rounded transition-colors ${
            isLight ? 'hover:bg-gray-100' : 'hover:bg-slate-800/30'
          }`}
        >
          <div className="text-left">
            <div className={`text-xs truncate max-w-[180px] ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>{user?.email}</div>
            {isSiteAdmin && (
              <span className="text-[0.65rem] text-emerald-400 font-medium">Site Admin</span>
            )}
          </div>
          {expanded ? (
            <ChevronUp size={14} className={isLight ? 'text-gray-400' : 'text-slate-500'} />
          ) : (
            <ChevronDown size={14} className={isLight ? 'text-gray-400' : 'text-slate-500'} />
          )}
        </button>
      )}

      {/* Collapsible Navigation links */}
      {!collapsed && expanded && (
        <div className="flex flex-col gap-0.5 mt-1 mb-1">
          <FooterNavItem
            to="/settings"
            icon={Settings}
            label="Settings"
            collapsed={collapsed}
            isLight={isLight}
          />

          {isSiteAdmin && (
            <FooterNavItem
              to="/admin"
              icon={Shield}
              label="Site Admin"
              collapsed={collapsed}
              isLight={isLight}
            />
          )}

          <FooterNavItem
            to="/roadmap"
            icon={Construction}
            label="Under Construction"
            collapsed={collapsed}
            isLight={isLight}
          />

          <FooterNavItem
            to="/help"
            icon={HelpCircle}
            label="How to Use"
            collapsed={collapsed}
            isLight={isLight}
          />
        </div>
      )}

      {/* Collapsed sidebar - show icons only */}
      {collapsed && (
        <div className="flex flex-col gap-0.5 mb-1">
          <FooterNavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} isLight={isLight} />
          {isSiteAdmin && (
            <FooterNavItem to="/admin" icon={Shield} label="Site Admin" collapsed={collapsed} isLight={isLight} />
          )}
        </div>
      )}

      {/* Logout - always visible */}
      {showLogoutConfirm ? (
        <div className="flex gap-1 mt-1">
          <button
            onClick={handleLogout}
            className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
          >
            Confirm
          </button>
          <button
            onClick={() => setShowLogoutConfirm(false)}
            className={`flex-1 px-2 py-1 rounded text-xs font-medium ${
              isLight
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={`flex items-center gap-2 px-3 py-1 rounded text-red-400/80 hover:text-red-400 transition-colors mt-1 ${
            collapsed ? 'justify-center w-full' : ''
          } ${isLight ? 'hover:bg-red-50' : 'hover:bg-slate-800/50'}`}
        >
          <LogOut size={14} />
          {!collapsed && <span className="text-xs">Log Out</span>}
        </button>
      )}
    </div>
  );
}
