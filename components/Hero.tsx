"use client";

import { LogoInline } from "./ui/Logo";

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-black">
      {/* Background Glow */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-indigo-400/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Decorative Shapes */}
      <div className="absolute top-10 right-10 w-24 h-24 bg-indigo-200 dark:bg-indigo-800 rotate-45 opacity-20"></div>
      <div className="absolute bottom-16 left-10 w-16 h-16 rounded-full bg-purple-300 dark:bg-purple-700 opacity-20"></div>
      <div className="absolute top-1/3 left-1/4 w-20 h-20 border-4 border-indigo-400 rounded-full opacity-20"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Logo */}
        <LogoInline className="h-16 mb-8" />

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white mb-6">
          Bringing Government Services{" "}
          <span className="text-indigo-600">Closer to You</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mb-10 leading-relaxed">
          Access secure, reliable, and modern digital services from anywhere in
          Papua New Guinea. Fast, simple, and built for everyone.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/auth"
            className="px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition"
          >
            Get Started
          </a>
          <a
            href="#features"
            className="px-8 py-4 border border-indigo-600 text-indigo-600 text-lg font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-800 transition"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}
