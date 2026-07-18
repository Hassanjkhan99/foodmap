import { describe, it, expect } from "vitest";
import { signVenueRef, verifyVenueRef } from "../src/refs.js";

const SECRET = "test-secret";

describe("signed venue refs", () => {
  it("round-trips a valid ref", () => {
    const token = signVenueRef({ venueId: "v-1", exp: 10_000 }, SECRET);
    expect(verifyVenueRef(token, SECRET, 5_000)).toEqual({ venueId: "v-1", exp: 10_000 });
  });

  it("rejects an expired ref", () => {
    const token = signVenueRef({ venueId: "v-1", exp: 10_000 }, SECRET);
    expect(verifyVenueRef(token, SECRET, 20_000)).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const token = signVenueRef({ venueId: "v-1", exp: 10_000 }, SECRET);
    const [v, , sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ venueId: "v-999", exp: 10_000 })).toString(
      "base64url",
    );
    expect(verifyVenueRef(`${v}.${forged}.${sig}`, SECRET, 5_000)).toBeNull();
  });

  it("rejects a wrong secret", () => {
    const token = signVenueRef({ venueId: "v-1", exp: 10_000 }, SECRET);
    expect(verifyVenueRef(token, "other", 5_000)).toBeNull();
  });
});
