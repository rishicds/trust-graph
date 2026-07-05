"use client";

import { type FormEvent, useState } from "react";

import { footer } from "@/constants";
import { api } from "@/lib/api";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!value) return;

    setStatus("loading");
    setMessage("");
    try {
      const res = await api.subscribeNewsletter(value);
      setStatus("success");
      setMessage(res.message);
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 flex max-w-xs flex-col gap-2">
      <input
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={footer.newsletterPlaceholder}
        disabled={status === "loading"}
        className="w-full rounded-[14px] border border-border px-4 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-[14px] bg-accent px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-green)] transition hover:bg-accent-hover disabled:opacity-60"
      >
        {status === "loading" ? "Joining…" : footer.newsletterCta}
      </button>
      {message ? (
        <p
          className={`text-xs ${
            status === "error" ? "text-red-600" : "text-[var(--text-secondary)]"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
