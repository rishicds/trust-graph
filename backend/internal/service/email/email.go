package email

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/smtp"
	"strings"
	"time"
)

type Client struct {
	resendKey string
	from      string
	smtpHost  string
	smtpPort  string
	smtpUser  string
	smtpPass  string
	smtpFrom  string
	http      *http.Client
}

func NewClient(resendKey, from, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom string) *Client {
	if smtpFrom == "" {
		smtpFrom = from
	}
	return &Client{
		resendKey: resendKey,
		from:      from,
		smtpHost:  strings.TrimSpace(smtpHost),
		smtpPort:  strings.TrimSpace(smtpPort),
		smtpUser:  strings.TrimSpace(smtpUser),
		smtpPass:  smtpPass,
		smtpFrom:  smtpFrom,
		http:      &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *Client) Enabled() bool {
	return c.resendKey != "" || (c.smtpHost != "" && c.smtpUser != "")
}

func (c *Client) SendHTML(ctx context.Context, to, subject, htmlBody string) error {
	to = strings.TrimSpace(to)
	if to == "" {
		return fmt.Errorf("recipient required")
	}
	if c.resendKey != "" {
		return c.sendResend(ctx, to, subject, htmlBody)
	}
	if c.smtpHost != "" && c.smtpUser != "" {
		return c.sendSMTP(to, subject, htmlBody)
	}
	return fmt.Errorf("email not configured — set RESEND_API_KEY or SMTP_HOST/SMTP_USER")
}

func (c *Client) SendDigest(ctx context.Context, to, subject, htmlBody string) error {
	return c.SendHTML(ctx, to, subject, htmlBody)
}

func (c *Client) sendResend(ctx context.Context, to, subject, htmlBody string) error {
	payload := map[string]interface{}{
		"from":    c.from,
		"to":      []string{to},
		"subject": subject,
		"html":    htmlBody,
	}
	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.resendKey)
	req.Header.Set("Content-Type", "application/json")

	res, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode >= 400 {
		return fmt.Errorf("resend api %s", res.Status)
	}
	return nil
}

func (c *Client) sendSMTP(to, subject, htmlBody string) error {
	from := c.smtpFrom
	if from == "" {
		from = c.from
	}
	port := c.smtpPort
	if port == "" {
		port = "587"
	}
	addr := net.JoinHostPort(c.smtpHost, port)

	var msg bytes.Buffer
	msg.WriteString("From: " + from + "\r\n")
	msg.WriteString("To: " + to + "\r\n")
	msg.WriteString("Subject: " + subject + "\r\n")
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)

	auth := smtp.PlainAuth("", c.smtpUser, c.smtpPass, c.smtpHost)
	if port == "465" {
		return sendSMTPTLS(addr, auth, extractEmail(from), []string{to}, msg.Bytes())
	}
	return smtp.SendMail(addr, auth, extractEmail(from), []string{to}, msg.Bytes())
}

func sendSMTPTLS(addr string, auth smtp.Auth, from string, to []string, msg []byte) error {
	host := strings.Split(addr, ":")[0]
	conn, err := tls.Dial("tcp", addr, &tls.Config{ServerName: host})
	if err != nil {
		return err
	}
	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return err
	}
	defer client.Close()
	if auth != nil {
		if err := client.Auth(auth); err != nil {
			return err
		}
	}
	if err := client.Mail(from); err != nil {
		return err
	}
	for _, rcpt := range to {
		if err := client.Rcpt(rcpt); err != nil {
			return err
		}
	}
	w, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := w.Write(msg); err != nil {
		return err
	}
	if err := w.Close(); err != nil {
		return err
	}
	return client.Quit()
}

func extractEmail(from string) string {
	if i := strings.Index(from, "<"); i >= 0 {
		end := strings.Index(from, ">")
		if end > i {
			return from[i+1 : end]
		}
	}
	return strings.TrimSpace(from)
}

func BuildWeeklyDigest(name string, score float64, delta float64, alerts []string, dashboardURL string) string {
	deltaLine := "No change this week"
	if delta > 0 {
		deltaLine = fmt.Sprintf("Your score increased by %.1f points", delta)
	} else if delta < 0 {
		deltaLine = fmt.Sprintf("Your score decreased by %.1f points", -delta)
	}

	var alertHTML strings.Builder
	for _, a := range alerts {
		alertHTML.WriteString(fmt.Sprintf("<li>%s</li>", a))
	}
	if alertHTML.Len() == 0 {
		alertHTML.WriteString("<li>Your profile is healthy — keep shipping!</li>")
	}

	return fmt.Sprintf(`<h2>TrustGraph weekly digest</h2>
<p>Hi %s,</p>
<p>Your trust score: <strong>%.0f / 100</strong>. %s.</p>
<ul>%s</ul>
<p><a href="%s/dashboard">View dashboard</a></p>`, name, score, deltaLine, alertHTML.String(), strings.TrimRight(dashboardURL, "/"))
}
