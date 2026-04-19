import { NextResponse } from 'next/server'
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

// Default questions for new departments
const defaultQuestions = [
  {
    questionText: 'איך היית מדרג/ת את חווית השירות הכללית?',
    questionType: 'emoji',
    isRequired: true,
    isDefault: true,
    displayOrder: 0,
  },
  {
    questionText: 'עד כמה הצוות הרפואי היה קשוב לצרכים שלך?',
    questionType: 'stars',
    isRequired: true,
    isDefault: true,
    displayOrder: 1,
  },
  {
    questionText: 'מה הכי תרם לחוויה שלך?',
    questionType: 'choice',
    options: [
      { value: 1, label: 'יחס אישי וחם' },
      { value: 2, label: 'מקצועיות הצוות' },
      { value: 3, label: 'זמני המתנה קצרים' },
      { value: 4, label: 'סביבה נעימה ונקייה' },
    ],
    isRequired: true,
    isDefault: true,
    displayOrder: 2,
  },
  {
    questionText: 'אילו שירותים נוספים היית רוצה לראות?',
    questionType: 'multi_choice',
    options: [
      { value: 1, label: 'אפליקציה לתורים' },
      { value: 2, label: 'תזכורות SMS' },
      { value: 3, label: 'שירות וידאו' },
      { value: 4, label: 'צ\'אט עם רופא' },
    ],
    isRequired: false,
    isDefault: true,
    displayOrder: 3,
  },
  {
    questionText: 'יש לך הצעות או הערות נוספות?',
    questionType: 'open_text',
    isRequired: false,
    isDefault: true,
    displayOrder: 4,
  },
]

export async function POST(request: Request) {
  if (!db) {
    return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { userUid, userEmail, userFullName, action } = body

    if (action === 'check') {
      // Check if setup is needed
      const depsSnapshot = await getDocs(collection(db, 'departments'))
      const usersSnapshot = await getDocs(collection(db, 'admin_users'))
      
      return NextResponse.json({
        hasDepartments: !depsSnapshot.empty,
        hasUsers: !usersSnapshot.empty,
        departmentCount: depsSnapshot.size,
        userCount: usersSnapshot.size,
      })
    }

    if (action === 'setup') {
      if (!userUid || !userEmail || !userFullName) {
        return NextResponse.json({ 
          error: 'Missing required fields: userUid, userEmail, userFullName' 
        }, { status: 400 })
      }

      const batch = writeBatch(db)

      // Create super admin user
      const userRef = doc(db, 'admin_users', userUid)
      batch.set(userRef, {
        email: userEmail,
        fullName: userFullName,
        role: 'super_admin',
        departmentId: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      // Create first department
      const deptId = 'cardiology-sheba'
      const deptRef = doc(db, 'departments', deptId)
      batch.set(deptRef, {
        name: 'קרדיולוגיה - שיבא',
        hospitalName: 'בית חולים שיבא',
        logoUrl: '/images/kaila-logo-vertical.png',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      // Create default questions
      for (const q of defaultQuestions) {
        const questionRef = doc(collection(db, 'questions'))
        batch.set(questionRef, {
          departmentId: deptId,
          ...q,
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      }

      await batch.commit()

      return NextResponse.json({
        success: true,
        message: 'Setup completed successfully',
        data: {
          superAdminId: userUid,
          departmentId: deptId,
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ 
      error: 'Setup failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'KailaSense Setup API',
    instructions: {
      check: 'POST with { "action": "check" } to check current status',
      setup: 'POST with { "action": "setup", "userUid": "...", "userEmail": "...", "userFullName": "..." } to initialize',
    }
  })
}
