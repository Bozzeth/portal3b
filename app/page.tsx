"use client";

import { Footer } from "@/components/layout/Footer";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoInline } from "@/components/ui/Logo";

export default function LandingPage() {
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

      {/* Geometric Background Elements */}
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
      
      {/* Geometric Shapes */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          right: "10%",
          width: "120px",
          height: "120px",
          background: "linear-gradient(45deg, var(--primary), var(--accent))",
          borderRadius: "50%",
          opacity: 0.1,
          zIndex: 1,
        }}
      ></div>
      
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          left: "5%",
          width: "80px",
          height: "80px",
          background: "var(--primary)",
          transform: "rotate(45deg)",
          opacity: 0.15,
          zIndex: 1,
        }}
      ></div>
      
      <div
        style={{
          position: "absolute",
          top: "60%",
          right: "20%",
          width: "60px",
          height: "60px",
          background: "var(--accent)",
          clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
          opacity: 0.2,
          zIndex: 1,
        }}
      ></div>
      
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "15%",
          width: "100px",
          height: "100px",
          border: "3px solid var(--primary)",
          borderRadius: "50%",
          opacity: 0.1,
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

          <div
            className="hero-container"
            style={{
              padding: "60px 20px",
              maxWidth: "800px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {/* Left Column - Content */}
            <div className="hero-content" style={{ textAlign: 'center', width: '100%' }}>
              <div style={{ marginBottom: "60px" }}>
                <div style={{ marginBottom: '40px' }}>
                  <LogoInline size="hero" showText={true} variant="stacked" solidYellow={true} />
                </div>
                <p
                  style={{
                    fontSize: "clamp(20px, 2.5vw, 28px)",
                    marginBottom: "16px",
                    fontWeight: "500",
                    opacity: 0.95,
                    color: "var(--foreground)",
                    textAlign: "center",
                    letterSpacing: "0.5px",
                  }}
                >
                  Papua New Guinea Digital Government Services
                </p>
                <p
                  style={{
                    fontSize: "clamp(16px, 2vw, 20px)",
                    opacity: 0.85,
                    maxWidth: "600px",
                    lineHeight: 1.6,
                    color: "var(--muted-foreground)",
                    textAlign: "center",
                    margin: "0 auto",
                  }}
                >
                  Bringing the government closer to the people
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
              </div>
            </div>

          </div>
        </section>


        <Footer />
      </div>

    </div>
  );
}
