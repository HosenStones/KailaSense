import { SurveyContainer } from '@/components/survey/survey-container'
import { demoDepartment, demoQuestions } from '@/lib/demo-data'
import { getDepartment, getQuestionsByDepartment } from '@/lib/firebase/firestore'

interface SurveyPageProps {
  params: Promise<{
    departmentId: string
  }>
  searchParams: Promise<{
    source?: string
  }>
}

export default async function SurveyPage({ params, searchParams }: SurveyPageProps) {
  const { departmentId } = await params
  const { source } = await searchParams

  // Try to fetch from Firebase, fall back to demo data
  let department = await getDepartment(departmentId)
  let questions = await getQuestionsByDepartment(departmentId)

  // Use demo data if no Firebase data
  if (!department || questions.length === 0) {
    department = demoDepartment
    questions = demoQuestions
  }

  return (
    <main className="min-h-screen bg-background">
      <SurveyContainer
        department={department}
        questions={questions}
        source={source}
      />
    </main>
  )
}

export async function generateMetadata({ params }: SurveyPageProps) {
  const { departmentId } = await params
  const department = await getDepartment(departmentId)

  return {
    title: department ? `משוב - ${department.name}` : 'משוב מטופלים - Kaila',
    description: 'שתפו אותנו בחוויה שלכם כדי שנוכל להשתפר',
  }
}
