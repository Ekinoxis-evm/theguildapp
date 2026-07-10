// RFC 5545 event generation for add-to-calendar. No external dependency.

function icsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function bookingIcs(booking: {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  summary: string;
  location?: string;
  description?: string;
}): string {
  const start = new Date(booking.scheduledAt);
  const end = new Date(start.getTime() + booking.durationMinutes * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Guild//Bookings//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:booking-${booking.id}@theguild`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(start.toISOString())}`,
    `DTEND:${icsDate(end.toISOString())}`,
    `SUMMARY:${escapeText(booking.summary)}`,
    ...(booking.location ? [`LOCATION:${escapeText(booking.location)}`] : []),
    ...(booking.description ? [`DESCRIPTION:${escapeText(booking.description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function googleCalendarUrl(booking: {
  scheduledAt: string;
  durationMinutes: number;
  summary: string;
  location?: string;
}): string {
  const start = new Date(booking.scheduledAt);
  const end = new Date(start.getTime() + booking.durationMinutes * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: booking.summary,
    dates: `${icsDate(start.toISOString())}/${icsDate(end.toISOString())}`,
    ...(booking.location ? { location: booking.location } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
