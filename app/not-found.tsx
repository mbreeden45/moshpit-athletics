import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-[1000px] flex-col items-center gap-3 px-4 py-20 text-center">
      <h1 className="font-bold">404: sold through, or never pressed.</h1>
      <Link href="/" className="underline underline-offset-2">
        back to shop
      </Link>
    </section>
  );
}
