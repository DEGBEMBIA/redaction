export interface Classe {
  id: number;
  name: string;
  level: string;
  description: string;
  created_at: string;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  class_id: number;
  created_at: string;
  class_name?: string;
}

export interface Exercise {
  id: number;
  title: string;
  subject: string;
  description: string;
  class_id: number;
  class_name?: string;
  due_date: string;
  created_at: string;
}

export interface EvaluationCriterion {
  id: number;
  name: string;
  description: string;
  max_score: number;
  weight: number;
}

export interface Submission {
  id: number;
  exercise_id: number;
  student_id: number;
  content: string;
  submitted_at: string;
  student_name?: string;
  exercise_title?: string;
  grades?: Grade[];
  ai_feedback?: AiFeedback[];
}

export interface Grade {
  id: number;
  submission_id: number;
  criterion_id: number;
  score: number;
  comment: string;
  created_at: string;
  criterion_name?: string;
  max_score?: number;
  weight?: number;
}

export interface AiFeedback {
  id: number;
  submission_id: number;
  feedback: string;
  created_at: string;
}

export interface DashboardStats {
  total_students: number;
  total_classes: number;
  total_exercises: number;
  total_submissions: number;
  average_score: number;
  recent_submissions: (Submission & { student_name: string; exercise_title: string })[];
  class_distribution: { name: string; count: number }[];
  top_students: { id: number; name: string; avg_score: number }[];
}
