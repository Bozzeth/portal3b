import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithAmplifyServerContext } from '@/lib/utils/amplifyServerUtils';
import { analyzeIdentityDocument, base64ToUint8Array } from '@/lib/aws/rekognition';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentImage } = body;

    if (!documentImage) {
      return NextResponse.json(
        { error: "Document image is required" },
        { status: 400 }
      );
    }

    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        console.log("Testing Rekognition ID document analysis");
        
        const documentBytes = base64ToUint8Array(documentImage);
        const analysisResult = await analyzeIdentityDocument(
          documentBytes,
          contextSpec
        );

        return {
          analysis: analysisResult,
          timestamp: new Date().toISOString()
        };
      }
    });

    return NextResponse.json({
      success: true,
      message: "Rekognition ID document analysis completed",
      ...result
    });

  } catch (error) {
    console.error('ID analysis test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to analyze document'
    }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: "POST a document image to test Rekognition ID analysis",
    usage: {
      method: "POST",
      body: {
        documentImage: "base64 encoded image string"
      }
    },
    features: [
      "PNG passport MRZ parsing",
      "Name extraction with multiple patterns",
      "Document number detection",
      "Date of birth parsing",
      "Nationality detection"
    ]
  });
}