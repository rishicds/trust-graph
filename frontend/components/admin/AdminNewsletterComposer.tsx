"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { surfaces } from "@/constants/styles";
import { api } from "@/lib/api";

type Props = {
  getToken: () => Promise<string | null>;
  subscriberCount: number;
  emailReady: boolean;
};

export function AdminNewsletterComposer({ getToken, subscriberCount, emailReady }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorReady = useRef(false);
  const [subject, setSubject] = useState("What's new on TrustGraph");
  const [sampleEmail, setSampleEmail] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [includesSignupCta, setIncludesSignupCta] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bodyHtml = useCallback(() => editorRef.current?.innerHTML ?? "", []);

  async function refreshPreview() {
    const token = await getToken();
    if (!token) return;
    setBusy("preview");
    setError(null);
    try {
      const res = await api.adminPreviewNewsletter(token, {
        subject,
        body_html: bodyHtml(),
        sample_email: sampleEmail || undefined,
      });
      setPreviewHtml(res.html);
      setIncludesSignupCta(res.includes_signup_cta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setBusy("");
    }
  }

  useEffect(() => {
    if (editorRef.current && !editorReady.current) {
      editorRef.current.innerHTML =
        "<p>Share product updates, trust score improvements, or community highlights…</p>";
      editorReady.current = true;
      void refreshPreview();
    }
  }, []);

  useEffect(() => {
    if (!editorReady.current) return;
    const timer = setTimeout(() => {
      void refreshPreview();
    }, 400);
    return () => clearTimeout(timer);
  }, [subject, sampleEmail]);

  function exec(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    void refreshPreview();
  }

  async function sendTest() {
    const token = await getToken();
    if (!token || !testEmail.trim()) return;
    setBusy("test");
    setError(null);
    setMessage(null);
    try {
      await api.adminSendNewsletter(token, {
        subject,
        body_html: bodyHtml(),
        test_email: testEmail.trim(),
      });
      setMessage(`Test email sent to ${testEmail.trim()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy("");
    }
  }

  async function sendAll() {
    const token = await getToken();
    if (!token) return;
    if (!window.confirm(`Send newsletter to ${subscriberCount} subscribers?`)) return;
    setBusy("broadcast");
    setError(null);
    setMessage(null);
    try {
      const res = await api.adminSendNewsletter(token, {
        subject,
        body_html: bodyHtml(),
        send_to_all: true,
      });
      setMessage(`Sent to ${res.sent} subscribers${res.failed ? ` (${res.failed} failed)` : ""}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Broadcast failed");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className={`mt-10 ${surfaces.cardPadded}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Newsletter</h2>
          <p className="mt-1 text-sm text-muted">
            {subscriberCount} subscribers · signup footer CTA is omitted for people already on the platform.
          </p>
          {!emailReady && (
            <p className="mt-2 text-sm text-amber-700">
              Email delivery not configured yet — add RESEND_API_KEY or SMTP_* env vars to send.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Subject</label>
            <input
              className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Preview as email (optional)</label>
            <input
              className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3"
              value={sampleEmail}
              onChange={(e) => setSampleEmail(e.target.value)}
              placeholder="you@example.com — toggles signup CTA preview"
            />
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              {[
                ["bold", "B"],
                ["italic", "I"],
                ["underline", "U"],
                ["insertUnorderedList", "• List"],
                ["formatBlock", "H2"],
              ].map(([cmd, label]) => (
                <button
                  key={cmd}
                  type="button"
                  className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium hover:border-teal/40"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    cmd === "formatBlock"
                      ? exec("formatBlock", "<h2>")
                      : exec(cmd)
                  }
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm hover:border-teal/40"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const url = window.prompt("Link URL");
                  if (url) exec("createLink", url);
                }}
              >
                Link
              </button>
            </div>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="mt-3 min-h-[220px] rounded-xl border border-border bg-white px-4 py-3 text-sm leading-relaxed outline-none focus:border-teal/40"
              onInput={() => void refreshPreview()}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              className="min-w-[220px] flex-1 rounded-xl border border-border bg-white px-4 py-2 text-sm"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Test recipient email"
            />
            <Button disabled={!emailReady || busy !== "" || !testEmail.trim()} onClick={() => void sendTest()}>
              {busy === "test" ? "Sending…" : "Send test"}
            </Button>
            <Button
              variant="secondary"
              disabled={!emailReady || busy !== "" || subscriberCount === 0}
              onClick={() => void sendAll()}
            >
              {busy === "broadcast" ? "Sending…" : "Send to all"}
            </Button>
          </div>

          {message && <p className="text-sm text-teal">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Live HTML preview</p>
            <span className="text-xs text-muted">
              Signup CTA: {includesSignupCta ? "shown" : "hidden (platform user)"}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-[#F5F5F5]">
            {previewHtml ? (
              <iframe
                title="Newsletter preview"
                srcDoc={previewHtml}
                className="h-[640px] w-full bg-white"
              />
            ) : (
              <div className="flex h-[640px] items-center justify-center text-sm text-muted">
                {busy === "preview" ? "Rendering preview…" : "Preview will appear here"}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
