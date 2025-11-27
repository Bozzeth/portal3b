"use client";

export default function CTA() {
  return (
    <section className="py-20 bg-indigo-600 text-white text-center">
      <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
      <p className="mb-8 max-w-2xl mx-auto">
        Join thousands of citizens already accessing digital government services.
      </p>
      <a
        href="/auth"
        className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg shadow hover:bg-gray-100 transition"
      >
        Sign Up Now
      </a>
    </section>
  );
}
