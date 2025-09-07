"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  ArrowLeft,
  QrCode,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
} from "lucide-react";

interface VerificationResult {
  valid: boolean;
  data?: {
    uin: string;
    name: string;
    issued: string;
    status: string;
    type: string;
    version: string;
  };
  error?: string;
}

export default function VerifyPage() {
  const router = useRouter();
  const [qrInput, setQrInput] = useState("");
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleManualVerification = async () => {
    if (!qrInput.trim()) {
      setVerificationResult({
        valid: false,
        error: "Please enter QR code data or UIN",
      });
      return;
    }

    setLoading(true);

    try {
      // Prepare the request payload
      let payload: { uin?: string; qrData?: string } = {};
      
      if (qrInput.startsWith("{")) {
        // It's QR code data
        payload.qrData = qrInput;
      } else {
        // It's a UIN
        payload.uin = qrInput.trim();
      }

      // Call the real verification API
      const response = await fetch('/api/sevispass/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success && result.verification) {
        setVerificationResult(result.verification);
      } else {
        setVerificationResult({
          valid: false,
          error: result.error || 'Verification failed',
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({
        valid: false,
        error: "Network error. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQrInput("");
    setVerificationResult(null);
  };

  const renderVerificationResult = () => {
    if (!verificationResult) return null;

    return (
      <div
        style={{
          background: "var(--card)",
          borderRadius: "16px",
          padding: "32px",
          border: `2px solid ${
            verificationResult.valid ? "var(--success)" : "var(--destructive)"
          }`,
          marginTop: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          {verificationResult.valid ? (
            <CheckCircle size={32} style={{ color: "var(--success)" }} />
          ) : (
            <XCircle size={32} style={{ color: "var(--destructive)" }} />
          )}
          <h3
            style={{
              fontSize: "24px",
              fontWeight: "600",
              margin: 0,
              color: verificationResult.valid
                ? "var(--success)"
                : "var(--destructive)",
            }}
          >
            {verificationResult.valid
              ? "Verified ✅"
              : "Verification Failed ❌"}
          </h3>
        </div>

        {verificationResult.valid && verificationResult.data ? (
          <div>
            {/* Photo Display */}
            {(verificationResult.data as any).photoUrl && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginBottom: '24px' 
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '3px solid var(--primary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <img 
                    src={(verificationResult.data as any).photoUrl}
                    alt="SevisPass Photo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      console.error('Photo failed to load');
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--muted-foreground)",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  Full Name
                </h4>
                <p style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>
                  {verificationResult.data.name}
                </p>
              </div>

              <div>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--muted-foreground)",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  UIN
                </h4>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: "500",
                    margin: 0,
                    fontFamily: "monospace",
                  }}
                >
                  {verificationResult.data.uin}
                </p>
              </div>

              <div>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--muted-foreground)",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  Status
                </h4>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    margin: 0,
                    color:
                      verificationResult.data.status === "active"
                        ? "var(--success)"
                        : "var(--warning)",
                    textTransform: "uppercase",
                  }}
                >
                  {verificationResult.data.status}
                </p>
              </div>

              <div>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--muted-foreground)",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  Issued Date
                </h4>
                <p style={{ fontSize: "14px", margin: 0 }}>
                  {new Date(
                    verificationResult.data.issued
                  ).toLocaleDateString()}
                </p>
              </div>

              {(verificationResult.data as any).dateOfBirth && (
                <div>
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "var(--muted-foreground)",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                    }}
                  >
                    Date of Birth
                  </h4>
                  <p style={{ fontSize: "14px", margin: 0 }}>
                    {new Date((verificationResult.data as any).dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
              )}

              {(verificationResult.data as any).nationality && (
                <div>
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "var(--muted-foreground)",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                    }}
                  >
                    Nationality
                  </h4>
                  <p style={{ fontSize: "14px", margin: 0 }}>
                    {(verificationResult.data as any).nationality}
                  </p>
                </div>
              )}

              {(verificationResult.data as any).documentNumber && (
                <div>
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "var(--muted-foreground)",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                    }}
                  >
                    Document Number
                  </h4>
                  <p style={{ fontSize: "14px", margin: 0, fontFamily: "monospace" }}>
                    {(verificationResult.data as any).documentNumber}
                  </p>
                </div>
              )}

              {(verificationResult.data as any).expires && (
                <div>
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "var(--muted-foreground)",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                    }}
                  >
                    Expires
                  </h4>
                  <p style={{ fontSize: "14px", margin: 0 }}>
                    {new Date((verificationResult.data as any).expires).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div
              style={{
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <CheckCircle size={20} style={{ color: "var(--success)" }} />
              <p
                style={{ margin: 0, fontSize: "14px", color: "var(--success)" }}
              >
                This is a valid Papua New Guinea SevisPass digital identity.
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <AlertCircle size={20} style={{ color: "var(--destructive)" }} />
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "var(--destructive)",
              }}
            >
              {verificationResult.error ||
                "Invalid or corrupted SevisPass data."}
            </p>
          </div>
        )}

        <button
          onClick={handleReset}
          style={{
            marginTop: "20px",
            padding: "12px 24px",
            background: "var(--muted)",
            color: "var(--muted-foreground)",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Verify Another
        </button>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        position: "relative",
      }}
    >
      {/* Theme Toggle */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 100,
        }}
      >
        <ThemeToggle />
      </div>

      {/* Back Button */}
      <div
        style={{ position: "absolute", top: "20px", left: "20px", zIndex: 100 }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--foreground)",
            cursor: "pointer",
            fontSize: "14px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--card)";
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>

      {/* Background Pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 30% 70%, var(--accent) 0%, transparent 50%)",
          opacity: 0.3,
          zIndex: 1,
        }}
      ></div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "80px 20px 40px 20px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div
            style={{
              background: "linear-gradient(90deg, #DC2626 0%, #FCD34D 100%)",
              height: "4px",
              width: "80px",
              margin: "0 auto 24px auto",
              borderRadius: "2px",
            }}
          ></div>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: "700",
              color: "var(--foreground)",
              margin: "0 0 16px 0",
              letterSpacing: "-0.01em",
            }}
          >
            Identity Verification
          </h1>
          <p
            style={{
              color: "var(--muted-foreground)",
              fontSize: "18px",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Verify SevisPass digital identities by scanning QR codes or entering
            UIN numbers
          </p>
        </div>

        {/* Verification Interface */}
        <div
          style={{
            background: "var(--card)",
            borderRadius: "16px",
            padding: "32px",
            border: "1px solid var(--border)",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <QrCode size={24} style={{ color: "var(--primary)" }} />
            <h2 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>
              Verify Digital Identity
            </h2>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "var(--foreground)",
                marginBottom: "8px",
              }}
            >
              QR Code Data or UIN
            </label>
            <textarea
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Paste QR code data (JSON format) or enter UIN (e.g., PNG1234567890)"
              rows={4}
              style={{
                width: "100%",
                padding: "16px",
                border: "2px solid var(--border)",
                borderRadius: "12px",
                fontSize: "14px",
                background: "var(--input)",
                color: "var(--foreground)",
                fontFamily: "monospace",
                resize: "vertical",
              }}
            />
          </div>

          <button
            onClick={handleManualVerification}
            disabled={loading || !qrInput.trim()}
            style={{
              width: "100%",
              padding: "16px 24px",
              backgroundColor:
                loading || !qrInput.trim() ? "#9CA3AF" : "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading || !qrInput.trim() ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    border: "2px solid transparent",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Verifying...
              </>
            ) : (
              <>
                <User size={20} />
                Verify Identity
              </>
            )}
          </button>

          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>

        {/* Verification Result */}
        {renderVerificationResult()}

        {/* Instructions */}
        <div
          style={{
            marginTop: "32px",
            padding: "24px",
            background: "var(--muted)",
            borderRadius: "12px",
            fontSize: "14px",
            color: "var(--muted-foreground)",
            lineHeight: "1.5",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "12px",
              color: "var(--foreground)",
            }}
          >
            📋 How to Verify
          </h3>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            <li>
              <strong>QR Code:</strong> Copy and paste the full QR code data
              from a SevisPass card
            </li>
            <li>
              <strong>UIN:</strong> Enter a 13-character UIN starting with "PNG"
              (e.g., PNG1234567890)
            </li>
            <li>
              <strong>Mobile:</strong> Use your device camera to scan QR codes
              directly (coming soon)
            </li>
            <li>
              <strong>Verification:</strong> Valid SevisPass cards show green
              status with user details
            </li>
          </ul>
        </div>

        {/* Real Database Notice */}
        <div
          style={{
            marginTop: "24px",
            padding: "20px",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            fontSize: "14px",
          }}
        >
          <h4
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "12px",
              color: "var(--foreground)",
            }}
          >
            🔒 Real Database Verification
          </h4>
          <p style={{ marginBottom: "12px", color: "var(--muted-foreground)" }}>
            This verification system connects to the official Papua New Guinea SevisPass database. 
            Only valid, issued SevisPass identities will show as verified.
          </p>
          <div
            style={{
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "6px",
              padding: "12px",
              fontSize: "12px",
              color: "var(--success)",
            }}
          >
            ✅ Connected to official SevisPass database<br />
            ✅ Real-time verification status<br />
            ✅ Secure identity validation
          </div>
        </div>
      </div>
    </div>
  );
}
