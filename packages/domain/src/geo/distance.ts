import type { GeoPoint } from "../types.js";
import { normalizeDeg } from "./angles.js";

export const EARTH_RADIUS_M = 6_371_008.8;
const DEG = Math.PI / 180;

/** Great-circle (haversine) distance in metres. */
export function haversineM(a: GeoPoint, b: GeoPoint): number {
  const dLat = (b.lat - a.lat) * DEG;
  const dLng = (b.lng - a.lng) * DEG;
  const lat1 = a.lat * DEG;
  const lat2 = b.lat * DEG;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from `a` to `b`, degrees in [0,360). */
export function bearingDeg(a: GeoPoint, b: GeoPoint): number {
  const lat1 = a.lat * DEG;
  const lat2 = b.lat * DEG;
  const dLng = (b.lng - a.lng) * DEG;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return normalizeDeg(Math.atan2(y, x) / DEG);
}

/** Point reached by travelling `distanceM` from `origin` on bearing `deg`. */
export function destinationPoint(
  origin: GeoPoint,
  bearingDegrees: number,
  distanceM: number,
): GeoPoint {
  const ad = distanceM / EARTH_RADIUS_M;
  const brng = bearingDegrees * DEG;
  const lat1 = origin.lat * DEG;
  const lng1 = origin.lng * DEG;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(ad) + Math.cos(lat1) * Math.sin(ad) * Math.cos(brng),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(ad) * Math.cos(lat1),
      Math.cos(ad) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: lat2 / DEG, lng: normalizeLng(lng2 / DEG) };
}

function normalizeLng(lng: number): number {
  return ((lng + 540) % 360) - 180;
}
