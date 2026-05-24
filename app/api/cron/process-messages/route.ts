export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    // Logic for processing messages will go here
    return NextResponse.json({ 
      success: true, 
      message: 'Cron job executed successfully.' 
    });
  } catch (error) {
    console.error('Error processing automated messages:', error);
    return NextResponse.json(
      { error: 'Failed to process messages.' }, 
      { status: 500 }
    );
  }
}
