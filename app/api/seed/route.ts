import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase/config'
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore'

const DEMO_DEPARTMENT_ID = 'cardiology-sheba'

const defaultDepartment = {
  name: 'מחלקת קרדיולוגיה - שיבא תל השומר',
  nameEn: 'Cardiology Department - Sheba',
  logoUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const defaultQuestions = [
  {
    questionText: 'איך היית מדרג/ת את החוויה הכללית שלך במחלקה?',
    questionType: 'emoji',
    options: [
      { value: '1', label: 'גרוע מאוד', emoji: '&#128545;' },
      { value: '2', label: 'לא טוב', emoji: '&#128543;' },
      { value: '3', label: 'בסדר', emoji: '&#128528;' },
      { value: '4', label: 'טוב', emoji: '&#128522;' },
      { value: '5', label: 'מעולה', emoji: '&#128525;' },
    ],
    isRequired: true,
    isDefault: true,
    displayOrder: 0,
    isActive: true,
  },
  {
    questionText: 'האם הצוות הרפואי התייחס אליך בכבוד ובאדיבות?',
    questionType: 'emoji',
    options: [
      { value: '1', label: 'בכלל לא', emoji: '&#128545;' },
      { value: '2', label: 'מעט', emoji: '&#128543;' },
      { value: '3', label: 'במידה בינונית', emoji: '&#128528;' },
      { value: '4', label: 'במידה רבה', emoji: '&#128522;' },
      { value: '5', label: 'במידה רבה מאוד', emoji: '&#128525;' },
    ],
    isRequired: true,
    isDefault: true,
    displayOrder: 1,
    isActive: true,
  },
  {
    questionText: 'האם קיבלת הסברים מספקים על הטיפול והתרופות?',
    questionType: 'choice',
    options: [
      { value: 'yes', label: 'כן, קיבלתי הסברים מלאים' },
      { value: 'partial', label: 'קיבלתי הסברים חלקיים' },
      { value: 'no', label: 'לא קיבלתי הסברים' },
      { value: 'na', label: 'לא רלוונטי' },
    ],
    isRequired: true,
    isDefault: true,
    displayOrder: 2,
    isActive: true,
  },
  {
    questionText: 'כמה כוכבים היית נותן/ת למחלקה?',
    questionType: 'stars',
    options: null,
    isRequired: true,
    isDefault: true,
    displayOrder: 3,
    isActive: true,
  },
  {
    questionText: 'יש לך הערות או הצעות לשיפור?',
    questionType: 'open_text',
    options: null,
    isRequired: false,
    isDefault: true,
    displayOrder: 4,
    isActive: true,
  },
]

export async function GET() {
  if (!db) {
    return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 })
  }

  try {
    // Check if department already exists
    const deptRef = doc(db, 'departments', DEMO_DEPARTMENT_ID)
    
    // Create department
    await setDoc(deptRef, defaultDepartment)
    
    // Check if questions already exist
    const questionsQuery = query(
      collection(db, 'questions'),
      where('departmentId', '==', DEMO_DEPARTMENT_ID)
    )
    const existingQuestions = await getDocs(questionsQuery)
    
    if (existingQuestions.empty) {
      // Add questions
      for (const question of defaultQuestions) {
        const questionRef = doc(collection(db, 'questions'))
        await setDoc(questionRef, {
          ...question,
          departmentId: DEMO_DEPARTMENT_ID,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully',
      departmentId: DEMO_DEPARTMENT_ID 
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
