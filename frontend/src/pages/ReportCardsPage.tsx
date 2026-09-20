import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { AcademicClass, Student, ReportCardResponse } from '../types';
import { ReportCardPreviewModal } from '../components/report_card/ReportCardPreviewModal';
import { ReportCardDocument } from '../components/report_card/ReportCardDocument';
import { printBulkReportCards } from '../utils/printReportCard';
import {
  FileText,
  Printer,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Users
} from 'lucide-react';

export const ReportCardsPage: React.FC = () => {
  const { user, isSuperAdmin, isPrincipal, assignedClassId, canViewAllResults } = useAuth();
  const { success, error } = useToast();

  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  // Single Modal
  const [previewData, setPreviewData] = useState<ReportCardResponse | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Bulk Print State
  const [bulkData, setBulkData] = useState<ReportCardResponse[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);

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
      } catch (err) {
        error('Failed to load classes');
      }
    };
    fetchClasses();
  }, [user]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClassId) return;
      setLoading(true);
      try {
        const data = await api.students.getAll({ class_id: selectedClassId });
        setStudents(data);
      } catch (err) {
        error('Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedClassId]);

  const handleOpenSingle = async (studentId: number) => {
    try {
      const data = await api.reportCards.getStudentReportCard(studentId);
      setPreviewData(data);
      setIsPreviewOpen(true);
    } catch (err: any) {
      error(err.message || 'Failed to load report card');
    }
  };

  const handleBulkPrint = async () => {
    if (!selectedClassId) return;
    setIsBulkLoading(true);
    try {
      const cards = await api.reportCards.getClassReportCards(selectedClassId);
      setBulkData(cards);
      setIsBulkMode(true);
      setTimeout(() => {
        printBulkReportCards('bulk-report-cards-print-area');
      }, 300);
    } catch (err: any) {
      error(err.message || 'Failed to load bulk report cards');
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-amber-600" />
            Official Report Cards
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate, preview, and print A4 portrait report cards for individual students or entire classes.
          </p>
        </div>

        <button
          onClick={handleBulkPrint}
          disabled={students.length === 0 || isBulkLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          {isBulkLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Preparing Print...</span>
            </>
          ) : (
            <>
              <Printer className="w-4 h-4" />
              <span>Print All Class Report Cards</span>
            </>
          )}
        </button>
      </div>

      {/* Class Selector Bar */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
          Class:
        </span>
        {classes.map((cls) => {
          const isSelected = selectedClassId === cls.id;
          const isPermitted = canViewAllResults() || (user?.role === 'CLASS_TEACHER' && assignedClassId() === cls.id);
          return (
            <button
              key={cls.id}
              onClick={() => {
                setSelectedClassId(cls.id);
                setIsBulkMode(false);
              }}
              disabled={!isPermitted}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : isPermitted
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 opacity-40 cursor-not-allowed'
              }`}
            >
              Class {cls.name}
            </button>
          );
        })}
      </div>

      {/* Student Cards Grid */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600" />
            Class {classes.find((c) => c.id === selectedClassId)?.name} Students ({students.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs">Loading students...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-xs">No students found in this class.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-amber-400 transition-all shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-navy-950 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {s.roll_number}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{s.student_name}</h3>
                      <p className="text-[11px] text-slate-500 font-mono">Scholar: {s.scholar_number || '—'}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      s.completion_status === 'COMPLETE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {s.completion_status}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {s.percentage > 0 ? `${s.percentage.toFixed(2)} %` : 'No Marks'}
                  </span>
                  <button
                    onClick={() => handleOpenSingle(s.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-slate-950 rounded-lg font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View / Print</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden container for multi-student bulk print */}
      {isBulkMode && (
        <div id="bulk-report-cards-print-area" className="print-only bulk-print-container">
          {bulkData.map((doc) => (
            <div key={doc.student.id} className="bulk-report-card-wrapper">
              <ReportCardDocument id={`bulk-report-card-${doc.student.id}`} data={doc} />
            </div>
          ))}
        </div>
      )}


      {/* Single Report Card Modal */}
      <ReportCardPreviewModal
        data={previewData}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

    </div>
  );
};
