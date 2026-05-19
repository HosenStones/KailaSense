// Database types for Kaila Feedback System

// --- Schedule & Department Types ---
export interface DepartmentSchedule {
  timingType: 'on_arrival' | 'days_after' | 'before_discharge' | 'after_discharge'
  daysValue?: number
  messageTemplate: string
}

export interface Department {
  id: string
  name: string
  nameEn?: string
  logoUrl?: string
  activeQuestions?: string[] // Mapped IDs of active questions
  schedules?: DepartmentSchedule[] // WhatsApp scheduling config
  createdAt: string
  updatedAt: string
}

// --- User Types ---
export interface AdminUser {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'super_admin' | 'staff'
  departmentId: string | null
  createdAt: string
  updatedAt: string
}

// --- Question & Content Types ---
export type ContentType = 'image' | 'video' | 'info_text'
export type QuestionType = 'emoji' | 'choice' | 'multi_choice' | 'stars' | 'open_text' | 'content'
export type QuestionCategory = 'admission' | 'during' | 'discharge' | 'general'

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
  
  // Fields for content blocks (when questionType === 'content')
  contentType?: ContentType
  contentUrl?: string
  contentBody?: string
  
  // Question bank categorization
  category?: QuestionCategory

  options?: QuestionOption[]
  isRequired: boolean
  isDefault: boolean
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// --- Session & Response Types ---
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
