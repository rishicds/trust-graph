"use client";

import { type FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";

import { api } from "@/lib/api";

type ContactSalesModalProps = {
  open: boolean;
  onClose: () => void;
  plan?: string;
};

export function ContactSalesModal({ open, onClose, plan = "recruiter" }: ContactSalesModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await api.contactSales({
        company_name: companyName.trim(),
        email: email.trim(),
        plan,
        source: "pricing",
      });
      setStatus("success");
      setMessage(res.message);
      setCompanyName("");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-[24px] border border-border bg-white p-6 shadow-[var(--shadow-lg)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Recruiter plan
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Contact sales</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Tell us your company and we&apos;ll reach out about recruiter access.
        </p>

        {status === "success" ? (
          <p className="mt-6 rounded-[14px] border border-border bg-[var(--bg-surface-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            {message}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                Company name
              </span>
              <input
                type="text"
                name="company_name"
                required
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Acme Recruiting"
                disabled={status === "loading"}
                className="w-full rounded-[14px] border border-border px-4 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-60"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                Contact email
              </span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                disabled={status === "loading"}
                className="w-full rounded-[14px] border border-border px-4 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-60"
              />
            </label>
            {message ? (
              <p className="text-sm text-red-600">{message}</p>
            ) : null}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-[14px] bg-accent px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-green)] transition hover:bg-accent-hover disabled:opacity-60"
            >
              {status === "loading" ? "Sending…" : "Send inquiry"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
