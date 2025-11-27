export default function Testimonials() {
  return (
    <section className="py-20 bg-muted">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold mb-10">What people are saying</h2>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="p-6 bg-background rounded-xl shadow">
            <p className="italic">
              “This service is amazing, it made accessing government services so
              easy!”
            </p>
            <h4 className="mt-4 font-semibold">– John D.</h4>
          </div>

          <div className="p-6 bg-background rounded-xl shadow">
            <p className="italic">
              “Finally a modern platform for Papua New Guinea. Love the design
              and usability.”
            </p>
            <h4 className="mt-4 font-semibold">– Mary K.</h4>
          </div>

          <div className="p-6 bg-background rounded-xl shadow">
            <p className="italic">
              “Super helpful and intuitive. This will change how we interact
              with government services.”
            </p>
            <h4 className="mt-4 font-semibold">– Peter S.</h4>
          </div>
        </div>
      </div>
    </section>
  );
}
