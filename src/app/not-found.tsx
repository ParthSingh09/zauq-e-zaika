import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl text-ink">Page not found</h1>
      <Link href="/" className="btn-primary mt-6">Go home</Link>
    </main>
  );
}
