// Minimal Resend sender. Booking emails are best-effort: a missing key or a
// failed send never blocks the booking itself. Server-side only.

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  icsContent?: string;
}): Promise<void> {
  if (!emailEnabled()) return;
  const from = process.env.RESEND_FROM ?? "The Guild <onboarding@resend.dev>";
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [options.to],
        subject: options.subject,
        text: options.text,
        ...(options.icsContent
          ? {
              attachments: [
                {
                  filename: "booking.ics",
                  content: Buffer.from(options.icsContent).toString("base64"),
                  content_type: "text/calendar",
                },
              ],
            }
          : {}),
      }),
    });
    if (!res.ok) {
      console.error("resend send failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("resend send failed:", err);
  }
}
