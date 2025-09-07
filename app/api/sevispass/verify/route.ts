import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithAmplifyServerContext } from '@/lib/utils/amplifyServerUtils';
import { getCurrentUser } from 'aws-amplify/auth/server';
import { getUrl } from 'aws-amplify/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uin, qrData } = body;

    if (!uin && !qrData) {
      return NextResponse.json(
        { error: "UIN or QR data is required" },
        { status: 400 }
      );
    }

    // Verification can be done without authentication using public client
    console.log('Processing UIN verification request');
        
        let targetUin = uin;
        
    // If QR data is provided, try to parse it
    if (qrData && !targetUin) {
      try {
        const parsed = JSON.parse(qrData);
        targetUin = parsed.uin;
      } catch (error) {
        console.error('Failed to parse QR data:', error);
        return NextResponse.json({
          success: false,
          verification: {
            valid: false,
            error: 'Invalid QR code format'
          }
        }, { status: 400 });
      }
    }

    if (!targetUin) {
      return NextResponse.json({
        success: false,
        verification: {
          valid: false,
          error: 'No UIN found in provided data'
        }
      }, { status: 400 });
    }

    console.log('Verifying UIN:', targetUin);

    // Look up the SevisPass holder by UIN using public client
    let holder;
    try {
      const { publicServerClient } = await import('@/lib/utils/amplifyServerUtils');
      holder = await publicServerClient.models.SevisPassHolder.get({ uin: targetUin });
          
      if (!holder.data) {
        console.log('No SevisPass holder found for UIN:', targetUin);
        return NextResponse.json({
          success: false,
          verification: {
            valid: false,
            error: 'SevisPass not found or invalid UIN'
          }
        });
      }

      // Check if the SevisPass is active
      const isActive = holder.data.status === 'active';
      
      if (!isActive) {
        console.log('SevisPass found but not active:', holder.data.status);
        return NextResponse.json({
          success: false,
          verification: {
            valid: false,
            error: `SevisPass is ${holder.data.status}`,
            data: {
              uin: holder.data.uin,
              name: holder.data.fullName,
              status: holder.data.status,
              issued: holder.data.issuedAt,
              type: 'sevispass',
              version: '1.0'
            }
          }
        });
      }

      console.log('Valid SevisPass found:', holder.data.uin);
      
      // Get photo URL if available
      let photoUrl = null;
      if (holder.data.photoImageKey) {
        try {
          const urlResult = await getUrl({
            path: holder.data.photoImageKey,
            options: {
              expiresIn: 3600 // 1 hour
            }
          });
          photoUrl = urlResult.url.toString();
          console.log('Generated photo URL for SevisPass');
        } catch (photoError) {
          console.error('Error generating photo URL:', photoError);
        }
      }
      
      return NextResponse.json({
        success: true,
        verification: {
          valid: true,
          data: {
            uin: holder.data.uin,
            name: holder.data.fullName,
            dateOfBirth: holder.data.dateOfBirth,
            documentNumber: holder.data.documentNumber,
            nationality: holder.data.nationality,
            status: holder.data.status,
            issued: holder.data.issuedAt,
            expires: holder.data.expiryDate,
            photoUrl,
            type: 'sevispass',
            version: '1.0'
          }
        }
      });
      
    } catch (error) {
      console.error('Database error during verification:', error);
      return NextResponse.json({
        success: false,
        verification: {
          valid: false,
          error: 'Verification service temporarily unavailable'
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('SevisPass verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: "SevisPass Verification API",
    usage: {
      method: "POST",
      body: {
        uin: "PNG1234567890 (required if no qrData)",
        qrData: "JSON string from QR code (required if no uin)"
      }
    },
    description: "Verifies SevisPass digital identities against the official database"
  });
}