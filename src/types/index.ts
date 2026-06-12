// ==============================================
// Shared types for the Exam Portal application
// ==============================================

// ---- Roles ----
export type UserRole = 'STUDENT' | 'ADMIN';

// ---- Question Types ----
export type QuestionType = 'MCQ' | 'MSQ' | 'NAT' | 'DESCRIPTIVE';

// ---- Question Status (Test Engine) ----
export enum QuestionStatus {
  NOT_VISITED = 0,
  NOT_ANSWERED = 1,
  ANSWERED = 2,
  MARKED_FOR_REVIEW = 3,
  ANSWERED_AND_MARKED = 4,
}

// ---- User ----
export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  isSuperAdmin: boolean;
}

export interface SessionPayload {
  userId: string;
  role: UserRole;
}

// ---- Exam / Question / Option (Client-facing) ----
export interface ExamOption {
  id: string;
  text: string;
}

export interface ExamQuestion {
  id: string;
  text: string;
  type: QuestionType;
  section: string;
  maxMarks: number;
  mediaUrl: string | null;
  options: ExamOption[];
}

export interface ExamForTestEngine {
  id: string;
  title: string;
  durationMinutes: number;
  fullscreenChances: number;
  shuffleQuestions?: boolean;
  questions: ExamQuestion[];
}

// ---- Question Data (Admin - Create Exam) ----
export interface QuestionInput {
  text: string;
  type: QuestionType;
  section?: string;
  maxMarks: number | string;
  mediaFileId?: string;
  correctNumeric?: number | string;
  correctText?: string;
  explanation?: string;
  options: { text: string; isCorrect: boolean }[];
}

// ---- Server Action Results ----
export interface ActionResult {
  success?: boolean;
  error?: string;
}

export interface LoginResult extends ActionResult {
  role?: UserRole;
}

export interface CreateExamResult extends ActionResult {
  examId?: string;
}

// ---- AI Insights ----
export interface AIInsightsData {
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

export interface AIInsightsResponse {
  insights: AIInsightsData | null;
  message?: string;
  error?: string;
}

// ---- Pie Chart ----
export interface PieSegment {
  label: string;
  value: number;
  color: string;
}
