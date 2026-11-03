// Shape of a written review. Reviews themselves are added in the admin panel.

export interface QA {
  q: string;
  a: string;
}

export interface Testimonial {
  id: string;
  name: string;
  city?: string;
  /** Title for endorsements, e.g. "Director (Retd), Government of India". */
  role?: string;
  /** What the review is about (shown as a tag). Product reviews appear on the storefront. */
  service: string;
  /** Short line from the review for cards. */
  highlight: string;
  /** Full review as questions & answers… */
  qa?: QA[];
  /** …or as a letter (paragraphs). */
  letter?: string[];
  /** Original wording when the review was given in another language. */
  original?: { language: string; lang: string; qa: QA[] };
  /** Long-form endorsement letter. */
  endorsement?: boolean;
}
