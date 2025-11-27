"use client";

export default function Features() {
  return (
    <section className="py-20 bg-gray-50 text-center">
      <h2 className="text-3xl font-bold mb-8">Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">Fast</h3>
          <p>Experience lightning-fast performance with our platform.</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">Secure</h3>
          <p>Top-notch security keeps your data safe at all times.</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">Reliable</h3>
          <p>Always available when you need it, with 99.9% uptime.</p>
        </div>
      </div>
    </section>
  );
}
