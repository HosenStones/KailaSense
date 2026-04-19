/**
 * Firebase Seed Script
 * 
 * This script creates initial data in Firebase:
 * 1. A Super Admin user
 * 2. A first department with default questions
 * 
 * To run this script:
 * 1. First, create a user in Firebase Authentication console with email/password
 * 2. Copy the user's UID
 * 3. Run: npx tsx scripts/seed-firebase.ts <USER_UID> <USER_EMAIL> <USER_FULL_NAME>
 * 
 * Example:
 * npx tsx scripts/seed-firebase.ts abc123xyz admin@hospital.com "דני כהן"
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc, addDoc, Timestamp } from 'firebase/firestore'

// Firebase config - same as in the app
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Default questions for new departments
const defaultQuestions = [
  {
    questionText: 'איך היה הטיפול שקיבלת היום?',
    questionType: 'emoji',
    isRequired: true,
    isDefault: true,
    displayOrder: 0,
    isActive: true,
  },
  {
    questionText: 'כמה מרוצה את/ה מהיחס של הצוות?',
    questionType: 'stars',
    isRequired: true,
    isDefault: true,
    displayOrder: 1,
    isActive: true,
  },
  {
    questionText: 'האם קיבלת מידע מספק על מצבך?',
    questionType: 'choice',
    options: [
      { value: 1, label: 'כן, מאוד' },
      { value: 2, label: 'כן, חלקית' },
      { value: 3, label: 'לא מספיק' },
      { value: 4, label: 'לא קיבלתי מידע' },
    ],
    isRequired: true,
    isDefault: true,
    displayOrder: 2,
    isActive: true,
  },
  {
    questionText: 'מה עזר לך במיוחד היום?',
    questionType: 'multi_choice',
    options: [
      { value: 1, label: 'היחס האישי' },
      { value: 2, label: 'המקצועיות' },
      { value: 3, label: 'זמן ההמתנה הקצר' },
      { value: 4, label: 'הסברים ברורים' },
      { value: 5, label: 'הנגישות' },
    ],
    isRequired: false,
    isDefault: true,
    displayOrder: 3,
    isActive: true,
  },
  {
    questionText: 'יש לך הערות או הצעות לשיפור?',
    questionType: 'open_text',
    isRequired: false,
    isDefault: true,
    displayOrder: 4,
    isActive: true,
  },
]

async function seedFirebase() {
  const args = process.argv.slice(2)
  
  if (args.length < 3) {
    console.log('Usage: npx tsx scripts/seed-firebase.ts <USER_UID> <USER_EMAIL> <USER_FULL_NAME>')
    console.log('Example: npx tsx scripts/seed-firebase.ts abc123xyz admin@hospital.com "דני כהן"')
    process.exit(1)
  }

  const [userUid, userEmail, userFullName] = args

  console.log('Initializing Firebase...')
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)

  try {
    // 1. Create Super Admin user
    console.log('Creating Super Admin user...')
    await setDoc(doc(db, 'admin_users', userUid), {
      email: userEmail,
      fullName: userFullName,
      role: 'super_admin',
      departmentId: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    console.log('Super Admin user created successfully!')

    // 2. Create first department
    console.log('Creating first department...')
    const departmentRef = await addDoc(collection(db, 'departments'), {
      name: 'קרדיולוגיה - שיבא',
      description: 'מחלקת קרדיולוגיה בבית החולים שיבא',
      logoUrl: null,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    const departmentId = departmentRef.id
    console.log(`Department created with ID: ${departmentId}`)

    // 3. Add default questions to the department
    console.log('Adding default questions...')
    for (const question of defaultQuestions) {
      await addDoc(collection(db, 'questions'), {
        ...question,
        departmentId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    }
    console.log('Default questions added successfully!')

    console.log('\n✅ Firebase seeded successfully!')
    console.log('\nNext steps:')
    console.log('1. Go to the app and login with your admin credentials')
    console.log('2. You should see the Super Admin button in the admin dashboard')
    console.log('3. You can create more departments and users from there')
    console.log(`\nDepartment ID for survey link: ${departmentId}`)
    console.log(`Survey URL: /survey/${departmentId}`)

  } catch (error) {
    console.error('Error seeding Firebase:', error)
    process.exit(1)
  }
}

seedFirebase()
