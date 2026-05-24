import { NextResponse } from 'next/server';
import { syncPatientData } from '@/lib/firebase/firestore';

// Webhook endpoint to receive patient updates from the hospital IT system
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Basic validation to ensure required fields are present
    if (!body.patientId || !body.status || !body.departmentId) {
      return NextResponse.json(
        { error: 'Missing required patient fields (patientId, status, departmentId).' },
        { status: 400 }
      );
    }

    // Pass the payload to Firebase to insert/update the patient record
    await syncPatientData(body);

    return NextResponse.json({ 
      success: true, 
      message: `Patient ${body.patientId} synced successfully.` 
    });

  } catch (error) {
    console.error('Error syncing patient data:', error);
    return NextResponse.json(
      { error: 'Internal server error while syncing patient.' }, 
      { status: 500 }
    );
  }
}
