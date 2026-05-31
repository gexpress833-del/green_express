<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Zone de livraison (geofence)
    |--------------------------------------------------------------------------
    |
    | L'application n'accepte les commandes que si la position GPS de livraison
    | se trouve dans le rayon defini autour du centre de la zone autorisee.
    | Par defaut : Kolwezi, RDC.
    |
    */

    // Restriction geographique activee ou non.
    'geofence_enabled' => (bool) env('DELIVERY_GEOFENCE_ENABLED', true),

    // La position GPS est-elle obligatoire pour passer commande ?
    'require_location' => (bool) env('DELIVERY_REQUIRE_LOCATION', true),

    // Nom de la zone autorisee (affichage dans les messages).
    'zone_name' => env('DELIVERY_ZONE_NAME', 'Kolwezi'),

    // Centre de la zone autorisee.
    'center_latitude' => (float) env('DELIVERY_CENTER_LAT', -10.7167),
    'center_longitude' => (float) env('DELIVERY_CENTER_LNG', 25.4667),

    // Rayon autorise en kilometres.
    'radius_km' => (float) env('DELIVERY_RADIUS_KM', 30),
];
