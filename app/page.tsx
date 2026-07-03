import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-5xl px-8 text-center">

        <p className="text-green-400 font-semibold tracking-widest uppercase mb-6">
          Version 0.0.1
        </p>

        <h1 className="text-7xl font-extrabold tracking-tight mb-6">
          Forge OS
        </h1>

        <p className="text-2xl text-gray-300 leading-relaxed mb-10">
          Build products faster.
          <br />
          <span className="text-white font-semibold">
            One Founder. Unlimited AI Employees.
          </span>
        </p>

        <div className="flex justify-center gap-5">
          <Link
            href="/interview"
            className="rounded-xl bg-white px-8 py-4 text-black font-semibold hover:bg-gray-200 transition"
          >
            Start Building
          </Link>

          <button className="rounded-xl border border-gray-600 px-8 py-4 hover:border-white transition">
            Learn More
          </button>
        </div>

        <div className="mt-20 text-gray-500 text-sm">
          Built with ❤️ using AI • Forge OS v0.0.1
        </div>

      </div>
    </main>
  );
}