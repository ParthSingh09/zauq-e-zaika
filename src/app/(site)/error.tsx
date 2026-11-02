"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <h1 className="text-4xl text-ink">Something went wrong in the kitchen</h1>
      <p className="mt-4 max-w-md text-muted">Please try again. If the problem continues, let us know through the contact page.</p>
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="btn-primary">Try again</button>
        <Link href="/" className="btn-outline">Home</Link>
      </div>
    </div>
  );
}
