// Shared style vocabulary — the bridge between what clients like and what
// barbers do. Clients pick these in onboarding/profile; barbers pick them as
// specialties. Matching (8.3) scores the overlap, so both sides must speak
// the same words. Values are stored lowercase; labels are display-only.
export const STYLE_TAGS = [
  { value: "fades", label: "Fades" },
  { value: "tapers", label: "Tapers" },
  { value: "classic", label: "Classic cuts" },
  { value: "beard", label: "Beard work" },
  { value: "afro", label: "Afro & textured" },
  { value: "braids", label: "Braids & twists" },
  { value: "designs", label: "Designs & freestyle" },
  { value: "scissors", label: "Scissor work" },
  { value: "kids", label: "Kids cuts" },
  { value: "color", label: "Color" },
] as const;

export type StyleTag = (typeof STYLE_TAGS)[number]["value"];
