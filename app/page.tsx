"use client";

import {
  Shield,
  Car,
  FileText,
  CreditCard,
  ScrollText,
  FileCheck,
  DollarSign,
  Plane,
  Smartphone,
  Clock,
} from "lucide-react";

export default function Page() {
  return (
    <main className="bg-background text-foreground">
      {/* Navbar */}
      <nav className="w-full bg-black/90 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold text-lg">
              PNG SEVIS PORTAL
            </span>
          </div>
          <div className="hidden md:flex gap-6 items-center">
            <a href="#home" className="hover:text-primary transition">
              Home
            </a>
            <a href="#features" className="hover:text-primary transition">
              Services
            </a>
            <a href="#help" className="hover:text-primary transition">
              Help & Support
            </a>
            <a href="#about" className="hover:text-primary transition">
              About
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary hover:text-black transition">
              English
            </button>
            <button className="px-4 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-primary/90 transition">
              Login / Register
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="relative bg-black text-center py-32 flex flex-col items-center justify-center"
        style={{
          backgroundImage: "url('/hero-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold text-primary mb-6">
            PNG SEVIS PORTAL
          </h1>
          <p className="text-xl md:text-2xl font-semibold mb-6">
            Papua New Guinea's Digital Government Gateway
          </p>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            Bridging tradition with innovation. From our rich cultural heritage
            to a digital future, access all government services in one secure,
            modern platform designed for every Papua New Guinean.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 rounded-lg bg-primary text-black font-bold text-lg hover:bg-primary/90 transition">
              Access Government Services
            </button>
            <button className="px-6 py-3 rounded-lg border border-primary text-primary font-bold text-lg hover:bg-primary hover:text-black transition">
              Login / Register
            </button>
          </div>
          <div className="flex gap-6 justify-center mt-10 text-sm text-gray-300">
            <span className="flex items-center gap-2">
              ✅ Government Verified
            </span>
            <span className="flex items-center gap-2">🕒 24/7 Available</span>
            <span className="flex items-center gap-2">⭐ Award Winning</span>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section id="features" className="py-20 bg-background text-center">
        <div className="mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <span className="px-4 py-1 text-sm rounded-full bg-primary/10 text-primary font-medium">
              ⭐ Most Popular
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-4">
            Featured Services
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Quick access to the most requested government services by Papua New
            Guineans.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: "Police Clearance Certificate",
              desc: "Get your police clearance certificate online",
              category: "Justice & Security",
            },
            {
              icon: Car,
              title: "Driver’s License Renewal",
              desc: "Renew your driving license online anytime",
              category: "Transport",
            },
            {
              icon: FileText,
              title: "Medical Record Number",
              desc: "Get your official central patient number",
              category: "Health Services",
            },
            {
              icon: CreditCard,
              title: "City Pass",
              desc: "Digital access pass for city services and facilities",
              category: "City Pass",
            },
            {
              icon: ScrollText,
              title: "Statement of Results",
              desc: "Request and verify your official academic records",
              category: "Civil Registration",
            },
            {
              icon: FileCheck,
              title: "Passport Application",
              desc: "Apply for Papua New Guinea passport",
              category: "Immigration",
            },
            {
              icon: DollarSign,
              title: "Water Bill Payment",
              desc: "Pay your water bills online instantly",
              category: "Utilities & Finance",
            },
            {
              icon: Plane,
              title: "E-Sipay",
              desc: "Electronic payment service for government services",
              category: "E-finance & Payment",
            },
            {
              icon: Smartphone,
              title: "SIM Registration",
              desc: "Register your mobile SIM card online",
              category: "ICT Registration",
            },
          ].map((service, i) => (
            <div
              key={i}
              className="bg-muted/10 border border-border rounded-xl p-6 shadow-md hover:shadow-lg hover:border-primary transition duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <service.icon className="w-7 h-7 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  {service.title}
                </h3>
              </div>
              <p className="text-muted-foreground mb-3">{service.desc}</p>
              <p className="text-sm text-primary/80 font-medium">
                {service.category}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm">
            Need help? Contact our support team for assistance with any
            government service.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} PNG SEVIS Portal. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#privacy" className="hover:text-primary">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-primary">
              Terms of Service
            </a>
            <a href="#contact" className="hover:text-primary">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
