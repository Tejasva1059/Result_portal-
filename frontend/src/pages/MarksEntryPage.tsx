import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import {
  AcademicClass,
  Student,
  StudentMarksDetail,
  StudentSubjectMarksRow,
  BatchMarksEntryRequest,
  MarkEntryItem
} from '../types';
import {
  FileSpreadsheet,
  Save,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Award,
  Search,
  BookOpen,
  HelpCircle,
  Loader2
} from 'lucide-react';

export const MarksEntryPage: React.FC = () => {
  const { user, isSuperAdmin, isPrincipal, canUpdateClass, assignedClassId } = useAuth();
  const { success, error, warning } = useToast();

  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  
  const [examType, setExamType] = useState<'HALF_YEARLY' | 'ANNUAL'>('ANNUAL');
  const [marksDetail, setMarksDetail] = useState<StudentMarksDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form input state
  const [hyInputs, setHyInputs] = useState<Record<number, string>>({});
  const [annTheoryInputs, setAnnTheoryInputs] = useState<Record<number, string>>({});
  const [annPracticalInputs, setAnnPracticalInputs] = useState<Record<number, string>>({});
  const [divisionGrade, setDivisionGrade] = useState<string>('');

  // First input ref for auto-focus
  const firstInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Classes
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

  // 2. Fetch Students for Selected Class
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClassId) return;
      try {
        const data = await api.students.getAll({ class_id: selectedClassId });
        setStudents(data);
        if (data.length > 0) {
          setSelectedStudentId(data[0].id);
        } else {
          setSelectedStudentId(null);
          setMarksDetail(null);
        }
      } catch (err: any) {
        error('Failed to load class students');
      }
    };
    fetchStudents();
  }, [selectedClassId]);

  // 3. Fetch Marks for Selected Student
  const loadStudentMarks = async (studentId: number) => {
    setLoading(true);
    try {
      const data = await api.marks.getStudentMarks(studentId);
      setMarksDetail(data);
      setDivisionGrade(data.division_grade || '');

      // Populate input states
      const newHy: Record<number, string> = {};
      const newTh: Record<number, string> = {};
      const newPr: Record<number, string> = {};

      data.rows.forEach((r) => {
        newHy[r.subject_id] = r.half_yearly_obtained !== null && r.half_yearly_obtained !== undefined ? String(r.half_yearly_obtained) : '';
        newTh[r.subject_id] = r.annual_theory_obtained !== null && r.annual_theory_obtained !== undefined ? String(r.annual_theory_obtained) : '';
        newPr[r.subject_id] = r.annual_practical_obtained !== null && r.annual_practical_obtained !== undefined ? String(r.annual_practical_obtained) : '';
      });

      setHyInputs(newHy);
      setAnnTheoryInputs(newTh);
      setAnnPracticalInputs(newPr);

      setTimeout(() => {
        if (firstInputRef.current) firstInputRef.current.focus();
      }, 100);
    } catch (err: any) {
      error(err.message || 'Failed to load student marks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentMarks(selectedStudentId);
    }
  }, [selectedStudentId]);

  const currentStudentIndex = students.findIndex((s) => s.id === selectedStudentId);
  const currentStudent = students[currentStudentIndex];
  const isAuthorizedToEdit = selectedClassId ? canUpdateClass(selectedClassId) : false;

  // Calculate local live totals for Half Yearly
  const liveHyObtainedTotal = marksDetail
    ? marksDetail.rows.reduce((sum, r) => {
        const val = parseFloat(hyInputs[r.subject_id]);
        return sum + (!isNaN(val) ? val : 0);
      }, 0)
    : 0;

  const liveHyMaxTotal = marksDetail
    ? marksDetail.rows.reduce((sum, r) => sum + (r.half_yearly_max || 0), 0)
    : 0;

  // Calculate local live totals for Annual
  const calculateLiveSubjectTotal = (subjId: number): number => {
    const th = parseFloat(annTheoryInputs[subjId]) || 0;
    const pr = parseFloat(annPracticalInputs[subjId]) || 0;
    return th + pr;
  };

  const liveAnnTheoryTotal = marksDetail
    ? marksDetail.rows.reduce((sum, r) => {
        const val = parseFloat(annTheoryInputs[r.subject_id]);
        return sum + (!isNaN(val) ? val : 0);
      }, 0)
    : 0;

  const liveAnnPracticalTotal = marksDetail
    ? marksDetail.rows.reduce((sum, r) => {
        const val = parseFloat(annPracticalInputs[r.subject_id]);
        return sum + (!isNaN(val) ? val : 0);
      }, 0)
    : 0;

  const liveAnnGrandTotal = marksDetail
    ? marksDetail.rows.reduce((sum, r) => sum + calculateLiveSubjectTotal(r.subject_id), 0)
    : 0;

  // Save Marks Handler
  const handleSaveMarks = async (goToNext = false) => {
    if (!selectedStudentId || !marksDetail) return;
    if (!isAuthorizedToEdit) {
      error('You are not authorized to enter marks for this class');
      return;
    }

    setSaving(true);
    try {
      const markItems: MarkEntryItem[] = marksDetail.rows.map((row) => {
        if (examType === 'HALF_YEARLY') {
          const val = hyInputs[row.subject_id];
          const obt = val !== '' && !isNaN(parseFloat(val)) ? parseFloat(val) : null;
          return {
            subject_id: row.subject_id,
            exam_type: 'HALF_YEARLY',
            max_marks: row.half_yearly_max,
            obtained_marks: obt,
          };
        } else {
          const thVal = annTheoryInputs[row.subject_id];
          const prVal = annPracticalInputs[row.subject_id];
          const thObt = thVal !== '' && !isNaN(parseFloat(thVal)) ? parseFloat(thVal) : null;
          const prObt = prVal !== '' && !isNaN(parseFloat(prVal)) ? parseFloat(prVal) : null;
          return {
            subject_id: row.subject_id,
            exam_type: 'ANNUAL',
            max_marks: row.annual_max,
            theory_max: row.annual_theory_max,
            theory_obtained: thObt,
            practical_max: row.annual_practical_max,
            practical_obtained: prObt,
          };
        }
      });

      const payload: BatchMarksEntryRequest = {
        student_id: selectedStudentId,
        exam_type: examType,
        marks: markItems,
        division_grade: divisionGrade.trim() || undefined,
      };

      const res = await api.marks.saveBatchMarks(payload);
      success(res.message);

      // Refresh student marks
      await loadStudentMarks(selectedStudentId);

      // Refresh student list status
      const updatedStudents = await api.students.getAll({ class_id: selectedClassId! });
      setStudents(updatedStudents);

      if (goToNext && currentStudentIndex < students.length - 1) {
        setSelectedStudentId(students[currentStudentIndex + 1].id);
      }
    } catch (err: any) {
      error(err.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const handlePrevStudent = () => {
    if (currentStudentIndex > 0) {
      setSelectedStudentId(students[currentStudentIndex - 1].id);
    }
  };

  const handleNextStudent = () => {
    if (currentStudentIndex < students.length - 1) {
      setSelectedStudentId(students[currentStudentIndex + 1].id);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.student_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      String(s.roll_number).includes(studentSearch)
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-amber-600" />
            Class Marks Entry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter Half-Yearly and Annual exam theory & practical marks. Totals are calculated automatically.
          </p>
        </div>

        {/* Exam Type Switcher */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-2xl border border-slate-300 shrink-0">
          <button
            onClick={() => setExamType('HALF_YEARLY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              examType === 'HALF_YEARLY'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Half-Yearly Exam
          </button>
          <button
            onClick={() => setExamType('ANNUAL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              examType === 'ANNUAL'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Annual Exam (Theory + Practical)
          </button>
        </div>
      </div>

      {/* Class Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
          Select Class:
        </span>
        {classes.map((cls) => {
          const isSelected = selectedClassId === cls.id;
          const isPermitted = canUpdateClass(cls.id);
          return (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              disabled={user?.role === 'CLASS_TEACHER' && !isSuperAdmin() && !isPrincipal() && !isPermitted}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-navy-950 text-amber-400 shadow-sm'
                  : isPermitted
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
              }`}
            >
              Class {cls.name}
            </button>
          );
        })}
      </div>

      {/* Main Workspace: Student Sidebar + Marks Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Student Quick Navigation List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col h-[680px]">
          <div className="space-y-2 mb-3 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Students ({students.length})
              </h3>
              <span className="text-[10px] text-slate-400">Class {classes.find(c => c.id === selectedClassId)?.name}</span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search roll or name..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredStudents.map((s, idx) => {
              const isSelected = selectedStudentId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudentId(s.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span
                      className={`w-6 h-6 rounded-lg font-mono font-bold text-[11px] flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-slate-950 text-amber-400' : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {s.roll_number}
                    </span>
                    <span className="truncate font-semibold">{s.student_name}</span>
                  </div>

                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 uppercase ${
                      s.completion_status === 'COMPLETE'
                        ? isSelected
                          ? 'bg-slate-950 text-emerald-400'
                          : 'bg-emerald-100 text-emerald-800'
                        : s.completion_status === 'IN_PROGRESS'
                        ? isSelected
                          ? 'bg-slate-950 text-amber-300'
                          : 'bg-amber-100 text-amber-800'
                        : isSelected
                        ? 'bg-slate-950 text-slate-400'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {s.completion_status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Marks Entry Sheet */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          
          {/* Student Header Bar */}
          {currentStudent ? (
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-base flex items-center justify-center shrink-0">
                  {currentStudent.roll_number}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">
                    {currentStudent.student_name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Class {currentStudent.class_name || classes.find(c => c.id === selectedClassId)?.name} • Scholar No: {currentStudent.scholar_number || '—'}
                  </p>
                </div>
              </div>

              {/* Prev / Next Controls */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={handlePrevStudent}
                  disabled={currentStudentIndex <= 0}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl disabled:opacity-40 transition-colors"
                  title="Previous Student"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {currentStudentIndex + 1} / {students.length}
                </span>
                <button
                  onClick={handleNextStudent}
                  disabled={currentStudentIndex >= students.length - 1}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl disabled:opacity-40 transition-colors"
                  title="Next Student"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">Select a student to enter marks</div>
          )}

          {/* Marks Table Form */}
          {loading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs">Loading marks record...</span>
            </div>
          ) : marksDetail ? (
            <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between space-y-6">
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      <th className="p-3 w-40">Subject</th>
                      {examType === 'HALF_YEARLY' ? (
                        <>
                          <th className="p-3 w-28 text-center">Max Marks</th>
                          <th className="p-3 w-40 text-center">Marks Obtained</th>
                        </>
                      ) : (
                        <>
                          <th className="p-3 w-28 text-center bg-slate-100">Theory (Max 75)</th>
                          <th className="p-3 w-28 text-center bg-slate-100">Pra./Int. (Max 25)</th>
                          <th className="p-3 w-32 text-center bg-sky-50 text-sky-900 font-black">
                            Annual Total (100)
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {marksDetail.rows.map((row, idx) => {
                      const subjTotal = calculateLiveSubjectTotal(row.subject_id);
                      return (
                        <tr key={row.subject_id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-900 uppercase">
                            {row.subject_name}
                          </td>

                          {examType === 'HALF_YEARLY' ? (
                            <>
                              <td className="p-3 text-center font-mono text-slate-500 font-semibold">
                                {row.half_yearly_max}
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  ref={idx === 0 ? firstInputRef : undefined}
                                  type="number"
                                  min={0}
                                  max={row.half_yearly_max}
                                  step="0.5"
                                  placeholder="0 - 100"
                                  value={hyInputs[row.subject_id] || ''}
                                  disabled={!isAuthorizedToEdit}
                                  onChange={(e) =>
                                    setHyInputs({ ...hyInputs, [row.subject_id]: e.target.value })
                                  }
                                  className="w-28 mx-auto text-center py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                                />
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 text-center">
                                <input
                                  ref={idx === 0 ? firstInputRef : undefined}
                                  type="number"
                                  min={0}
                                  max={row.annual_theory_max}
                                  step="0.5"
                                  placeholder="0 - 75"
                                  value={annTheoryInputs[row.subject_id] || ''}
                                  disabled={!isAuthorizedToEdit}
                                  onChange={(e) =>
                                    setAnnTheoryInputs({ ...annTheoryInputs, [row.subject_id]: e.target.value })
                                  }
                                  className="w-24 mx-auto text-center py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={row.annual_practical_max}
                                  step="0.5"
                                  placeholder="0 - 25"
                                  value={annPracticalInputs[row.subject_id] || ''}
                                  disabled={!isAuthorizedToEdit}
                                  onChange={(e) =>
                                    setAnnPracticalInputs({ ...annPracticalInputs, [row.subject_id]: e.target.value })
                                  }
                                  className="w-24 mx-auto text-center py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                                />
                              </td>
                              {/* Automatic Sum Cell */}
                              <td className="p-3 text-center font-mono font-black text-sm text-sky-950 bg-sky-50/60">
                                {subjTotal > 0 ? subjTotal : '—'}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    {examType === 'HALF_YEARLY' ? (
                      <tr className="bg-amber-100/70 border-t-2 border-amber-300 font-black text-xs text-slate-900">
                        <td className="p-3 font-black uppercase tracking-wider text-amber-950">
                          TOTAL MARKS
                        </td>
                        <td className="p-3 text-center font-mono font-extrabold text-amber-950">
                          {liveHyMaxTotal}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-sm text-amber-950 bg-amber-200/50">
                          {liveHyObtainedTotal > 0 ? liveHyObtainedTotal : '0'}
                        </td>
                      </tr>
                    ) : (
                      <tr className="bg-sky-100/70 border-t-2 border-sky-300 font-black text-xs text-slate-900">
                        <td className="p-3 font-black uppercase tracking-wider text-sky-950">
                          TOTAL MARKS
                        </td>
                        <td className="p-3 text-center font-mono font-extrabold text-sky-950">
                          {liveAnnTheoryTotal > 0 ? liveAnnTheoryTotal : '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-extrabold text-sky-950">
                          {liveAnnPracticalTotal > 0 ? liveAnnPracticalTotal : '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-sm text-sky-950 bg-sky-200/50">
                          {liveAnnGrandTotal > 0 ? liveAnnGrandTotal : '—'}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>

              {/* Bottom Evaluation / Totals Bar */}
              {examType === 'HALF_YEARLY' ? (
                /* Half-Yearly: Only Total Marks of Each Subject (No percentage, no pass/fail) */
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="font-extrabold text-xs text-amber-950 uppercase tracking-wide">
                      Half-Yearly Evaluation • Marks Total
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-xs font-bold">
                    <div>
                      <span className="text-slate-500 uppercase text-[11px]">Total Subjects:</span>{' '}
                      <span className="font-mono text-slate-900 font-black">{marksDetail.rows.length}</span>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl border border-amber-300 shadow-xs flex items-center gap-2">
                      <span className="text-slate-600 uppercase text-[11px] font-bold">Total Marks Obtained:</span>
                      <span className="font-mono text-amber-900 text-lg font-black">
                        {liveHyObtainedTotal}{' '}
                        <span className="text-xs text-slate-400 font-semibold">/ {liveHyMaxTotal}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Annual Exam: Theory + Practical + Calculated % + Division / Grade + Result */
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="font-bold text-xs text-slate-700 uppercase">Division / Grade:</span>
                    <input
                      type="text"
                      placeholder="e.g. 1st, 2nd, A+"
                      value={divisionGrade}
                      disabled={!isAuthorizedToEdit}
                      onChange={(e) => setDivisionGrade(e.target.value)}
                      className="w-32 py-1.5 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold">
                    <div>
                      <span className="text-slate-500">Calculated %:</span>{' '}
                      <span className="font-mono text-slate-950 text-sm">{marksDetail.percentage.toFixed(2)} %</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Result:</span>{' '}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          marksDetail.pass_fail_status === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : marksDetail.pass_fail_status === 'FAIL'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {marksDetail.pass_fail_status || 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveMarks(false)}
                  disabled={saving || !isAuthorizedToEdit}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Marks</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveMarks(true)}
                  disabled={saving || !isAuthorizedToEdit}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span>Save & Next Student</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>

            </div>
          ) : null}

        </div>

      </div>
    </div>
  );
};
