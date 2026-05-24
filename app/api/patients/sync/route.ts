export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { syncPatientData } from '@/lib/firebase/firestore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.patientId || !body.status || !body.departmentId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }
    await syncPatientData(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
