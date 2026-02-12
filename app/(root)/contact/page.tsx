export default function ContactPage() {
  return (
    <section className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-3xl font-semibold text-gray-100">Contact</h1>
      <p className="text-gray-300">
        Need help or want to report an issue? Reach out at{" "}
        <a
          href="mailto:support@stock.app"
          className="text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
        >
          support@stock.app
        </a>
        .
      </p>
    </section>
  );
}

