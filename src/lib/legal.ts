// Versioned legal documents. Bump a version whenever the corresponding
// page content changes materially — acceptances are recorded per version.
export const LEGAL_VERSIONS = {
  terms: "2026-07-08.v1",
  privacy: "2026-07-08.v1",
} as const;

export type LegalDocument = keyof typeof LEGAL_VERSIONS;
