import type { Classe, Student, Exercise, EvaluationCriterion, Submission, Grade, DashboardStats, AiFeedback } from '../types';

const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('redaction_auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = getAuthHeaders();
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { ...headers, ...((options?.headers as Record<string, string>) || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    // If unauthorized, clear auth and reload
    if (res.status === 401) {
      localStorage.removeItem('redaction_auth_token');
      localStorage.removeItem('redaction_auth_user');
      window.location.reload();
    }
    throw new Error(err.error || 'Erreur serveur');
  }
  return res.json();
}

// Classes
export const getClasses = () => request<Classe[]>('/classes');
export const getClass = (id: number) => request<Classe>(`/classes/${id}`);
export const createClass = (data: Partial<Classe>) => request<Classe>('/classes', { method: 'POST', body: JSON.stringify(data) });
export const updateClass = (id: number, data: Partial<Classe>) => request<Classe>(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteClass = (id: number) => request<{ success: boolean }>(`/classes/${id}`, { method: 'DELETE' });

// Students
export const getStudents = () => request<Student[]>('/students');
export const getStudent = (id: number) => request<Student>(`/students/${id}`);
export const createStudent = (data: Partial<Student>) => request<Student>('/students', { method: 'POST', body: JSON.stringify(data) });
export const updateStudent = (id: number, data: Partial<Student>) => request<Student>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteStudent = (id: number) => request<{ success: boolean }>(`/students/${id}`, { method: 'DELETE' });

// Exercises
export const getExercises = () => request<Exercise[]>('/exercises');
export const getExercise = (id: number) => request<Exercise>(`/exercises/${id}`);
export const createExercise = (data: Partial<Exercise>) => request<Exercise>('/exercises', { method: 'POST', body: JSON.stringify(data) });
export const updateExercise = (id: number, data: Partial<Exercise>) => request<Exercise>(`/exercises/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteExercise = (id: number) => request<{ success: boolean }>(`/exercises/${id}`, { method: 'DELETE' });

// Criteria
export const getCriteria = () => request<EvaluationCriterion[]>('/criteria');
export const createCriterion = (data: Partial<EvaluationCriterion>) => request<EvaluationCriterion>('/criteria', { method: 'POST', body: JSON.stringify(data) });
export const updateCriterion = (id: number, data: Partial<EvaluationCriterion>) => request<EvaluationCriterion>(`/criteria/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCriterion = (id: number) => request<{ success: boolean }>(`/criteria/${id}`, { method: 'DELETE' });

// Submissions
export const getSubmissions = (params?: { exercise_id?: number; student_id?: number }) => {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return request<Submission[]>(`/submissions${query}`);
};
export const getSubmission = (id: number) => request<Submission>(`/submissions/${id}`);
export const createSubmission = (data: { exercise_id: number; student_id: number; content?: string }) =>
  request<Submission>('/submissions', { method: 'POST', body: JSON.stringify(data) });
export const updateSubmission = (id: number, data: { content: string }) =>
  request<Submission>(`/submissions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSubmission = (id: number) => request<{ success: boolean }>(`/submissions/${id}`, { method: 'DELETE' });

// Grades
export const saveGrades = (submissionId: number, grades: { criterion_id: number; score: number; comment: string }[]) =>
  request<Grade[]>(`/grades/submission/${submissionId}`, { method: 'POST', body: JSON.stringify({ grades }) });

// Stats
export const getDashboardStats = () => request<DashboardStats>('/stats/dashboard');
export const getStudentProgress = (studentId: number) => request<any[]>(`/stats/student/${studentId}/progress`);
export const getClassPerformance = (classId: number) => request<any[]>(`/stats/class/${classId}/performance`);

// AI
export const generateAiFeedback = (submissionId: number, customPrompt?: string) =>
  request<{ feedback: string; source: string }>(`/ai/feedback/${submissionId}`, {
    method: 'POST',
    body: JSON.stringify({ custom_prompt: customPrompt }),
  });
export const getAiFeedback = (submissionId: number) => request<AiFeedback[]>(`/ai/feedback/${submissionId}`);
