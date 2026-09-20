import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AcademicClass, Student } from '../types';
import {
  GraduationCap,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  ArrowRight,
  Sparkles,
  BookOpen,
  Users
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, isSuperAdmin, isPrincipal, assignedClassId } = useAuth();
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [clsData, studData] = await Promise.all([
          api.classes.getAll(),
          api.students.getAll(
            user?.role === 'CLASS_TEACHER' && assignedClassId()
              ? { class_id: assignedClassId()! }
              : undefined
          ),
        ]);
        setClasses(clsData);
        setStudents(studData);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  const assignedClass = classes.find((c) => c.id === assignedClassId());
  const totalStudents = students.length;
  const completedCount = students.filter((s) => s.completion_status === 'COMPLETE').length;
  const inProgressCount = students.filter((s) => s.completion_status === 'IN_PROGRESS').length;
  const pendingCount = students.filter((s) => s.completion_status === 'PENDING').length;
  const passedCount = students.filter((s) => s.pass_fail_status === 'PASS').length;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
                {user?.role === 'SUPER_ADMIN'
                  ? 'Super Administrator'
                  : user?.role === 'PRINCIPAL'
                  ? 'Principal Portal'
                  : `Class Teacher — ${assignedClass?.name || 'Assigned Class'}`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome, {user?.full_name}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              New Sunshine Public School • Academic Session 2026-27 Result Management Portal. Manage marks entry, view calculations, and generate A4 report cards.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('marks-entry')}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Enter Marks</span>
            </button>
            <button
              onClick={() => onNavigate('results')}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl border border-slate-700 transition-all active:scale-95"
            >
              <Award className="w-4 h-4" />
              <span>View Results</span>
            </button>
          </div>
        </div>

        {/* Background glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Total Students */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {user?.role === 'CLASS_TEACHER' ? 'My Class Students' : 'Total Students'}
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{totalStudents}</h3>
          </div>
        </div>

        {/* Completed Marks */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Marks Completed
            </p>
            <h3 className="text-2xl font-black text-emerald-700 mt-0.5">{completedCount}</h3>
          </div>
        </div>

        {/* In Progress */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              In Progress
            </p>
            <h3 className="text-2xl font-black text-amber-700 mt-0.5">{inProgressCount}</h3>
          </div>
        </div>

        {/* Pending Marks */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Entries
            </p>
            <h3 className="text-2xl font-black text-rose-700 mt-0.5">{pendingCount}</h3>
          </div>
        </div>

      </div>

      {/* Class Overview Cards for Admins or Class Teacher Details */}
      {(isSuperAdmin() || isPrincipal()) ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              Class-wise Status Overview
            </h2>
            <button
              onClick={() => onNavigate('all-results')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>View All Classes Detailed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all hover:border-amber-400 group cursor-pointer"
                onClick={() => onNavigate('marks-entry', { classId: cls.id })}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                      Class
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">Class {cls.name}</h3>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-50 group-hover:bg-amber-500 text-amber-600 group-hover:text-slate-950 flex items-center justify-center transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Assigned Teacher:</span>
                    <span className="font-semibold text-slate-900">
                      {cls.assigned_teacher?.full_name || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subjects:</span>
                    <span className="font-semibold text-slate-900">{cls.subjects.length} Subjects</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enrolled Students:</span>
                    <span className="font-bold text-slate-900">{cls.students_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Teacher Assigned Class Detail Card */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900">My Class Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 uppercase font-semibold">Assigned Class</span>
              <p className="text-lg font-bold text-slate-900 mt-1">Class {assignedClass?.name || 'N/A'}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 uppercase font-semibold">Curriculum Subjects</span>
              <p className="text-lg font-bold text-slate-900 mt-1">{assignedClass?.subjects.length || 0} Subjects</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 uppercase font-semibold">Passed Count</span>
              <p className="text-lg font-bold text-emerald-700 mt-1">{passedCount} / {totalStudents}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Banner */}
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950">Next Action: Marks Evaluation & Report Cards</h4>
            <p className="text-xs text-amber-800">
              Complete Half-Yearly and Annual exam entries to finalize student results.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('marks-entry')}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
        >
          Open Marks Entry
        </button>
      </div>

    </div>
  );
};
