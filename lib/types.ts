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
  role: 'admin' | 'super_admin' | 'staff' // Added 'staff' role
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
  questionText: string // Standardized field name
  questionType: QuestionType // Standardized field name
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
