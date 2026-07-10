// Google Maps JS loader. Loads once per page; components await mapsReady().
// Everything degrades gracefully when the browser key is absent.

export const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;

export function mapsEnabled(): boolean {
  return Boolean(MAPS_KEY);
}

let loadPromise: Promise<typeof google> | null = null;

export function mapsReady(): Promise<typeof google> {
  if (!MAPS_KEY) return Promise.reject(new Error("Maps key not configured"));
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Maps loads in the browser only"));
  }
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

export type ParsedPlace = {
  google_place_id: string;
  formatted_address: string;
  lat: number;
  lng: number;
  country: string;
  state: string;
  city: string;
  zip_code: string;
};

export function parsePlace(place: google.maps.places.PlaceResult): ParsedPlace | null {
  if (!place.place_id || !place.geometry?.location) return null;
  const get = (type: string, short = false) => {
    const c = place.address_components?.find((ac) => ac.types.includes(type));
    return (short ? c?.short_name : c?.long_name) ?? "";
  };
  return {
    google_place_id: place.place_id,
    formatted_address: place.formatted_address ?? place.name ?? "",
    lat: place.geometry.location.lat(),
    lng: place.geometry.location.lng(),
    country: get("country"),
    state: get("administrative_area_level_1", true),
    city: get("locality") || get("sublocality") || get("administrative_area_level_2"),
    zip_code: get("postal_code"),
  };
}

export function navigationUrl(location: {
  google_place_id?: string | null;
  formatted_address: string;
  city: string;
  state: string;
}): string {
  const query = encodeURIComponent(
    `${location.formatted_address}, ${location.city}, ${location.state}`
  );
  const placeId = location.google_place_id
    ? `&query_place_id=${location.google_place_id}`
    : "";
  return `https://www.google.com/maps/search/?api=1&query=${query}${placeId}`;
}
