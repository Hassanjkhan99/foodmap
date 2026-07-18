import type { GeoPoint } from "../types.js";

/**
 * Decode a Google "encoded polyline algorithm" string (precision 5) into points.
 * Pure, no dependencies. Throws on malformed input.
 */
export function decodePolyline(encoded: string, precision = 5): GeoPoint[] {
  const factor = Math.pow(10, precision);
  const points: GeoPoint[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    lat += decodeSignedValue();
    lng += decodeSignedValue();
    points.push({ lat: lat / factor, lng: lng / factor });
  }
  return points;

  function decodeSignedValue(): number {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      if (index >= encoded.length) {
        throw new Error("decodePolyline: truncated input");
      }
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  }
}

/** Encode points to a precision-5 polyline (useful for fixtures/tests). */
export function encodePolyline(points: readonly GeoPoint[], precision = 5): string {
  const factor = Math.pow(10, precision);
  let lastLat = 0;
  let lastLng = 0;
  let out = "";
  for (const p of points) {
    const lat = Math.round(p.lat * factor);
    const lng = Math.round(p.lng * factor);
    out += encodeSigned(lat - lastLat);
    out += encodeSigned(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }
  return out;

  function encodeSigned(v: number): string {
    let value = v < 0 ? ~(v << 1) : v << 1;
    let chunk = "";
    while (value >= 0x20) {
      chunk += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
      value >>= 5;
    }
    chunk += String.fromCharCode(value + 63);
    return chunk;
  }
}
