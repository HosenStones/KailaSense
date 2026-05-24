// Define runtime at the top level
export const runtime = 'edge';

import { NextResponse } from 'next/server';

// API route for processing automated messages
export async function GET(req: Request) {
  try {
    // Cron job logic will be implemented here
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
