import { NextRequest, NextResponse } from 'next/server';
import { SevisPassService } from '@/lib/services/sevispass-service';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameter
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    console.log('🔍 Checking SevisPass for userId:', userId);
    
    // Use the same service method that works for /sevispass/view
    const sevisPassHolder = await SevisPassService.getSevisPassHolder(userId);
    
    if (sevisPassHolder) {
      console.log('✅ SevisPass found for user:', userId);
      return NextResponse.json({
        hasSevisPass: true,
        sevisPassData: sevisPassHolder
      });
    } else {
      console.log('❌ No SevisPass found for user:', userId);
      return NextResponse.json({
        hasSevisPass: false,
        sevisPassData: null
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking SevisPass:', error);
    return NextResponse.json({
      hasSevisPass: false,
      sevisPassData: null,
      error: 'Failed to check SevisPass'
    }, { status: 500 });
  }
}