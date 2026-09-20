export type Role = 'SUPER_ADMIN' | 'PRINCIPAL' | 'CLASS_TEACHER';

export interface User {
  id: number;
  username: string;
  email?: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  teacher_profile?: {
    id: number;
    assigned_class_id?: number;
    assigned_class_name?: string;
    designation?: string;
    contact_number?: string;
  };
  permissions: string[];
}

export interface ClassSubject {
  id: number;
  subject_id: number;
  subject_name: string;
  subject_code?: string;
  display_order: number;
  default_half_yearly_max: number;
  default_annual_theory_max: number;
  default_annual_practical_max: number;
}

export interface AcademicClass {
  id: number;
  name: string;
  display_order: number;
  students_count: number;
  assigned_teacher?: {
    user_id: number;
    full_name: string;
    designation?: string;
  };
  subjects: ClassSubject[];
}

export interface Subject {
  id: number;
  name: string;
  code?: string;
}

export interface Student {
  id: number;
  class_id: number;
  class_name?: string;
  student_name: string;
  father_name: string;
  mother_name: string;
  date_of_birth?: string;
  contact_number?: string;
  scholar_number?: string;
  roll_number: string | number;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  completion_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE';
  percentage: number;
  pass_fail_status?: 'PASS' | 'FAIL' | 'SUPPLEMENTARY';
}

export interface StudentSubjectMarksRow {
  subject_id: number;
  subject_name: string;
  display_order: number;
  half_yearly_max: number;
  half_yearly_obtained?: number | null;
  annual_theory_max: number;
  annual_theory_obtained?: number | null;
  annual_practical_max: number;
  annual_practical_obtained?: number | null;
  annual_max: number;
  annual_total_obtained?: number | null;
}

export interface StudentMarksDetail {
  student_id: number;
  student_name: string;
  roll_number: string | number;
  scholar_number?: string;
  class_id: number;
  class_name: string;
  rows: StudentSubjectMarksRow[];
  half_yearly_total_max: number;
  half_yearly_total_obtained: number;
  annual_theory_total_obtained: number;
  annual_practical_total_obtained: number;
  annual_total_max: number;
  annual_total_obtained: number;
  percentage: number;
  pass_fail_status?: string;
  division_grade?: string;
  completion_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE';
}

export interface MarkEntryItem {
  subject_id: number;
  exam_type: 'HALF_YEARLY' | 'ANNUAL';
  max_marks: number;
  theory_max?: number;
  theory_obtained?: number | null;
  practical_max?: number;
  practical_obtained?: number | null;
  obtained_marks?: number | null;
}

export interface BatchMarksEntryRequest {
  student_id: number;
  exam_type: 'HALF_YEARLY' | 'ANNUAL';
  marks: MarkEntryItem[];
  division_grade?: string;
}

export interface ResultItem {
  id: number;
  student_id: number;
  student_name?: string;
  roll_number?: string | number;
  scholar_number?: string;
  class_id?: number;
  class_name?: string;
  half_yearly_total: number;
  annual_total: number;
  annual_max_marks: number;
  percentage: number;
  pass_fail_status?: 'PASS' | 'FAIL' | 'SUPPLEMENTARY';
  division_grade?: string;
  completion_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE';
  finalized_by?: number;
  finalized_at?: string;
  updated_at: string;
}

export interface ClassResultSummary {
  class_id: number;
  class_name: string;
  total_students: number;
  completed_count: number;
  in_progress_count: number;
  pending_count: number;
  passed_count: number;
  failed_count: number;
  results: ResultItem[];
}

export interface AllClassesOverviewItem {
  class_id: number;
  class_name: string;
  total_students: number;
  completed_results: number;
  passed_count: number;
  failed_count: number;
  can_edit_marks: boolean;
}

export interface ReportCardResponse {
  header: {
    school_name: string;
    address: string;
    institute_code: string;
    dise_code: string;
    academic_session: string;
    report_card_title: string;
    logo_url: string;
  };
  student: {
    id: number;
    student_name: string;
    father_name: string;
    mother_name: string;
    date_of_birth?: string;
    contact_number?: string;
    scholar_number?: string;
    roll_number: string | number;
    class_name: string;
    address?: string;
  };
  subjects_marks: StudentSubjectMarksRow[];
  totals: {
    half_yearly_max: number;
    half_yearly_obtained: number;
    annual_theory_max: number;
    annual_theory_obtained: number;
    annual_practical_max: number;
    annual_practical_obtained: number;
    annual_max_total: number;
    annual_obtained_total: number;
  };
  result: string;
  percentage: number;
  division_grade?: string;
  completion_status: string;
  signatures: {
    class_teacher_name: string;
    principal_name: string;
  };
}

export interface SchoolSetting {
  id: number;
  school_name: string;
  address: string;
  institute_code: string;
  dise_code: string;
  academic_session: string;
  report_card_title: string;
  passing_percentage: number;
  subject_wise_min_rule: boolean;
  subject_min_percentage: number;
  logo_url: string;
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  username?: string;
  action: string;
  entity_type: string;
  entity_id?: number;
  student_name?: string;
  class_name?: string;
  subject_name?: string;
  details?: string;
  created_at: string;
}

export interface StudentImportPreviewItem {
  row_number: number;
  class_id?: number;
  class_name: string;
  roll_number: string | number;
  scholar_number?: string;
  student_name: string;
  father_name: string;
  mother_name: string;
  date_of_birth?: string;
  contact_number?: string;
  address?: string;
  status: string;
  errors: string[];
}

export interface StudentImportPreviewResponse {
  total_rows: number;
  valid_count: number;
  error_count: number;
  items: StudentImportPreviewItem[];
}
