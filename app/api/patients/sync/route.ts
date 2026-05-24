export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { syncPatientData } from '@/lib/firebase/firestore';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.patientId || !body.status || !body.departmentId) {
      return NextResponse.json(
        { error: 'Missing required patient fields.' },
        { status: 400 }
      );
    }

    await syncPatientData(body);

    return NextResponse.json({ 
      success: true, 
      message: `Patient ${body.patientId} synced successfully.` 
    });

  } catch (error) {
    console.error('Error syncing patient data:', error);
    return NextResponse.json(
      { error: 'Internal server error.' }, 
      { status: 500 }
    );
  }
}
