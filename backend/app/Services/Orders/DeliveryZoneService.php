<?php

namespace App\Services\Orders;

/**
 * Verifie qu'une position GPS se trouve dans la zone de livraison autorisee
 * (geofence circulaire autour d'un centre, ex. Kolwezi).
 */
class DeliveryZoneService
{
    /**
     * La restriction geographique est-elle activee ?
     */
    public function geofenceEnabled(): bool
    {
        return (bool) config('delivery.geofence_enabled', true);
    }

    /**
     * La position GPS est-elle obligatoire pour commander ?
     */
    public function locationRequired(): bool
    {
        return (bool) config('delivery.require_location', true);
    }

    public function zoneName(): string
    {
        return (string) config('delivery.zone_name', 'Kolwezi');
    }

    public function radiusKm(): float
    {
        return (float) config('delivery.radius_km', 30);
    }

    /**
     * Distance en kilometres entre deux points GPS (formule de haversine).
     */
    public function distanceKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadiusKm = 6371.0;

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadiusKm * $c;
    }

    /**
     * La position fournie est-elle dans la zone autorisee ?
     */
    public function isWithinZone(float $latitude, float $longitude): bool
    {
        $centerLat = (float) config('delivery.center_latitude', -10.7167);
        $centerLng = (float) config('delivery.center_longitude', 25.4667);

        return $this->distanceKm($centerLat, $centerLng, $latitude, $longitude) <= $this->radiusKm();
    }
}
