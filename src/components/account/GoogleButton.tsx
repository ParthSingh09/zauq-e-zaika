import { googleConfigured } from "@/lib/oauth";

const ERRORS: Record<string, string> = {
  google_unavailable: "Google sign-in isn’t available right now.",
  google_cancelled: "Google sign-in was cancelled.",
  google_failed: "Google sign-in didn’t work. Please try again.",
  not_admin: "That Google account does not have admin access.",
  too_many: "Too many attempts. Please wait a few minutes.",
};

export function OAuthError({ code }: { code?: string }) {
  if (!code || !ERRORS[code]) return null;
  return <p role="alert" className="mb-4 rounded-xl bg-nonveg/10 px-4 py-3 text-sm text-nonveg">{ERRORS[code]}</p>;
}

/** Plain link (no JS needed): the server starts the OAuth flow. Hidden until Google is configured. */
export function GoogleButton({ next, area = "site" }: { next?: string; area?: "admin" | "site" }) {
  if (!googleConfigured()) return null;
  const q = new URLSearchParams({ area, ...(next ? { next } : {}) });
  return (
    <>
      <a href={`/api/auth/google?${q}`} className="btn-outline w-full gap-3 border-beige">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.3v3.1A12 12 0 0 0 12 24Z" />
          <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z" />
        </svg>
        Continue with Google
      </a>
      <div className="my-5 flex items-center gap-3 text-xs tracking-widest text-muted uppercase" aria-hidden>
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
    </>
  );
}
