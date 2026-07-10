"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { mapsEnabled, mapsReady } from "@/lib/maps";

export type ShopPin = {
  shopId: string;
  name: string;
  lat: number;
  lng: number;
};

const MIAMI = { lat: 25.7617, lng: -80.1918 };

export function ShopsMap({ pins }: { pins: ShopPin[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!mapsEnabled() || !mapRef.current || pins.length === 0) return;
    let cancelled = false;

    mapsReady()
      .then((g) => {
        if (cancelled || !mapRef.current) return;
        const map = new g.maps.Map(mapRef.current, {
          center: MIAMI,
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        const bounds = new g.maps.LatLngBounds();
        for (const pin of pins) {
          const marker = new g.maps.Marker({
            map,
            position: { lat: pin.lat, lng: pin.lng },
            title: pin.name,
          });
          marker.addListener("click", () => router.push(`/shops/${pin.shopId}`));
          bounds.extend(marker.getPosition()!);
        }
        if (pins.length > 1) map.fitBounds(bounds, 48);
        else map.setCenter({ lat: pins[0].lat, lng: pins[0].lng });
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
    };
  }, [pins, router]);

  if (!mapsEnabled() || failed || pins.length === 0) return null;

  return (
    <div
      ref={mapRef}
      className="mt-6 h-64 w-full rounded border border-neutral-300"
      aria-label="Map of barbershops"
    />
  );
}
