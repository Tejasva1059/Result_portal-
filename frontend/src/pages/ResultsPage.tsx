import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { AcademicClass, ClassResultSummary, ResultItem, ReportCardResponse } from '../types';
import { ReportCardPreviewModal } from '../components/report_card/ReportCardPreviewModal';
import {
  Award,
  FileText,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit3,
  X,
  Loader2,
  RefreshCw
} from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const { user, isSuperAdmin, isPrincipal, canUpdateClass, assignedClassId, canViewAllResults } = useAuth();
  const { success, error } = useToast();

  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [summary, setSummary] = useState<ClassResultSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  // Division / Grade Modal
  const [editingResult, setEditingResult] = useState<ResultItem | null>(null);
  const [divisionInput, setDivisionInput] = useState('');
  const [isSavingDivision, setIsSavingDivision] = useState(false);

  // Report Card Preview Modal
  const [previewData, setPreviewData] = useState<ReportCardResponse | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await api.classes.getAll();
        setClasses(data);
        if (data.length > 0) {
          if (user?.role === 'CLASS_TEACHER' && assignedClassId()) {
            setSelectedClassId(assignedClassId());
          } else {
            setSelectedClassId(data[0].id);
          }
        }
      } catch (err: any) {
        error('Failed to load classes');
      }
    };
    fetchClasses();
  }, [user]);

  const loadResults = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const data = await api.results.getClassResults(selectedClassId);
      setSummary(data);
    } catch (err: any) {
      error(err.message || 'Failed to load class results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [selectedClassId]);

  const handleOpenDivisionModal = (r: ResultItem) => {
    setEditingResult(r);
    setDivisionInput(r.division_grade || '');
  };

  const handleSaveDivision = async () => {
    if (!editingResult) return;
    setIsSavingDivision(true);
    try {
      await api.results.updateDivisionGrade(editingResult.student_id, divisionInput);
      success(`Updated division/grade for ${editingResult.student_name}`);
      setEditingResult(null);
      loadResults();
    } catch (err: any) {
      error(err.message || 'Failed to update division/grade');
    } finally {
      setIsSavingDivision(false);
    }
  };

  const handleOpenReportCard = async (studentId: number) => {
    setIsLoadingPreview(true);
    try {
      const rc = await api.reportCards.getStudentReportCard(studentId);
      setPreviewData(rc);
      setIsPreviewOpen(true);
    } catch (err: any) {
      error(err.message || 'Failed to generate report card');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const isClassEditable = selectedClassId ? canUpdateClass(selectedClassId) : false;

  const filteredResults = (summary?.results || []).filter((r) => {
    const matchesSearch =
      (r.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.roll_number || '').includes(searchQuery) ||
      (r.scholar_number || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'COMPLETE') return r.completion_status === 'COMPLETE';
    if (statusFilter === 'IN_PROGRESS') return r.completion_status === 'IN_PROGRESS';
    if (statusFilter === 'PENDING') return r.completion_status === 'PENDING';
    if (statusFilter === 'PASS') return r.pass_fail_status === 'PASS';
    if (statusFilter === 'FAIL') return r.pass_fail_status === 'FAIL';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-amber-600" />
            Class Results & Report Cards
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View student academic totals, percentage evaluations, teacher division assignments, and generate official A4 report cards.
          </p>
        </div>

        <button
          onClick={loadResults}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Results</span>
        </button>
      </div>

      {/* Class Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
          Class:
        </span>
        {classes.map((cls) => {
          const isSelected = selectedClassId === cls.id;
          const isPermitted = canViewAllResults() || (user?.role === 'CLASS_TEACHER' && assignedClassId() === cls.id);
          return (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              disabled={!isPermitted}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                  : isPermitted
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-100 text-slate-400 opacity-40 cursor-not-allowed'
              }`}
            >
              Class {cls.name}
            </button>
          );
        })}
      </div>

      {/* Summary KPI Badges */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500">Enrolled Students</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{summary.total_students}</p>
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-emerald-600">Results Completed</span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{summary.completed_count}</p>
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-emerald-600">Passed</span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{summary.passed_count}</p>
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-rose-600">Failed / Pending</span>
            <p className="text-xl font-black text-rose-700 mt-0.5">{summary.failed_count + summary.pending_count}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'COMPLETE', 'IN_PROGRESS', 'PENDING', 'PASS', 'FAIL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
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

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs">Loading class results...</span>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No results match your filter</h4>
            <p className="text-xs text-slate-400">Try adjusting the search query or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 pl-5 w-16">Roll</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5 text-center">Half-Yearly Total</th>
                  <th className="p-3.5 text-center">Annual Total</th>
                  <th className="p-3.5 text-center">Percentage</th>
                  <th className="p-3.5 text-center">Result</th>
                  <th className="p-3.5 text-center">Division / Grade</th>
                  <th className="p-3.5 text-center">Completion</th>
                  <th className="p-3.5 text-right pr-5">Report Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pl-5 font-mono font-bold text-slate-950 text-sm">
                      {r.roll_number}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 text-sm">{r.student_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">Scholar: {r.scholar_number || '—'}</div>
                    </td>
                    <td className="p-3.5 text-center font-mono font-semibold text-slate-700">
                      {r.half_yearly_total > 0 ? r.half_yearly_total : '—'}
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
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            r.pass_fail_status === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {r.pass_fail_status}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-bold text-slate-900">
                          {r.division_grade || '—'}
                        </span>
                        {isClassEditable && (
                          <button
                            onClick={() => handleOpenDivisionModal(r)}
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                            title="Edit Division/Grade"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          r.completion_status === 'COMPLETE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.completion_status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.completion_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right pr-5">
                      <button
                        onClick={() => handleOpenReportCard(r.student_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/30 rounded-xl font-bold text-xs transition-colors active:scale-95"
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

      {/* ================= EDIT DIVISION / GRADE MODAL ================= */}
      {editingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-navy-950 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Assign Division / Grade</h3>
              <button onClick={() => setEditingResult(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div>
                <p className="text-slate-600 font-medium">
                  Student: <strong className="text-slate-900">{editingResult.student_name}</strong>
                </p>
                <p className="text-slate-600 font-medium">
                  Percentage: <strong className="text-slate-900 font-mono">{editingResult.percentage.toFixed(2)} %</strong>
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">
                  Division / Grade Value:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1st, 2nd, 3rd, A+, Distinction"
                  value={divisionInput}
                  onChange={(e) => setDivisionInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingResult(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDivision}
                  disabled={isSavingDivision}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-xs"
                >
                  {isSavingDivision ? 'Saving...' : 'Save Division'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= REPORT CARD PREVIEW MODAL ================= */}
      <ReportCardPreviewModal
        data={previewData}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

    </div>
  );
};
