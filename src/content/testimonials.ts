/**
 * Real customer testimonials.
 *
 * IMPORTANT (per the content rules): we do NOT fabricate testimonials.
 * This array starts empty. When a genuine review is collected with the
 * customer's explicit permission, add it here. Each object renders as a card
 * in the testimonials section. When the array is empty the section shows an
 * honest placeholder instead of inventing reviews.
 */
export interface Testimonial {
  name: string;
  age?: number;
  situation?: string; // e.g. "After a divorce"
  quote: string;
  location?: string;
}

export const testimonials: Testimonial[] = [];

export const testimonialSectionCopy = {
  eyebrow: "From readers",
  headline: "Real experiences will appear here.",
  intro:
    "We only publish testimonials that come from real customers and are shared with their permission. Once genuine reviews are available, they'll appear here.",
  placeholder:
    "Real experiences from readers will appear here.",
};
