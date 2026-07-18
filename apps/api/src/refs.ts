import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Opaque, signed, versioned, expiring references. Clients never see internal
 * venue ids — they receive a token they can only echo back. See ADR-0007.
 */

const REF_VERSION = "v1";

export interface VenueRefPayload {
  readonly venueId: string;
  /** epoch ms expiry */
  readonly exp: number;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function signVenueRef(payload: VenueRefPayload, secret: string): string {
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", secret).update(`${REF_VERSION}.${body}`).digest("base64url");
  return `${REF_VERSION}.${body}.${sig}`;
}

export function verifyVenueRef(
  token: string,
  secret: string,
  nowMs: number,
): VenueRefPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [version, body, sig] = parts as [string, string, string];
  if (version !== REF_VERSION) return null;
  const expected = createHmac("sha256", secret).update(`${version}.${body}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as VenueRefPayload;
    if (typeof payload.venueId !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < nowMs) return null;
    return payload;
  } catch {
    return null;
  }
}
