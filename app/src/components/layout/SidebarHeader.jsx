import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import SchoolSwitcher from './SchoolSwitcher';

export default function SidebarHeader({ collapsed, onToggleCollapse, theme = 'dark' }) {
  const { school, activeYear, globalWeekTemplates, setCurrentWeekId } = useSchool();

  const handleLoadWeekFromTemplate = (templateId) => {
    // This would be implemented to load a week template
    console.log('Loading week template:', templateId);
  };

  return (
    <div className="p-4 border-b border-slate-800">
      {/* Logo row with collapse toggle */}
      <div className="flex items-center justify-between mb-4">
        {!collapsed ? (
          <img
            src={theme === 'light' ? '/DoFO dark, transparent.png' : '/DoFO - White logo transparent bckgrnd.png'}
            alt="DoFO"
            className="w-[85%] max-w-[200px]"
          />
        ) : (
          <div />
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-full bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white flex-shrink-0 border border-slate-600 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {!collapsed && (
        <>

          {/* School Name and Logo */}
          {school?.name && (
            <div className="mb-4 flex flex-col gap-2">
              <h2 className="text-lg font-bold text-white leading-tight">
                {school.name}
              </h2>
              {school.settings?.teamLogo && (
                <img
                  src={school.settings.teamLogo}
                  alt="School Logo"
                  className="max-h-[60px] max-w-full object-contain rounded self-start"
                />
              )}
            </div>
          )}

          {/* School Switcher */}
          <div className="mb-4">
            <SchoolSwitcher />
          </div>

          {/* Active Season */}
          <div className="mt-4">
            <span className="text-[0.65rem] text-slate-500 uppercase tracking-wide block mb-0">
              Active Season
            </span>
            <div className="text-lg font-bold text-white tracking-wide">
              {activeYear || new Date().getFullYear()}
            </div>
          </div>

          {/* Week Template Selector */}
          {globalWeekTemplates.length > 0 && (
            <div className="mt-4 flex flex-col gap-1">
              <select
                className="w-full px-2 py-1 text-sm bg-black/10 border border-dashed border-white/20 rounded text-slate-300 focus:outline-none focus:border-sky-500"
                onChange={(e) => {
                  if (e.target.value) {
                    handleLoadWeekFromTemplate(e.target.value);
                    e.target.value = '';
                  }
                }}
                value=""
              >
                <option value="" disabled>Apply Week Template...</option>
                {globalWeekTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  );
}
