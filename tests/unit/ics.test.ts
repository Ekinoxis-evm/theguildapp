import { describe, expect, it } from "vitest";
import { bookingIcs, googleCalendarUrl } from "@/lib/ics";

const booking = {
  id: "abc-123",
  scheduledAt: "2026-08-01T15:00:00.000Z",
  durationMinutes: 45,
  summary: "Fade & beard — The Spot, Miami",
  location: "123 Main St, Miami, FL",
};

describe("bookingIcs", () => {
  it("produces a valid RFC 5545 envelope with CRLF line endings", () => {
    const ics = bookingIcs(booking);
    const lines = ics.split("\r\n");
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines.at(-1)).toBe("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("UID:booking-abc-123@theguild");
  });

  it("computes DTEND from the duration", () => {
    const ics = bookingIcs(booking);
    expect(ics).toContain("DTSTART:20260801T150000Z");
    expect(ics).toContain("DTEND:20260801T154500Z");
  });

  it("escapes commas and semicolons in text fields", () => {
    const ics = bookingIcs(booking);
    expect(ics).toContain("SUMMARY:Fade & beard — The Spot\\, Miami");
    expect(ics).toContain("LOCATION:123 Main St\\, Miami\\, FL");
  });
});

describe("googleCalendarUrl", () => {
  it("builds a template URL with the correct time range", () => {
    const url = new URL(googleCalendarUrl(booking));
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("dates")).toBe(
      "20260801T150000Z/20260801T154500Z"
    );
    expect(url.searchParams.get("text")).toBe(booking.summary);
  });
});
