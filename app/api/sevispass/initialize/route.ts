import { NextRequest, NextResponse } from 'next/server';
import { initializeCollection } from '@/lib/aws/rekognition';

export async function POST(req: NextRequest) {
  try {
    // Initialize the SevisPass Rekognition collection
    const success = await initializeCollection();
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'SevisPass face collection initialized successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize face collection'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Collection initialization error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to initialize SevisPass collection'
    }, { status: 500 });
  }
}