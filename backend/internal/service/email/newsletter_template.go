package email

import (
	"fmt"
	"html"
	"strings"
)

type NewsletterOptions struct {
	Subject         string
	BodyHTML        string
	FrontendURL     string
	IncludeSignupCTA bool
	Preview         bool
}

func RenderNewsletterHTML(opts NewsletterOptions) string {
	subject := html.EscapeString(strings.TrimSpace(opts.Subject))
	if subject == "" {
		subject = "TrustGraph update"
	}
	body := sanitizeNewsletterBody(opts.BodyHTML)
	frontend := strings.TrimRight(strings.TrimSpace(opts.FrontendURL), "/")
	if frontend == "" {
		frontend = "https://trustgraph.dev"
	}

	signupBlock := ""
	if opts.IncludeSignupCTA {
		signupBlock = fmt.Sprintf(`
          <tr>
            <td style="padding:0 32px 32px;">
              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="border-radius:16px;background:linear-gradient(135deg,#0F6E68 0%%,#7BE13B 100%%);">
                <tr>
                  <td style="padding:28px 24px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Your reputation, portable</p>
                    <h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#ffffff;">Claim your free Trust Passport</h2>
                    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.92);">Connect GitHub and share one evidence-backed link that answers: can I trust this person?</p>
                    <a href="%s/sign-up" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#111111;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">Get started free →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`, frontend)
	}

	previewNote := ""
	if opts.Preview {
		previewNote = `<tr><td style="padding:12px 32px 0;"><p style="margin:0;font-size:12px;color:#888;text-align:center;">Preview mode — signup CTA shown only for non-platform recipients when sending.</p></td></tr>`
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%s</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;">
  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #E8E8E8;box-shadow:0 12px 40px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:28px 32px 12px;border-bottom:1px solid #F0F0F0;">
              <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#0F6E68;">TrustGraph</p>
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.25;color:#111111;">%s</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;font-size:16px;line-height:1.7;color:#333333;" class="newsletter-body">
              %s
            </td>
          </tr>
          %s
          %s
          <tr>
            <td style="padding:24px 32px 32px;border-top:1px solid #F0F0F0;background:#FAFAFA;">
              <p style="margin:0 0 8px;font-size:13px;color:#666666;">The trust layer of the internet · Proof over claims</p>
              <p style="margin:0;font-size:12px;color:#999999;">You are receiving this because you subscribed to TrustGraph updates.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`, subject, subject, body, signupBlock, previewNote)
}

func sanitizeNewsletterBody(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "<p style=\"margin:0;color:#666;\">Start writing your newsletter content…</p>"
	}
	// Allow basic HTML from the admin editor; strip script tags.
	raw = strings.ReplaceAll(raw, "<script", "&lt;script")
	raw = strings.ReplaceAll(raw, "</script", "&lt;/script")
	return raw
}
