import React from 'react';
import { Menu, Bell, Calendar, Sparkles, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopNavProps {
  onOpenMobileMenu: () => void;
  pageTitle: string;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenMobileMenu, pageTitle }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            New Sunshine Public School • Indore (M.P.)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Academic Session Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-amber-600" />
          <span>Session 2026-27</span>
        </div>

        {/* User Scope Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
          <Shield className="w-3.5 h-3.5 text-slate-500" />
          <span>
            {user?.role === 'SUPER_ADMIN'
              ? 'Full System Authority'
              : user?.role === 'PRINCIPAL'
              ? 'Principal Authority'
              : `Assigned: Class ${user?.teacher_profile?.assigned_class_name || 'N/A'}`}
          </span>
        </div>
      </div>
    </header>
  );
};
