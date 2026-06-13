import { useEffect, useState } from "react";

export type GeoState = {
  loading: boolean;
  error: string | null;
  coords: { lat: number; lng: number; accuracy: number } | null;
};

export function useGeolocation(watch = false): GeoState {
  const [state, setState] = useState<GeoState>({
    loading: true,
    error: null,
    coords: null,
  });

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ loading: false, error: "Geolocalización no disponible", coords: null });
      return;
    }
    const onOk = (p: GeolocationPosition) =>
      setState({
        loading: false,
        error: null,
        coords: {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
        },
      });
    const onErr = (e: GeolocationPositionError) =>
      setState({ loading: false, error: e.message, coords: null });

    if (watch) {
      const id = navigator.geolocation.watchPosition(onOk, onErr, {
        enableHighAccuracy: true,
      });
      return () => navigator.geolocation.clearWatch(id);
    }
    navigator.geolocation.getCurrentPosition(onOk, onErr, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  }, [watch]);

  return state;
}

// Haversine distance in meters
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}
