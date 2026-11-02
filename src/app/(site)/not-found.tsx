import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center sm:py-32">
      <LogoMark className="h-20 w-20" />
      <p className="eyebrow mt-8">Error 404</p>
      <h1 className="mt-3 text-4xl text-ink sm:text-5xl">This dish isn’t on the menu</h1>
      <p className="mt-4 max-w-md text-lg text-muted">The page you’re looking for may have moved or no longer exists. Let’s get you back to something delicious.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">Back to home</Link>
        <Link href="/recipes" className="btn-outline">Browse recipes</Link>
      </div>
    </div>
  );
}
