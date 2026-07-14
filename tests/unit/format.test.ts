import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";

describe("formatPrice", () => {
  it("formats cents as USD by default", () => {
    expect(formatPrice(4500)).toBe("$45.00");
    expect(formatPrice(1999)).toBe("$19.99");
    expect(formatPrice(0)).toBe("$0.00");
  });

  it("respects the currency argument", () => {
    expect(formatPrice(4500, "EUR")).toBe("€45.00");
  });

  it("never drops sub-dollar amounts", () => {
    expect(formatPrice(1)).toBe("$0.01");
  });
});

describe("formatDate / formatDateTime", () => {
  it("renders a stable US date", () => {
    expect(formatDate("2026-07-14T12:00:00Z")).toContain("2026");
    expect(formatDate("2026-07-14T12:00:00Z")).toContain("July");
  });

  it("includes time in formatDateTime", () => {
    expect(formatDateTime("2026-07-14T15:30:00Z")).toMatch(/\d{1,2}:\d{2}/);
  });
});
