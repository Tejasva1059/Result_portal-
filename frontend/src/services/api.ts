import {
  User,
  AcademicClass,
  Subject,
  Student,
  StudentMarksDetail,
  BatchMarksEntryRequest,
  ClassResultSummary,
  AllClassesOverviewItem,
  ReportCardResponse,
  SchoolSetting,
  AuditLogItem,
  StudentImportPreviewResponse,
  StudentImportPreviewItem,
  ResultItem
} from '../types';

const envApiUrl = import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL as string).replace(/\/$/, '') : '';
const API_BASE = envApiUrl ? `${envApiUrl}/api` : '/api';

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('access_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    let errorDetail = 'An error occurred';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = response.statusText || `HTTP error ${response.status}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Authentication
  auth: {
    login: async (username: string, password: string): Promise<{ access_token: string; user: User }> => {
      const resp = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      return handleResponse(resp);
    },
    getMe: async (): Promise<User> => {
      const resp = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeader(),
      });
      return handleResponse(resp);
    },
    logout: async (): Promise<{ message: string }> => {
      try {
        const resp = await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: getAuthHeader(),
        });
        return handleResponse(resp);
      } finally {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
      }
    }
  },

  // Academic Classes & Subjects
  classes: {
    getAll: async (): Promise<AcademicClass[]> => {
      const resp = await fetch(`${API_BASE}/classes`, { headers: getAuthHeader() });
      return handleResponse(resp);
    },
    getById: async (id: number): Promise<AcademicClass> => {
      const resp = await fetch(`${API_BASE}/classes/${id}`, { headers: getAuthHeader() });
      return handleResponse(resp);
    }
  },

  subjects: {
    getAll: async (): Promise<Subject[]> => {
      const resp = await fetch(`${API_BASE}/subjects`, { headers: getAuthHeader() });
      return handleResponse(resp);
    }
  },

  // Students
  students: {
    getAll: async (params?: { class_id?: number; search?: string }): Promise<Student[]> => {
      const query = new URLSearchParams();
      if (params?.class_id) query.append('class_id', params.class_id.toString());
      if (params?.search) query.append('search', params.search);
      const resp = await fetch(`${API_BASE}/students?${query.toString()}`, { headers: getAuthHeader() });
      return handleResponse(resp);
    },
    getById: async (id: number): Promise<Student> => {
      const resp = await fetch(`${API_BASE}/students/${id}`, { headers: getAuthHeader() });
      return handleResponse(resp);
    },
    create: async (data: Partial<Student>): Promise<Student> => {
      const resp = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(data),
      });
      return handleResponse(resp);
    },
    update: async (id: number, data: Partial<Student>): Promise<Student> => {
      const resp = await fetch(`${API_BASE}/students/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(data),
      });
      return handleResponse(resp);
    },
    delete: async (id: number): Promise<{ message: string }> => {
      const resp = await fetch(`${API_BASE}/students/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      return handleResponse(resp);
    },
    previewImport: async (file: File): Promise<StudentImportPreviewResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('access_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await fetch(`${API_BASE}/students/import/preview`, {
        method: 'POST',
        headers,
        body: formData,
      });
      return handleResponse(resp);
    },
    commitImport: async (items: StudentImportPreviewItem[]): Promise<{ message: string; imported_count: number }> => {
      const resp = await fetch(`${API_BASE}/students/import/commit`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(items),
      });
      return handleResponse(resp);
    }
  },

  // Marks
  marks: {
    getStudentMarks: async (studentId: number): Promise<StudentMarksDetail> => {
      const resp = await fetch(`${API_BASE}/marks/student/${studentId}`, { headers: getAuthHeader() });
      return handleResponse(resp);
    },
    saveBatchMarks: async (data: BatchMarksEntryRequest): Promise<any> => {
      const resp = await fetch(`${API_BASE}/marks/batch`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(data),
      });
      return handleResponse(resp);
    },
    getClassSummary: async (classId: number): Promise<any> => {
      const resp = await fetch(`${API_BASE}/marks/class-summary/${classId}`, { headers: getAuthHeader() });
      return handleResponse(resp);
    }
  },

  // Results
  results: {
    getClassResults: async (classId: number): Promise<ClassResultSummary> => {
      const resp = await fetch(`${API_BASE}/results/class/${classId}`, { headers: getAuthHeader() });
      return handleResponse(resp);
    },
    getAllClassesOverview: async (): Promise<AllClassesOverviewItem[]> => {
      const resp = await fetch(`${API_BASE}/results/all-classes`, { headers: getAuthHeader() });
      return handleResponse(resp);
    },
    updateDivisionGrade: async (studentId: number, divisionGrade: string): Promise<ResultItem> => {
      const resp = await fetch(`${API_BASE}/results/student/${studentId}/division-grade`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ division_grade: divisionGrade }),
      });
      return handleResponse(resp);
    },
    recalculate: async (studentId: number): Promise<ResultItem> => {
      const resp = await fetch(`${API_BASE}/results/student/${studentId}/recalculate`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      return handleResponse(resp);
    }
  },

  // Report Cards
  reportCards: {
    getStudentReportCard: async (studentId: number): Promise<ReportCardResponse> => {
      const resp = await fetch(`${API_BASE}/report-cards/student/${studentId}`, { headers: getAuthHeader() });
      return handleResponse(resp);
    },
    getClassReportCards: async (classId: number): Promise<ReportCardResponse[]> => {
      const resp = await fetch(`${API_BASE}/report-cards/class/${classId}`, { headers: getAuthHeader() });
      return handleResponse(resp);
    }
  },

  // School Settings
  settings: {
    get: async (): Promise<SchoolSetting> => {
      const resp = await fetch(`${API_BASE}/settings`, { headers: getAuthHeader() });
      return handleResponse(resp);
    },
    update: async (data: Partial<SchoolSetting>): Promise<SchoolSetting> => {
      const resp = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(data),
      });
      return handleResponse(resp);
    }
  },

  // Users Management
  users: {
    getAll: async (): Promise<User[]> => {
      const resp = await fetch(`${API_BASE}/users`, { headers: getAuthHeader() });
      return handleResponse(resp);
    },
    create: async (data: any): Promise<User> => {
      const resp = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(data),
      });
      return handleResponse(resp);
    },
    update: async (id: number, data: any): Promise<User> => {
      const resp = await fetch(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(data),
      });
      return handleResponse(resp);
    },
    toggleStatus: async (id: number): Promise<User> => {
      const resp = await fetch(`${API_BASE}/users/${id}/toggle-status`, {
        method: 'PUT',
        headers: getAuthHeader(),
      });
      return handleResponse(resp);
    }
  },

  // Audit Logs
  audit: {
    getAll: async (params?: { action?: string; limit?: number }): Promise<AuditLogItem[]> => {
      const query = new URLSearchParams();
      if (params?.action) query.append('action', params.action);
      if (params?.limit) query.append('limit', params.limit.toString());
      const resp = await fetch(`${API_BASE}/audit-logs?${query.toString()}`, { headers: getAuthHeader() });
      return handleResponse(resp);
    }
  }
};
