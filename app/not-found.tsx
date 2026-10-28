import Link from "next/link";

export default function NotFound() {
  return (
    <section className="px-4 pb-24 pt-24 sm:px-8">
      <p className="mb-8 uppercase text-muted">404</p>
      <h1 className="headline-xl text-[clamp(56px,11vw,180px)]">
        Sold through.
        <br />
        <span className="text-muted">Or never pressed.</span>
      </h1>
      <Link
        href="/#collection"
        className="mt-16 inline-block border border-paper bg-paper px-9 py-5 font-medium uppercase text-ink hover:bg-ink hover:text-paper"
      >
        Back to the collection
      </Link>
    </section>
  );
}
