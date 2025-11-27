"use client";

import { ThemeToggle } from "../ui/ThemeToggle";
import { LogoInline } from "../ui/Logo";

export default function Navbar() {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-transparent absolute top-0 left-0 z-50">
      <LogoInline className="h-10" />
      <nav className="hidden md:flex space-x-6 text-gray-700 dark:text-gray-200">
        <a href="#features" className="hover:text-indigo-600">Features</a>
        <a href="#testimonials" className="hover:text-indigo-600">Testimonials</a>
        <a href="#contact" className="hover:text-indigo-600">Contact</a>
      </nav>
      <div className="flex items-center space-x-4">
        <a
          href="/auth"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
        >
          Get Started
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
