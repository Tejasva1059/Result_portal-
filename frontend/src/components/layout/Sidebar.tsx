import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileSpreadsheet,
  Award,
  Globe,
  FileText,
  Settings,
  ShieldCheck,
  History,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import schoolLogo from '../../assets/school_logo.png';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, isSuperAdmin, isPrincipal, canViewAllResults, logout } = useAuth();

  const handleNav = (tab: string) => {
    onSelectTab(tab);
    setMobileOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { id: 'students', label: 'Students Directory', icon: GraduationCap, show: true },
    { id: 'marks-entry', label: 'Marks Entry', icon: FileSpreadsheet, show: true },
    { id: 'results', label: user?.role === 'CLASS_TEACHER' ? 'Class Results' : 'Results Management', icon: Award, show: true },
    { id: 'all-results', label: 'All Class Results', icon: Globe, show: canViewAllResults() },
    { id: 'report-cards', label: 'Report Cards & Print', icon: FileText, show: true },
    { id: 'users', label: 'Staff & Teachers', icon: Users, show: isSuperAdmin() || isPrincipal() },
    { id: 'settings', label: 'School Settings', icon: Settings, show: isSuperAdmin() },
    { id: 'audit-logs', label: 'Audit Trail', icon: History, show: isSuperAdmin() || isPrincipal() },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-gradient-to-b from-navy-950 via-navy-900 to-slate-950 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3.5 bg-navy-950/80">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 p-1 flex items-center justify-center shrink-0 shadow-inner">
            <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-base text-white tracking-tight leading-tight truncate">
              NEW SUNSHINE
            </h1>
            <p className="text-xs text-amber-400 font-semibold tracking-wider uppercase truncate">
              Public School
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Indore (Code: 73181)
            </p>
          </div>
        </div>

        {/* User Card */}
        <div className="mx-4 my-4 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center text-sm shadow-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase ${
                    user?.role === 'SUPER_ADMIN'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : user?.role === 'PRINCIPAL'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {user?.role === 'SUPER_ADMIN'
                    ? 'Super Admin'
                    : user?.role === 'PRINCIPAL'
                    ? 'Principal'
                    : `Teacher: ${user?.teacher_profile?.assigned_class_name || ''}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-slate-950 stroke-[2.5]" />}
                </button>
              );
            })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-800 bg-navy-950/80">
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
