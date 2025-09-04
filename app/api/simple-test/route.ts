import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Simple GET test working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Simple POST test working',
    timestamp: new Date().toISOString()
  });
}