import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-32 text-center sm:px-6">
      <p className="eyebrow text-signal">404</p>
      <h1 className="display mt-4 text-6xl sm:text-7xl">Sold through or never pressed</h1>
      <p className="mt-6 text-paper-dim">That piece isn&rsquo;t in the current catalog.</p>
      <Link
        href="/#shop"
        className="display mt-10 inline-block border-2 border-paper px-8 py-4 text-2xl hover:border-signal hover:bg-signal"
      >
        Back to the shop
      </Link>
    </section>
  );
}
