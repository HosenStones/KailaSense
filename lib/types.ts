// Database types for Kaila Feedback System

export interface Department {
  id: string
  name: string
  nameEn?: string
  logoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface AdminUser {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'super_admin'
  departmentId: string | null
  createdAt: string
  updatedAt: string
}

export type QuestionType = 'emoji' | 'choice' | 'multi_choice' | 'stars' | 'open_text'

export interface QuestionOption {
  value: string
  label: string
  emoji?: string
}

export interface Question {
  id: string
  departmentId: string
  questionText: string
  questionType: QuestionType
  options?: QuestionOption[]
  isRequired: boolean
  isDefault: boolean
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SurveySession {
  id: string
  departmentId: string
  startedAt: string
  completedAt?: string
  isCompleted: boolean
  deviceInfo?: Record<string, unknown>
  source?: 'whatsapp' | 'sms' | 'qr' | 'link'
}

export interface Response {
  id: string
  sessionId: string
  questionId: string
  answerValue?: string
  answerValues?: string[]
  answerText?: string
  createdAt: string
}

// Survey state for the patient flow
export interface SurveyState {
  session: SurveySession | null
  questions: Question[]
  responses: Record<string, Response>
  currentQuestionIndex: number
  isComplete: boolean
}

// Statistics types
export interface DepartmentStats {
  totalResponses: number
  completionRate: number
  averageRating: number
  responsesByDay: { date: string; count: number }[]
  questionStats: QuestionStats[]
}

export interface QuestionStats {
  questionId: string
  questionText: string
  questionType: QuestionType
  totalResponses: number
  distribution: { value: string; count: number; percentage: number }[]
  averageScore?: number
}
