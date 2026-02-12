import crypto from "crypto";

const DEFAULT_EXPIRY_DAYS = 365;

function getSecret() {
  return process.env.BETTER_AUTH_SECRET || process.env.UNSUBSCRIBE_SECRET || "signalist-unsubscribe-secret";
}

function base64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function createUnsubscribeToken(email: string, expiresInDays = DEFAULT_EXPIRY_DAYS) {
  const payload = {
    email: email.trim().toLowerCase(),
    exp: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  };
  const payloadPart = base64Url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", getSecret()).update(payloadPart).digest("base64url");
  return `${payloadPart}.${signature}`;
}

export function verifyUnsubscribeToken(token: string): { email: string; valid: boolean } {
  if (!token || !token.includes(".")) {
    return { email: "", valid: false };
  }

  const [payloadPart, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", getSecret()).update(payloadPart).digest("base64url");
  if (signature.length !== expected.length) {
    return { email: "", valid: false };
  }
  const isMatch = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!isMatch) {
    return { email: "", valid: false };
  }

  try {
    const decoded = JSON.parse(fromBase64Url(payloadPart)) as { email?: string; exp?: number };
    const expired = !decoded.exp || Date.now() > decoded.exp;
    const email = (decoded.email || "").trim().toLowerCase();
    if (!email || expired) {
      return { email: "", valid: false };
    }
    return { email, valid: true };
  } catch {
    return { email: "", valid: false };
  }
}

export function getBaseUrl() {
  return (
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL?.replace(/^https?:\/\//, "https://") ||
    "http://localhost:3000"
  );
}

export function buildUnsubscribeUrl(email: string) {
  const token = createUnsubscribeToken(email);
  const base = getBaseUrl().replace(/\/$/, "");
  return `${base}/unsubscribe?token=${encodeURIComponent(token)}`;
}
