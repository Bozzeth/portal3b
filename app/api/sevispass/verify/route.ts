import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithAmplifyServerContext } from '@/lib/utils/amplifyServerUtils';
import { getCurrentUser } from 'aws-amplify/auth/server';
import { getUrl } from 'aws-amplify/storage';

// Helper function to verify CityPass
async function verifyCityPass(qrData: any) {
  try {
    const { publicServerClient } = await import('@/lib/utils/amplifyServerUtils');
    
    // Look up CityPass holder by CityPass ID
    const citypassId = qrData.id;
    if (!citypassId) {
      return NextResponse.json({
        success: false,
        verification: {
          valid: false,
          error: 'Invalid CityPass QR code - missing ID'
        }
      });
    }

    console.log('Verifying CityPass ID:', citypassId);
    
    const holder = await publicServerClient.models.CityPassHolder.get({ citypassId });
    
    if (!holder.data) {
      console.log('No CityPass holder found for ID:', citypassId);
      return NextResponse.json({
        success: false,
        verification: {
          valid: false,
          error: 'CityPass not found or invalid ID'
        }
      });
    }

    // Check if the CityPass is active
    const isActive = holder.data.status === 'active';
    const isExpired = holder.data.expiryDate ? new Date(holder.data.expiryDate) < new Date() : false;
    
    if (!isActive) {
      console.log('CityPass found but not active:', holder.data.status);
      return NextResponse.json({
        success: false,
        verification: {
          valid: false,
          error: `CityPass is ${holder.data.status}`,
          data: {
            id: holder.data.citypassId,
            uin: holder.data.sevispassUin,
            name: holder.data.fullName,
            category: holder.data.category,
            status: holder.data.status,
            issued: holder.data.issuedAt,
            expires: holder.data.expiryDate,
            type: 'citypass',
            version: '1.0'
          }
        }
      });
    }

    if (isExpired) {
      console.log('CityPass is expired:', holder.data.expiryDate);
      return NextResponse.json({
        success: false,
        verification: {
          valid: false,
          error: 'CityPass has expired',
          data: {
            id: holder.data.citypassId,
            uin: holder.data.sevispassUin,
            name: holder.data.fullName,
            category: holder.data.category,
            status: 'expired',
            issued: holder.data.issuedAt,
            expires: holder.data.expiryDate,
            type: 'citypass',
            version: '1.0'
          }
        }
      });
    }

    console.log('Valid CityPass found:', holder.data.citypassId);

    // Get photo URL from SevisPass record if available
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
        console.log('Generated photo URL for CityPass');
      } catch (photoError) {
        console.error('Error generating photo URL:', photoError);
      }
    }

    return NextResponse.json({
      success: true,
      verification: {
        valid: true,
        data: {
          id: holder.data.citypassId,
          uin: holder.data.sevispassUin,
          name: holder.data.fullName,
          category: holder.data.category,
          status: holder.data.status,
          issued: holder.data.issuedAt,
          expires: holder.data.expiryDate,
          photoUrl,
          type: 'citypass',
          version: '1.0'
        }
      }
    });

  } catch (error) {
    console.error('CityPass verification error:', error);
    return NextResponse.json({
      success: false,
      verification: {
        valid: false,
        error: 'CityPass verification service temporarily unavailable'
      }
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uin, qrData, citypassId } = body;

    if (!uin && !qrData && !citypassId) {
      return NextResponse.json(
        { error: "UIN, CityPass ID, or QR data is required" },
        { status: 400 }
      );
    }

    // Check for direct CityPass ID verification first
    if (citypassId) {
      console.log('Processing direct CityPass ID verification:', citypassId);
      return await verifyCityPass({ id: citypassId });
    }

    // Verification can be done without authentication using public client
    console.log('Processing verification request');
        
    let targetUin = uin;
        
    // If QR data is provided, try to parse it
    let parsedQR = null;
    if (qrData && !targetUin) {
      try {
        parsedQR = JSON.parse(qrData);
        targetUin = parsedQR.uin;
        
        // Check if this is a CityPass verification (has type in QR data)
        if (parsedQR.type === 'citypass') {
          console.log('Processing CityPass QR verification');
          return await verifyCityPass(parsedQR);
        }
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
    message: "Digital Identity Verification API",
    usage: {
      method: "POST",
      body: {
        uin: "PNG1234567890 (for SevisPass verification)",
        citypassId: "CityPass ID (for CityPass verification)",
        qrData: "JSON string from QR code (supports both SevisPass and CityPass)"
      }
    },
    description: "Verifies SevisPass digital identities and CityPass resident credentials against official databases",
    supportedTypes: ["sevispass", "citypass"]
  });
}