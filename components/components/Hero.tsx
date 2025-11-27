"use client";

import React from "react";

const Hero = () => {
  return (
    <section className="relative flex flex-col md:flex-row items-center justify-between min-h-[90vh] px-8 pt-32 bg-[url('/hero-bg.png')] bg-cover bg-top bg-no-repeat">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-xl text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Papua New Guinea Digital Government Services
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8">
          Bringing the government closer to the people
        </p>
        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
          <a
            href="/auth"
            className="bg-primary text-background px-6 py-3 rounded-md font-medium hover:opacity-90 transition"
          >
            Get Started
          </a>
          <a
            href="#features"
            className="border border-muted-foreground px-6 py-3 rounded-md font-medium hover:bg-muted-foreground/10 transition"
          >
            Learn More
          </a>
        </div>
      </div>

      {/* Image Slider (hidden on mobile) */}
      <div className="relative z-10 hidden md:block w-[280px] h-[180px] overflow-hidden rounded-lg shadow-lg transform rotate-[55deg] scale-90">
        <div className="flex w-[300%] h-full animate-slide transform -rotate-[55deg]">
          <img src="/slide1.jpg" alt="slide1" className="w-full object-cover" />
          <img src="/slide2.jpg" alt="slide2" className="w-full object-cover" />
          <img src="/slide3.jpg" alt="slide3" className="w-full object-cover" />
        </div>
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes slide {
          0% {
            transform: translateX(0%);
          }
          30% {
            transform: translateX(0%);
          }
          35% {
            transform: translateX(-100%);
          }
          65% {
            transform: translateX(-100%);
          }
          70% {
            transform: translateX(-200%);
          }
          95% {
            transform: translateX(-200%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        .animate-slide {
          animation: slide 15s infinite;
        }
      `}</style>
    </section>
  );
};

export default Hero;
