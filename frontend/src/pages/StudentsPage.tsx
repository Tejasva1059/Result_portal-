import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Student, AcademicClass, StudentImportPreviewResponse, StudentImportPreviewItem } from '../types';
import {
  GraduationCap,
  Plus,
  Upload,
  Search,
  Filter,
  Edit2,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const { user, isSuperAdmin, isPrincipal, canUpdateClass, assignedClassId } = useAuth();
  const { success, error, warning } = useToast();

  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  // Add / Edit Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<{
    class_id: number;
    student_name: string;
    father_name: string;
    mother_name: string;
    date_of_birth: string;
    contact_number: string;
    scholar_number: string;
    roll_number: string | number;
    address: string;
  }>({
    class_id: 0,
    student_name: '',
    father_name: '',
    mother_name: '',
    date_of_birth: '',
    contact_number: '',
    scholar_number: '',
    roll_number: '',
    address: '',
  });

  // Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<StudentImportPreviewResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  // Load Classes
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

  // Load Students
  const loadStudents = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const data = await api.students.getAll({
        class_id: selectedClassId,
        search: searchQuery.trim() || undefined,
      });
      setStudents(data);
    } catch (err: any) {
      error(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [selectedClassId, searchQuery]);

  // Open Create Form
  const handleOpenCreate = () => {
    const defaultClass = selectedClassId || (classes.length > 0 ? classes[0].id : 1);
    setEditingStudent(null);
    setFormData({
      class_id: defaultClass,
      student_name: '',
      father_name: '',
      mother_name: '',
      date_of_birth: '',
      contact_number: '',
      scholar_number: '',
      roll_number: students.length > 0 ? String(students.length + 1) : '1',
      address: '',
    });
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setFormData({
      class_id: s.class_id,
      student_name: s.student_name,
      father_name: s.father_name,
      mother_name: s.mother_name,
      date_of_birth: s.date_of_birth ? s.date_of_birth.substring(0, 10) : '',
      contact_number: s.contact_number || '',
      scholar_number: s.scholar_number || '',
      roll_number: s.roll_number,
      address: s.address || '',
    });
    setIsFormOpen(true);
  };

  // Submit Student Form
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdateClass(formData.class_id)) {
      error('You are not authorized to manage students in this class');
      return;
    }

    try {
      if (editingStudent) {
        await api.students.update(editingStudent.id, {
          ...formData,
          date_of_birth: formData.date_of_birth || undefined,
        });
        success(`Updated student ${formData.student_name}`);
      } else {
        await api.students.create({
          ...formData,
          date_of_birth: formData.date_of_birth || undefined,
        });
        success(`Added student ${formData.student_name}`);
      }
      setIsFormOpen(false);
      loadStudents();
    } catch (err: any) {
      error(err.message || 'Failed to save student record');
    }
  };

  // Delete Student
  const handleDeleteStudent = async (s: Student) => {
    if (!canUpdateClass(s.class_id)) {
      error('You are not authorized to delete students in this class');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${s.student_name} (Roll ${s.roll_number})?`)) {
      return;
    }

    try {
      await api.students.delete(s.id);
      success(`Deleted student ${s.student_name}`);
      loadStudents();
    } catch (err: any) {
      error(err.message || 'Failed to delete student');
    }
  };

  // Import File Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImportFile(file);
      setIsAnalyzing(true);
      try {
        const previewData = await api.students.previewImport(file);
        setImportPreview(previewData);
      } catch (err: any) {
        error(err.message || 'Error parsing import file');
        setImportPreview(null);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleCommitImport = async () => {
    if (!importPreview || importPreview.valid_count === 0) return;
    setIsCommitting(true);
    try {
      const res = await api.students.commitImport(importPreview.items);
      success(res.message);
      setIsImportModalOpen(false);
      setImportFile(null);
      setImportPreview(null);
      loadStudents();
    } catch (err: any) {
      error(err.message || 'Failed to import students');
    } finally {
      setIsCommitting(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8,Class,Roll Number,Scholar Number,Student Name,Father's Name,Mother's Name,DOB,Contact Number,Address\n" +
      "IV,1,4890,Komal Bhargav,Sachin Bhargav,Pooja Bhargav,2010-07-03,9826012345,MR-9 Indore\n" +
      "IV,2,4891,Rahul Sharma,Sunil Sharma,Anita Sharma,2010-09-15,9826012346,Yashoda Nagar Indore";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-amber-600" />
            Student Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student enrollment, scholar records, and roll numbers class-wise.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 shadow-xs transition-all active:scale-95"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Import CSV / Excel</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Class Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Class:
          </span>
          {classes.map((cls) => {
            const isAssigned = user?.role === 'CLASS_TEACHER' && assignedClassId() === cls.id;
            const isSelected = selectedClassId === cls.id;
            return (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-xs shadow-amber-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cls.name} {isAssigned && '★'}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, roll, scholar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs">Loading students...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No students found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No student records exist for this class. Add a student manually or import via Excel/CSV.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-xs"
            >
              Add First Student
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 pl-5 w-16">Roll</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Parents</th>
                  <th className="p-3.5">Scholar No</th>
                  <th className="p-3.5">DOB / Contact</th>
                  <th className="p-3.5 text-center">Result Status</th>
                  <th className="p-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pl-5 font-mono font-bold text-slate-950 text-sm">
                      {s.roll_number}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 text-sm">{s.student_name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{s.address || '—'}</div>
                    </td>
                    <td className="p-3.5 text-xs">
                      <div><span className="text-slate-500">F:</span> {s.father_name}</div>
                      <div><span className="text-slate-500">M:</span> {s.mother_name}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {s.scholar_number || '—'}
                    </td>
                    <td className="p-3.5 text-xs text-slate-600">
                      <div>{s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString('en-GB') : '—'}</div>
                      <div className="text-slate-500 font-mono">{s.contact_number || '—'}</div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                          s.completion_status === 'COMPLETE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : s.completion_status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {s.completion_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right pr-5 space-x-1">
                      {canUpdateClass(s.class_id) && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="bg-navy-950 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingStudent ? 'Edit Student Record' : 'Add New Student'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Class *</label>
                  <select
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: parseInt(e.target.value) })}
                    disabled={user?.role === 'CLASS_TEACHER' && !isSuperAdmin() && !isPrincipal()}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>Class {cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Roll Number *</label>
                  <input
                    type="number"
                    value={formData.roll_number}
                    onChange={(e) => setFormData({ ...formData, roll_number: parseInt(e.target.value) || 1 })}
                    required
                    min={1}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Student Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Father's Name *</label>
                  <input
                    type="text"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Mother's Name *</label>
                  <input
                    type="text"
                    value={formData.mother_name}
                    onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Scholar / SSSID Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 4890 or NS-2026-001"
                    value={formData.scholar_number}
                    onChange={(e) => setFormData({ ...formData, scholar_number: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="9826012345"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="Indore"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  {editingStudent ? 'Save Changes' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CSV / EXCEL IMPORT MODAL ================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="bg-navy-950 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Import Students from Excel / CSV</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Template Download & File Upload Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Download Template</h4>
                  <p className="text-slate-500 text-xs">Download standard CSV template with required headers.</p>
                </div>
                <button
                  onClick={downloadSampleCsv}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 text-white rounded-xl font-semibold text-xs hover:bg-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* Upload Input Area */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-amber-500 transition-colors bg-slate-50/50">
                <input
                  type="file"
                  id="csv-file-upload"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="csv-file-upload" className="cursor-pointer block space-y-2">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {importFile ? importFile.name : 'Click to select CSV or Excel (.xlsx) file'}
                  </div>
                  <p className="text-slate-500 text-xs">
                    Columns: Class, Roll Number, Scholar Number, Student Name, Father's Name, Mother's Name, DOB, Contact, Address
                  </p>
                </label>
              </div>

              {isAnalyzing && (
                <div className="p-4 text-center text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                  <span>Validating records and checking for duplicates...</span>
                </div>
              )}

              {/* Validation Preview Table */}
              {importPreview && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800">Import Preview:</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {importPreview.valid_count} Valid
                      </span>
                      {importPreview.error_count > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                          {importPreview.error_count} Errors
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 font-bold text-slate-700 sticky top-0">
                        <tr>
                          <th className="p-2.5">Row</th>
                          <th className="p-2.5">Class</th>
                          <th className="p-2.5">Roll</th>
                          <th className="p-2.5">Student Name</th>
                          <th className="p-2.5">Parents</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreview.items.map((item) => (
                          <tr
                            key={item.row_number}
                            className={item.status === 'VALID' ? 'bg-white' : 'bg-rose-50/50'}
                          >
                            <td className="p-2.5 font-mono">{item.row_number}</td>
                            <td className="p-2.5 font-bold">{item.class_name}</td>
                            <td className="p-2.5 font-mono">{item.roll_number}</td>
                            <td className="p-2.5 font-semibold">{item.student_name}</td>
                            <td className="p-2.5 text-slate-600">{item.father_name}</td>
                            <td className="p-2.5">
                              {item.status === 'VALID' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Valid
                                </span>
                              ) : (
                                <div className="text-rose-700 font-bold">
                                  <div className="flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>{item.status}</span>
                                  </div>
                                  <div className="text-[10px] font-normal text-rose-600 mt-0.5">
                                    {item.errors.join(', ')}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={handleCommitImport}
                disabled={!importPreview || importPreview.valid_count === 0 || isCommitting}
                className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
              >
                {isCommitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing Records...</span>
                  </>
                ) : (
                  <span>Commit {importPreview?.valid_count || 0} Valid Students</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
