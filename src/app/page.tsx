import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-neutral-950 px-6 py-24 text-center text-white">
      <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">
        Grooming Standard
      </p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">
        THE GUILD
      </h1>
      <p className="mt-6 max-w-md text-sm leading-6 text-neutral-400">
        Premium barbershops and private barbers. Book your next cut, keep your
        style on file, arrive game-ready.
      </p>
      <div className="mt-10 flex gap-4">
        <Link
          href="/login"
          className="rounded bg-yellow-500 px-6 py-2.5 text-sm font-medium text-neutral-950"
        >
          Sign in / Join
        </Link>
      </div>
      <footer className="mt-24 flex gap-6 text-xs text-neutral-500">
        <Link href="/terms" className="hover:text-neutral-300">
          Terms &amp; Conditions
        </Link>
        <Link href="/privacy" className="hover:text-neutral-300">
          Privacy Policy
        </Link>
      </footer>
    </main>
  );
}
