import React from 'react';
import { ReportCardResponse } from '../../types';
import schoolLogo from '../../assets/school_logo.png';

interface ReportCardDocumentProps {
  data: ReportCardResponse;
}

export const ReportCardDocument: React.FC<ReportCardDocumentProps> = ({ data }) => {
  const { header, student, subjects_marks, totals, result, percentage, division_grade, signatures } = data;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const isPending = !percentage || percentage <= 0 || result === 'RESULT PENDING';

  return (
    <div
      id="official-report-card-doc"
      className="report-card-print-page bg-white text-slate-900 w-[794px] min-w-[794px] max-w-[794px] h-[1123px] min-h-[1123px] max-h-[1123px] p-[20px] font-sans shadow-2xl print:shadow-none print:p-[14px] print:m-0 box-border flex flex-col justify-between select-text relative overflow-hidden"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Background Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.045] z-0">
        <img
          src={schoolLogo}
          alt="Watermark Logo"
          className="w-[360px] h-[360px] object-contain select-none"
        />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        
        {/* TOP & MIDDLE SECTION */}
        <div className="space-y-4">
          
          {/* ================= 1. OFFICIAL NAVY SCHOOL HEADER ================= */}
          <div className="bg-[#153e75] text-white rounded-t-sm p-4 border-b-4 border-amber-400 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              
              {/* School Circular Logo */}
              <div className="w-20 h-20 shrink-0 bg-white/10 rounded-full p-1 flex items-center justify-center backdrop-blur-xs">
                <img
                  src={schoolLogo}
                  alt="New Sunshine Public School"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* School Info & Title */}
              <div className="flex-1 text-center px-1">
                <h1 className="text-[21px] font-black uppercase tracking-wider text-white font-sans leading-tight">
                  {header.school_name}
                </h1>
                <p className="text-[11.5px] font-normal text-slate-200 mt-0.5 leading-tight">
                  {header.address}
                </p>
                
                {/* Gold Divider Line */}
                <div className="h-[1px] bg-amber-400/80 w-3/4 mx-auto my-1.5"></div>

                <div className="text-[12.5px] font-extrabold uppercase tracking-widest text-amber-400 leading-tight">
                  {header.report_card_title}
                </div>
                <p className="text-[11.5px] font-bold text-white uppercase tracking-widest mt-0.5">
                  SESSION {header.academic_session}
                </p>
              </div>

              {/* School Institute & DISE Codes */}
              <div className="shrink-0 text-right text-[11px] font-sans text-slate-200 space-y-1 pl-2">
                <div>Inst. Code: <span className="font-semibold text-white">{header.institute_code}</span></div>
                <div>DISE Code: <span className="font-semibold text-white">{header.dise_code}</span></div>
              </div>

            </div>
          </div>

          {/* ================= 2. STUDENT DETAILS ================= */}
          <div className="border border-sky-300 rounded-xs overflow-hidden shadow-2xs">
            <div className="bg-[#dbeafe] border-b border-sky-300 px-3 py-1 font-black text-[11.5px] uppercase tracking-wider text-[#0c2f66]">
              STUDENT DETAILS
            </div>
            
            <table className="w-full text-[11.5px] border-collapse bg-white">
              <tbody>
                {/* Row 1 */}
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 px-3 font-medium text-slate-600 w-32 bg-slate-50/60 border-r border-slate-200">
                    Student's Name :
                  </td>
                  <td className="py-1.5 px-3 font-black text-slate-950 uppercase tracking-wide w-[240px] border-r border-slate-200">
                    {student.student_name}
                  </td>
                  <td className="py-1.5 px-3 font-medium text-slate-600 w-32 bg-slate-50/60 border-r border-slate-200">
                    Class :
                  </td>
                  <td className="py-1.5 px-3 font-black text-slate-950 uppercase tracking-wide">
                    {student.class_name}
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 px-3 font-medium text-slate-600 bg-slate-50/60 border-r border-slate-200">
                    Father's Name :
                  </td>
                  <td className="py-1.5 px-3 font-black text-slate-900 uppercase border-r border-slate-200">
                    {student.father_name}
                  </td>
                  <td className="py-1.5 px-3 font-medium text-slate-600 bg-slate-50/60 border-r border-slate-200">
                    Scholar / SSID :
                  </td>
                  <td className="py-1.5 px-3 font-black text-slate-900">
                    {student.scholar_number || '—'}
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 px-3 font-medium text-slate-600 bg-slate-50/60 border-r border-slate-200">
                    Mother's Name :
                  </td>
                  <td className="py-1.5 px-3 font-black text-slate-900 uppercase border-r border-slate-200">
                    {student.mother_name}
                  </td>
                  <td className="py-1.5 px-3 font-medium text-slate-600 bg-slate-50/60 border-r border-slate-200">
                    Date of Birth :
                  </td>
                  <td className="py-1.5 px-3 font-bold text-slate-900">
                    {formatDate(student.date_of_birth)}
                  </td>
                </tr>

                {/* Row 4 */}
                <tr>
                  <td className="py-1.5 px-3 font-medium text-slate-600 bg-slate-50/60 border-r border-slate-200">
                    Roll Number :
                  </td>
                  <td className="py-1.5 px-3 font-black text-slate-950 border-r border-slate-200">
                    {student.roll_number}
                  </td>
                  <td className="py-1.5 px-3 font-medium text-slate-600 bg-slate-50/60 border-r border-slate-200">
                    Address :
                  </td>
                  <td className="py-1.5 px-3 font-bold text-slate-900">
                    {student.address || 'Indore (M.P.)'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ================= 3. ACADEMIC PERFORMANCE TABLE ================= */}
          <div className="border border-sky-300 rounded-xs overflow-hidden shadow-2xs">
            <div className="bg-[#dbeafe] border-b border-sky-300 px-3 py-1 font-black text-[11.5px] uppercase tracking-wider text-[#0c2f66]">
              ACADEMIC PERFORMANCE
            </div>

            <table className="w-full text-center text-[11.5px] border-collapse bg-white">
              <thead>
                {/* Main Header */}
                <tr className="bg-[#153e75] text-white font-bold">
                  <th rowSpan={2} className="border-r border-blue-400/40 p-2 text-left w-44 font-black tracking-wide">
                    Subject
                  </th>
                  <th colSpan={2} className="border-r border-blue-400/40 p-1.5 font-bold tracking-wide">
                    Half-Yearly Exam
                  </th>
                  <th colSpan={3} className="p-1.5 font-bold tracking-wide">
                    Annual Exam
                  </th>
                </tr>

                {/* Sub-headers */}
                <tr className="bg-[#153e75] text-white text-[11px] font-semibold border-t border-blue-400/30">
                  <th className="border-r border-blue-400/40 py-1.5 px-1 w-20 font-medium text-slate-100">
                    Max (100)
                  </th>
                  <th className="border-r border-blue-400/40 py-1.5 px-1 w-20 font-medium text-slate-100">
                    Obtained
                  </th>
                  <th className="border-r border-blue-400/40 py-1.5 px-1 w-20 font-medium text-slate-100">
                    Theory (75)
                  </th>
                  <th className="border-r border-blue-400/40 py-1.5 px-1 w-20 font-medium text-slate-100">
                    Pr./Int. (25)
                  </th>
                  <th className="py-1.5 px-1 w-24 font-bold text-white">
                    Total (100)
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {subjects_marks.map((row) => (
                  <tr key={row.subject_id} className="hover:bg-slate-50/60">
                    <td className="border-r border-slate-200 py-1.5 px-3 text-left font-bold text-slate-900 uppercase">
                      {row.subject_name}
                    </td>
                    <td className="border-r border-slate-200 py-1.5 px-1 font-mono text-slate-700">
                      {row.half_yearly_max}
                    </td>
                    <td className="border-r border-slate-200 py-1.5 px-1 font-mono font-bold text-slate-900">
                      {row.half_yearly_obtained !== null && row.half_yearly_obtained !== undefined
                        ? row.half_yearly_obtained
                        : '–'}
                    </td>
                    <td className="border-r border-slate-200 py-1.5 px-1 font-mono text-slate-700">
                      {row.annual_theory_obtained !== null && row.annual_theory_obtained !== undefined
                        ? row.annual_theory_obtained
                        : '–'}
                    </td>
                    <td className="border-r border-slate-200 py-1.5 px-1 font-mono text-slate-700">
                      {row.annual_practical_obtained !== null && row.annual_practical_obtained !== undefined
                        ? row.annual_practical_obtained
                        : '–'}
                    </td>
                    <td className="py-1.5 px-1 font-mono font-bold text-slate-950">
                      {row.annual_total_obtained !== null && row.annual_total_obtained !== undefined
                        ? row.annual_total_obtained
                        : '–'}
                    </td>
                  </tr>
                ))}

                {/* GRAND TOTAL ROW */}
                <tr className="bg-[#153e75] text-white font-black text-[12px] border-t-2 border-[#153e75]">
                  <td className="border-r border-blue-400/40 py-2 px-3 text-left uppercase tracking-wider font-black">
                    TOTAL
                  </td>
                  <td className="border-r border-blue-400/40 py-2 px-1 font-mono font-bold">
                    {totals.half_yearly_max}
                  </td>
                  <td className="border-r border-blue-400/40 py-2 px-1 font-mono font-black text-amber-300">
                    {totals.half_yearly_obtained}
                  </td>
                  <td className="border-r border-blue-400/40 py-2 px-1 font-mono font-bold">
                    {totals.annual_theory_obtained}
                  </td>
                  <td className="border-r border-blue-400/40 py-2 px-1 font-mono font-bold">
                    {totals.annual_practical_obtained}
                  </td>
                  <td className="py-2 px-1 font-mono font-black text-white">
                    {totals.annual_obtained_total}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ================= 4. RESULT SUMMARY BAR ================= */}
          <div className="border border-slate-300 p-2.5 bg-slate-50/80 rounded-xs flex items-center justify-between text-xs font-bold shadow-2xs">
            {/* Result */}
            <div className="flex items-center gap-2">
              <span className="text-slate-800 uppercase font-black text-[11.5px]">RESULT :</span>
              <span
                className={`text-[12px] uppercase font-black tracking-wider ${
                  result === 'PASS'
                    ? 'text-emerald-700 font-extrabold'
                    : result === 'FAIL'
                    ? 'text-rose-700 font-extrabold'
                    : 'text-rose-600 font-extrabold'
                }`}
              >
                {result}
              </span>
            </div>

            {/* Percentage */}
            <div className="flex items-center gap-2">
              <span className="text-slate-800 uppercase font-black text-[11.5px]">PERCENTAGE :</span>
              <div className="border border-slate-700 bg-white w-28 h-6.5 flex items-center justify-center font-mono font-black text-slate-950 text-xs">
                {!isPending && percentage > 0 ? `${percentage.toFixed(2)} %` : ''}
              </div>
            </div>

            {/* Division / Grade */}
            <div className="flex items-center gap-2">
              <span className="text-slate-800 uppercase font-black text-[11.5px]">DIVISION / GRADE :</span>
              <div className="border border-slate-700 bg-white w-20 h-6.5 flex items-center justify-center font-black text-slate-950 text-xs uppercase">
                {!isPending && division_grade ? division_grade : ''}
              </div>
            </div>
          </div>

        </div>

        {/* ================= 5. SIGNATURES & FOOTER SECTION ================= */}
        <div className="mt-8 space-y-5">
          {/* Signatures Row */}
          <div className="grid grid-cols-2 gap-12 items-end px-4">
            {/* Class Teacher Signature */}
            <div className="text-center space-y-1">
              <div className="h-12 flex items-end justify-center"></div>
              <p className="text-[12px] font-black text-slate-900 tracking-wide">
                Class Teacher's Signature
              </p>
              <p className="text-[11px] font-medium text-slate-600">
                ({signatures.class_teacher_name})
              </p>
            </div>

            {/* Principal Signature */}
            <div className="text-center space-y-1">
              <div className="h-12 flex items-end justify-center"></div>
              <p className="text-[12px] font-black text-slate-900 tracking-wide">
                Principal's Signature
              </p>
              <p className="text-[11px] font-medium text-slate-600">
                (Seal & Signature of Principal)
              </p>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="pt-2 border-t border-slate-400 flex justify-between items-center text-[10px] font-medium text-slate-700 px-1">
            <span>New Sunshine Public School • Result Management Portal 2026-27</span>
            <span>Date of Issue: {new Date().toLocaleDateString('en-GB')}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

