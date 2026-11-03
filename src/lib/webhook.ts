import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { SUBMISSION_ID_PATTERN } from "./enquiry";

// Shared server-side relay for website forms → the client's automation
// platform. Handles abuse checks, validation hand-off, signing, explicit
// acknowledgement and duplicate protection. Never logs personal data.

export type RelayResponse =
  | { success: true; submissionId: string; reference: string | null }
  | { success: false; code: string; message: string; fieldErrors?: Record<string, string | undefined> };

export interface WebhookConfig {
  url: string;
  token: string;
  secret: string;
  /** "json": 2xx + {success:true} or {status:"success"}; "status": any 2xx. */
  ackMode: string;
  timeoutMs: number;
}

const env = (name: string) => process.env[name]?.trim() ?? "";

export const consultationWebhook = (): WebhookConfig => ({
  url: env("CONSULTATION_WEBHOOK_URL"),
  token: env("CONSULTATION_WEBHOOK_BEARER_TOKEN"),
  secret: env("CONSULTATION_WEBHOOK_SIGNING_SECRET"),
  ackMode: env("CONSULTATION_WEBHOOK_ACK_MODE") || "json",
  timeoutMs: Number(env("CONSULTATION_WEBHOOK_TIMEOUT_MS")) || 10_000,
});

/** Contact messages use their own webhook if set, otherwise the consultation one. */
export const contactWebhook = (): WebhookConfig => {
  const base = consultationWebhook();
  return {
    url: env("CONTACT_WEBHOOK_URL") || base.url,
    token: env("CONTACT_WEBHOOK_BEARER_TOKEN") || base.token,
    secret: env("CONTACT_WEBHOOK_SIGNING_SECRET") || base.secret,
    ackMode: env("CONTACT_WEBHOOK_ACK_MODE") || base.ackMode,
    timeoutMs: base.timeoutMs,
  };
};

/** Paid orders use their own webhook if set, otherwise the consultation one. */
export const orderWebhook = (): WebhookConfig => {
  const base = consultationWebhook();
  return {
    url: env("ORDER_WEBHOOK_URL") || base.url,
    token: env("ORDER_WEBHOOK_BEARER_TOKEN") || base.token,
    secret: env("ORDER_WEBHOOK_SIGNING_SECRET") || base.secret,
    ackMode: env("ORDER_WEBHOOK_ACK_MODE") || base.ackMode,
    timeoutMs: base.timeoutMs,
  };
};

export function webhookUrlAllowed(url: string) {
  if (url.startsWith("https://")) return true;
  // Plain HTTP is only tolerated for a local mock receiver during development.
  return process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
}

export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function readAck(mode: string, status: number, bodyText: string): { ok: boolean; reference: string | null } {
  if (status < 200 || status >= 300) return { ok: false, reference: null };
  let body: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(bodyText);
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  } catch {
    body = null;
  }
  const refValue = body?.submissionId ?? body?.id ?? body?.request_id ?? body?.reference;
  const reference = typeof refValue === "string" || typeof refValue === "number" ? String(refValue).slice(0, 100) : null;
  if (mode === "status") return { ok: true, reference };
  return { ok: body !== null && (body.success === true || body.status === "success"), reference };
}

/** Best-effort per-instance limiter: returns true when `key` is over the limit. */
export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string) => {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) {
      for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
    return recent.length > max;
  };
}

export const clientIp = (req: NextRequest) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";

/** POST a signed JSON payload and require an explicit acknowledgement. */
export async function sendWebhook(
  cfg: WebhookConfig,
  payload: object,
  submissionId: string,
  opts: { name: string; system: string },
): Promise<RelayResponse> {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Idempotency-Key": submissionId,
    "X-Trivana-Submission-Id": submissionId,
  };
  if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;
  if (cfg.secret) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    headers["X-Trivana-Timestamp"] = timestamp;
    headers["X-Trivana-Signature"] = `sha256=${createHmac("sha256", cfg.secret).update(`${timestamp}.${body}`).digest("hex")}`;
  }

  let res: Response;
  try {
    res = await fetch(cfg.url, { method: "POST", headers, body, signal: AbortSignal.timeout(cfg.timeoutMs), cache: "no-store" });
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    console.warn(`[${opts.name}] ${submissionId} forward failed: ${timedOut ? "timeout" : "network"}`);
    return {
      success: false,
      code: timedOut ? "timeout" : "upstream_unreachable",
      message: timedOut ? `The ${opts.system} took too long to respond. Please try again.` : `We couldn't reach the ${opts.system}. Please try again.`,
    };
  }

  const ack = readAck(cfg.ackMode, res.status, await res.text().catch(() => ""));
  console.info(`[${opts.name}] ${submissionId} upstream status=${res.status} ack=${ack.ok}`);
  if (!ack.ok) {
    return {
      success: false,
      code: res.ok ? "unacknowledged" : "upstream_rejected",
      message: `The ${opts.system} didn't confirm receipt. Please try again.`,
    };
  }
  return { success: true, submissionId, reference: ack.reference };
}

const MAX_BODY_BYTES = 8 * 1024;
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
const ACK_CACHE_MS = 60 * 60 * 1000;

type Built = { ok: true; payload: Record<string, unknown> } | { ok: false; errors: Record<string, string | undefined> };

/**
 * One relay per form. In-memory limits are best-effort and per server
 * instance; pair with the host's WAF/rate limiting in production (README).
 */
export function createRelay(opts: {
  /** Short name used in logs, e.g. "enquiry". */
  name: string;
  config: () => WebhookConfig;
  /** Wording for visitor-facing errors, e.g. "booking system". */
  system: string;
  /** Validate the parsed body and build the webhook payload. */
  build: (input: Record<string, unknown>, submissionId: string) => Built | Promise<Built>;
  /** Used when no webhook is configured: save straight into the CRM (GoHighLevel). */
  fallback?: { available: () => boolean; save: (payload: Record<string, unknown>, submissionId: string) => Promise<string | null> };
}) {
  const rateLimited = createRateLimiter(RATE_LIMIT.max, RATE_LIMIT.windowMs);
  const acknowledged = new Map<string, { at: number; reference: string | null }>();
  const inFlight = new Map<string, Promise<RelayResponse>>();

  const json = (body: RelayResponse, status: number) => NextResponse.json(body, { status });
  const fail = (status: number, code: string, message: string, fieldErrors?: Record<string, string | undefined>) =>
    json({ success: false, code, message, ...(fieldErrors ? { fieldErrors } : {}) }, status);

  async function forward(cfg: WebhookConfig | null, payload: Record<string, unknown>, submissionId: string): Promise<RelayResponse> {
    let outcome: RelayResponse;
    if (cfg) {
      outcome = await sendWebhook(cfg, payload, submissionId, opts);
    } else {
      try {
        const reference = await opts.fallback!.save(payload, submissionId);
        console.info(`[${opts.name}] ${submissionId} saved to CRM`);
        outcome = { success: true, submissionId, reference };
      } catch (err) {
        console.error(`[${opts.name}] ${submissionId} CRM save failed: ${err instanceof Error ? err.message : "error"}`);
        outcome = { success: false, code: "upstream_rejected", message: `We couldn't reach the ${opts.system}. Please try again.` };
      }
    }
    if (outcome.success) acknowledged.set(submissionId, { at: Date.now(), reference: outcome.reference });
    return outcome;
  }

  return async function handle(req: NextRequest) {
    if (!sameOrigin(req)) return fail(403, "forbidden", "This request was not accepted.");
    if (!req.headers.get("content-type")?.includes("application/json"))
      return fail(415, "unsupported", "Please submit the form from the website with JavaScript enabled.");

    if (rateLimited(clientIp(req))) return fail(429, "rate_limited", "Too many attempts. Please wait a few minutes, or contact us directly.");

    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return fail(413, "too_large", "The submission was too large.");

    let input: Record<string, unknown>;
    try {
      input = JSON.parse(raw);
      if (!input || typeof input !== "object") throw new Error();
    } catch {
      return fail(400, "malformed", "The submission could not be read. Please try again.");
    }

    const submissionId = typeof input.submissionId === "string" ? input.submissionId : "";
    if (!SUBMISSION_ID_PATTERN.test(submissionId)) return fail(400, "malformed", "The submission could not be read.");

    // Honeypot: real visitors never see or fill this field.
    if (typeof input.website === "string" && input.website.trim() !== "") {
      return json({ success: true, submissionId, reference: null }, 200);
    }

    const built = await opts.build(input, submissionId);
    if (!built.ok) return fail(422, "invalid", "Please check the highlighted fields.", built.errors);

    // A retry of something the platform already acknowledged: don't send it twice.
    const now = Date.now();
    for (const [id, entry] of acknowledged) if (now - entry.at > ACK_CACHE_MS) acknowledged.delete(id);
    const previous = acknowledged.get(submissionId);
    if (previous) return json({ success: true, submissionId, reference: previous.reference }, 200);

    const configured = opts.config();
    const cfg = webhookUrlAllowed(configured.url) ? configured : null;
    if (!cfg && !opts.fallback?.available()) {
      console.error(`[${opts.name}] no webhook URL and no CRM connection configured`);
      return fail(503, "not_configured", "Online messages are temporarily unavailable. Please contact us directly.");
    }

    // Concurrent duplicates (double click, flaky network) share one upstream call.
    let pending = inFlight.get(submissionId);
    if (!pending) {
      pending = forward(cfg, built.payload, submissionId).finally(() => inFlight.delete(submissionId));
      inFlight.set(submissionId, pending);
    }
    const outcome = await pending;
    if (outcome.success) return json(outcome, 200);
    return json(outcome, outcome.code === "timeout" ? 504 : 502);
  };
}
