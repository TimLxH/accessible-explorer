import { queryOptions } from "@tanstack/react-query";

export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://127.0.0.1:8000/api";

export type Site = {
  id: string;
  title: string;
  location: string;
  distance: string;
  category: string;
  image: string;
  description: string;
  history: string;
  info: string;
  accessibility: string;
  favorite?: boolean;
  coords: { lat: number; lng: number };
};

export type NearbyPoint = {
  id: string;
  title: string;
  icon: string;
  coords: { lat: number; lng: number };
};

async function request<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    throw new Error(
      `No se pudo conectar con el servidor (${API_BASE}). Verifica que el backend de FastAPI esté encendido.`,
    );
  }
  if (!res.ok) {
    throw new Error(`Error ${res.status} al solicitar ${path}: ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export const fetchSites = () => request<Site[]>("/lugares");
export const fetchSite = (id: string) => request<Site>(`/lugares/${encodeURIComponent(id)}`);
export const fetchNearby = () => request<NearbyPoint[]>("/lugares-cercanos");

export const sitesQuery = queryOptions({
  queryKey: ["sites"],
  queryFn: fetchSites,
});

export const siteQuery = (id: string) =>
  queryOptions({
    queryKey: ["site", id],
    queryFn: () => fetchSite(id),
  });

export const nearbyQuery = queryOptions({
  queryKey: ["nearby"],
  queryFn: fetchNearby,
});
