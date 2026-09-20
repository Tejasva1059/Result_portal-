import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { AllClassesOverviewItem, ClassResultSummary, ReportCardResponse } from '../types';
import { ReportCardPreviewModal } from '../components/report_card/ReportCardPreviewModal';
import {
  Globe,
  Award,
  BookOpen,
  ArrowRight,
  Lock,
  CheckCircle2,
  FileText,
  Search,
  ChevronLeft,
  Loader2,
  ShieldAlert
} from 'lucide-react';

export const AllResultsPage: React.FC = () => {
  const { user, isSuperAdmin, isPrincipal, canViewAllResults } = useAuth();
  const { success, error } = useToast();

  const [overview, setOverview] = useState<AllClassesOverviewItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classSummary, setClassSummary] = useState<ClassResultSummary | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingClass, setLoadingClass] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Report Card Preview
  const [previewData, setPreviewData] = useState<ReportCardResponse | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoadingOverview(true);
      try {
        const data = await api.results.getAllClassesOverview();
        setOverview(data);
      } catch (err: any) {
        error(err.message || 'Failed to load all class results overview');
      } finally {
        setLoadingOverview(false);
      }
    };
    fetchOverview();
  }, []);

  const handleSelectClass = async (classId: number) => {
    setSelectedClassId(classId);
    setLoadingClass(true);
    try {
      const data = await api.results.getClassResults(classId);
      setClassSummary(data);
    } catch (err: any) {
      error(err.message || 'Failed to load class details');
    } finally {
      setLoadingClass(false);
    }
  };

  const handleOpenReportCard = async (studentId: number) => {
    try {
      const rc = await api.reportCards.getStudentReportCard(studentId);
      setPreviewData(rc);
      setIsPreviewOpen(true);
    } catch (err: any) {
      error(err.message || 'Failed to load report card');
    }
  };

  if (!canViewAllResults()) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          You do not have permission to view all classes' examination results.
        </p>
      </div>
    );
  }

  const activeClassItem = overview.find((o) => o.class_id === selectedClassId);

  const filteredClassResults = (classSummary?.results || []).filter(
    (r) =>
      (r.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.roll_number || '').includes(searchQuery) ||
      (r.scholar_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Globe className="w-7 h-7 text-amber-600" />
            All Class Results Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive overview across all school classes (NUR through Class VII).
          </p>
        </div>

        {user?.role === 'CLASS_TEACHER' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Special View-All Permission (Read-Only on other classes)</span>
          </div>
        )}
      </div>

      {/* Main View: Overview Grid or Selected Class Details */}
      {!selectedClassId ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Select a Class to Inspect
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Total Classes: {overview.length}
            </span>
          </div>

          {loadingOverview ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs">Loading class records...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {overview.map((cls) => {
                const passRate =
                  cls.completed_results > 0
                    ? ((cls.passed_count / cls.completed_results) * 100).toFixed(0)
                    : 0;

                return (
                  <div
                    key={cls.class_id}
                    onClick={() => handleSelectClass(cls.class_id)}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-lg transition-all hover:border-amber-500 group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-navy-950 text-amber-400">
                          Class {cls.class_name}
                        </span>
                        {!cls.can_edit_marks && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            <Lock className="w-3 h-3" />
                            Read Only
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Students</span>
                          <p className="text-base font-black text-slate-900">{cls.total_students}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-emerald-600 uppercase font-bold">Completed</span>
                          <p className="text-base font-black text-emerald-700">{cls.completed_results}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-amber-600 uppercase font-bold">Passed</span>
                          <p className="text-base font-black text-amber-800">{cls.passed_count}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-amber-700">
                      <span>Inspect Results</span>
                      <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center transition-colors">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Detailed Class Results Drill-down */
        <div className="space-y-4">
          {/* Back & Breadcrumb Bar */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedClassId(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>All Classes</span>
              </button>
              <h2 className="text-base font-bold text-slate-900">
                Class {activeClassItem?.class_name} Results
              </h2>
              {!activeClassItem?.can_edit_marks && (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Read-Only Mode
                </span>
              )}
            </div>

            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Drill-down Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loadingClass ? (
              <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-xs">Loading class results...</span>
              </div>
            ) : filteredClassResults.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p className="text-xs">No student results found for this class.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      <th className="p-3.5 pl-5 w-16">Roll</th>
                      <th className="p-3.5">Student Name</th>
                      <th className="p-3.5 text-center">Scholar No</th>
                      <th className="p-3.5 text-center">Annual Total</th>
                      <th className="p-3.5 text-center">Percentage</th>
                      <th className="p-3.5 text-center">Result</th>
                      <th className="p-3.5 text-center">Division / Grade</th>
                      <th className="p-3.5 text-right pr-5">Report Card</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredClassResults.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 pl-5 font-mono font-bold text-slate-950 text-sm">
                          {r.roll_number}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 text-sm">{r.student_name}</div>
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-600">
                          {r.scholar_number || '—'}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-900">
                          {r.annual_total > 0 ? `${r.annual_total} / ${r.annual_max_marks}` : '—'}
                        </td>
                        <td className="p-3.5 text-center font-mono font-extrabold text-sm text-slate-950">
                          {r.percentage > 0 ? `${r.percentage.toFixed(2)} %` : '—'}
                        </td>
                        <td className="p-3.5 text-center">
                          {r.pass_fail_status ? (
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                r.pass_fail_status === 'PASS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {r.pass_fail_status}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">—</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-900">
                          {r.division_grade || '—'}
                        </td>
                        <td className="p-3.5 text-right pr-5">
                          <button
                            onClick={() => handleOpenReportCard(r.student_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/30 rounded-xl font-bold text-xs transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                            <span>View Card</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Card Preview Modal */}
      <ReportCardPreviewModal
        data={previewData}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

    </div>
  );
};
