"use client";

import { Footer } from "@/components/layout/Footer";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoInline } from "@/components/ui/Logo";
import { useState } from "react";

export default function LandingPage() {
  const [showSevisLogin, setShowSevisLogin] = useState(false);
  const [uin, setUin] = useState("");

  const handleSevisPassLogin = () => {
    setShowSevisLogin(true);
  };

  const handleUinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uin.trim()) {
      // Future: Open camera for facial verification
      alert(`Future: Opening camera for facial verification with UIN: ${uin}`);
    }
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

      {/* Subtle Background Pattern */}
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

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* Hero Section */}
        <section
          className="hero-section"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            background: "var(--background)",
            color: "var(--foreground)",
            position: "relative",
            padding: "20px 0",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "var(--brand-gradient)",
            }}
          ></div>

          <style
            dangerouslySetInnerHTML={{
              __html: `
              @media (max-width: 768px) {
                .hero-container {
                  grid-template-columns: 1fr !important;
                  gap: 40px !important;
                }
                .hero-content {
                  text-align: center !important;
                }
                .hero-buttons {
                  justify-content: center !important;
                }
              }
            `,
            }}
          />
          <div
            className="hero-container"
            style={{
              padding: "40px 20px",
              maxWidth: "1200px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "minmax(300px, 1fr) minmax(300px, 500px)",
              gap: "60px",
              alignItems: "center",
            }}
          >
            {/* Left Column - Content */}
            <div className="hero-content">
              <div style={{ marginBottom: "60px" }}>
                <div style={{ marginBottom: '24px' }}>
                  <LogoInline size="large" showText={true} variant="horizontal" />
                </div>
                <p
                  style={{
                    fontSize: "clamp(16px, 2vw, 20px)",
                    marginBottom: "12px",
                    fontWeight: "400",
                    opacity: 0.9,
                    color: "var(--foreground)",
                    textAlign: "left",
                  }}
                >
                  Papua New Guinea Digital Government Platform
                </p>
                <p
                  style={{
                    fontSize: "clamp(14px, 1.5vw, 16px)",
                    opacity: 0.8,
                    maxWidth: "500px",
                    lineHeight: 1.5,
                    color: "var(--muted-foreground)",
                    textAlign: "left",
                  }}
                >
                  Secure access to government services and digital identity
                  verification
                </p>
              </div>

              <div
                className="hero-buttons"
                style={{
                  display: "flex",
                  gap: "16px",
                  justifyContent: "flex-start",
                  flexWrap: "wrap",
                  marginBottom: "40px",
                  alignItems: "stretch",
                }}
              >
                <a
                  href="/auth"
                  style={{
                    background: "var(--primary)",
                    color: "var(--background)",
                    fontSize: "16px",
                    padding: "14px 28px",
                    fontWeight: "500",
                    textDecoration: "none",
                    borderRadius: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                    border: "1px solid var(--primary)",
                    flex: "1 1 250px",
                    minWidth: "200px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--primary)";
                    e.currentTarget.style.borderColor = "var(--primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--primary)";
                    e.currentTarget.style.color = "var(--background)";
                    e.currentTarget.style.borderColor = "var(--primary)";
                  }}
                >
                  Get Started
                </a>
                <button
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                    fontSize: "16px",
                    padding: "14px 28px",
                    fontWeight: "500",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    flex: "1 1 250px",
                    minWidth: "200px",
                  }}
                  onClick={handleSevisPassLogin}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--accent)";
                    e.currentTarget.style.borderColor = "var(--primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  Login with SevisPass
                </button>
              </div>
            </div>

            {/* Right Column - Illustration */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
              }}
            >
              {/* Happy feeling illustration */}
              <img
                src="/undraw_happy-feeling_itcr.svg"
                alt="Happy feeling illustration showing a person with positive emotions"
                style={{
                  width: "100%",
                  maxWidth: "450px",
                  height: "auto",
                  opacity: 0.9,
                }}
              />
            </div>
          </div>
        </section>

        <Footer />
      </div>

      {/* SevisPass Login Modal */}
      {showSevisLogin && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--card)",
              borderRadius: "20px",
              padding: "40px",
              maxWidth: "400px",
              width: "100%",
              textAlign: "center",
              border: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "var(--foreground)",
              }}
            >
              Login with SevisPass
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--muted-foreground)",
                marginBottom: "32px",
              }}
            >
              Enter your UIN for facial verification
            </p>

            <form onSubmit={handleUinSubmit}>
              <input
                type="text"
                placeholder="Enter your UIN"
                value={uin}
                onChange={(e) => setUin(e.target.value)}
                style={{
                  width: "100%",
                  padding: "16px",
                  border: "2px solid var(--border)",
                  borderRadius: "12px",
                  fontSize: "16px",
                  marginBottom: "24px",
                  background: "var(--input)",
                  color: "var(--foreground)",
                  outline: "none",
                }}
                required
              />

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowSevisLogin(false);
                    setUin(""); // Clear UIN when canceling
                  }}
                  style={{
                    flex: 1,
                    padding: "14px",
                    border: "2px solid var(--border)",
                    borderRadius: "12px",
                    background: "transparent",
                    color: "var(--foreground)",
                    fontSize: "16px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--muted)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "14px",
                    border: "none",
                    borderRadius: "12px",
                    background: "var(--primary)",
                    color: "white",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
