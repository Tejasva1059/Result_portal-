import React, { useState } from 'react';
import { X, Printer, Download, Loader2 } from 'lucide-react';
import { ReportCardDocument } from './ReportCardDocument';
import { ReportCardResponse } from '../../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '../../context/ToastContext';
import { printSingleReportCard } from '../../utils/printReportCard';

interface ReportCardPreviewModalProps {
  data: ReportCardResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportCardPreviewModal: React.FC<ReportCardPreviewModalProps> = ({
  data,
  isOpen,
  onClose,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const { success, error } = useToast();

  if (!isOpen || !data) return null;

  const docId = `preview-report-card-${data.student.id}`;

  const handlePrint = () => {
    printSingleReportCard(docId);
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById(docId);
    if (!element) {
      error('Report card element not found for export');
      return;
    }
    
    setIsExportingPdf(true);
    try {
      // Capture element with html2canvas at high resolution
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
        scrollX: 0,
        scrollY: 0,
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      // Standard A4 portrait dimensions are exactly 210mm x 297mm.
      // Full-bleed mapping directly maps the rendered document to the physical page.
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      
      const safeStudentName = (data.student.student_name || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeClassName = (data.student.class_name || 'Class').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `ReportCard_${safeStudentName}_Class_${safeClassName}.pdf`;
      
      pdf.save(filename);
      success(`Downloaded ${filename}`);
    } catch (err: any) {
      console.error('PDF export error:', err);
      error('Failed to generate PDF. Please try browser print to PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Modal Card */}
      <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="no-print bg-navy-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold">Report Card Preview</h2>
            <p className="text-xs text-slate-400">
              {data.student.student_name} • Roll No: {data.student.roll_number} • Class: {data.student.class_name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-600 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-300/80 flex justify-center items-start">
          <div className="shadow-2xl my-auto">
            <ReportCardDocument id={docId} data={data} />
          </div>
        </div>

      </div>
    </div>
  );
};

