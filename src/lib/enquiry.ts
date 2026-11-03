// Validation helpers shared by the browser and the server (orders, contact form).

const text = (value: unknown, max: number) =>
  typeof value === "string"
    ? value
        .replace(/[\u0000-\u001f\u007f<>]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
    : "";

/** Normalises Indian and international numbers to E.164, or returns null. */
export function normalisePhone(raw: string): string | null {
  const compact = raw.replace(/[\s\-().]/g, "");
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;
  const digits = compact.replace(/^\+/, "");
  if (!/^\d+$/.test(digits)) return null;
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^0[6-9]\d{9}$/.test(digits)) return `+91${digits.slice(1)}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
  return null;
}

export interface Attribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

export const cleanAttribution = (raw: unknown): Attribution => {
  const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pick = (v: unknown) => text(v, 100).replace(/[^\w.\-+ ]/g, "") || null;
  return { utmSource: pick(a.utmSource), utmMedium: pick(a.utmMedium), utmCampaign: pick(a.utmCampaign) };
};

export const SUBMISSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EnquiryResponse =
  | { success: true; submissionId: string; reference: string | null }
  | { success: false; code: string; message: string; fieldErrors?: Record<string, string | undefined> };
