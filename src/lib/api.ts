import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

type LugarRow = {
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
  lat: number;
  lng: number;
};

type CercanoRow = {
  id: string;
  title: string;
  icon: string;
  lat: number;
  lng: number;
};

function mapLugar(r: LugarRow): Site {
  return {
    id: r.id,
    title: r.title,
    location: r.location,
    distance: r.distance,
    category: r.category,
    image: r.image,
    description: r.description,
    history: r.history,
    info: r.info,
    accessibility: r.accessibility,
    coords: { lat: r.lat, lng: r.lng },
  };
}

export async function fetchSites(): Promise<Site[]> {
  const { data, error } = await supabase
    .from("lugares")
    .select("*")
    .order("title", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapLugar);
}

export async function fetchSite(id: string): Promise<Site> {
  const { data, error } = await supabase
    .from("lugares")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Lugar no encontrado: ${id}`);
  return mapLugar(data);
}

export async function fetchNearby(): Promise<NearbyPoint[]> {
  const { data, error } = await supabase
    .from("lugares_cercanos")
    .select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: CercanoRow) => ({
    id: r.id,
    title: r.title,
    icon: r.icon,
    coords: { lat: r.lat, lng: r.lng },
  }));
}

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
