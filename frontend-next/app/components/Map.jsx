'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Correction des icônes Leaflet par défaut (problème webpack/next.js)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

/**
 * Composant pour recentrer la carte quand la position change
 */
function MapRecenter({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView([position.latitude, position.longitude], map.getZoom(), {
        animate: true,
        duration: 1.2,
      })
    }
  }, [position, map])
  return null
}

/**
 * Crée une icône personnalisée colorée
 */
function createIcon(color) {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })
}

const ICONS = {
  user: createIcon('blue'),
  driver: createIcon('green'),
  restaurant: createIcon('red'),
  destination: createIcon('gold'),
}

/**
 * Map professionnelle OpenStreetMap avec Leaflet.
 *
 * Props :
 * - userPosition : { latitude, longitude } — position du client
 * - driverPosition : { latitude, longitude } — position du livreur (optionnel)
 * - destination : { latitude, longitude, label } — destination (optionnel)
 * - height : string — hauteur CSS (défaut: '400px')
 * - zoom : number — zoom initial (défaut: 15)
 * - showRoute : boolean — tracer une ligne entre les positions (défaut: false)
 * - onPositionChange : function({latitude, longitude}) — si fourni, le marqueur
 *   utilisateur devient déplaçable et un clic sur la carte repositionne le point.
 * - className : string — classes CSS additionnelles
 */
export default function Map({
  userPosition,
  driverPosition,
  destination,
  height = '400px',
  zoom = 15,
  showRoute = false,
  onPositionChange = null,
  className = '',
}) {
  const [mounted, setMounted] = useState(false)
  // Identifiant unique par instance pour eviter l'erreur Leaflet
  // "Map container is already initialized" (React StrictMode / remounts en dev).
  const [mapId] = useState(() => `leaflet-map-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    setMounted(true)
    return () => {
      // Nettoyage du conteneur Leaflet au demontage pour permettre une
      // reinitialisation propre (corrige "Map container is already initialized").
      const container = document.getElementById(mapId)
      if (container != null) {
        container._leaflet_id = null
      }
    }
  }, [mapId])

  // Déterminer le centre initial
  const center = userPosition
    ? [userPosition.latitude, userPosition.longitude]
    : driverPosition
      ? [driverPosition.latitude, driverPosition.longitude]
      : destination
        ? [destination.latitude, destination.longitude]
        : [-1.6585, 29.2208] // Goma, RDC (fallback)

  if (!mounted) {
    return (
      <div
        className={`bg-slate-800 rounded-2xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-white/60 text-sm">Chargement de la carte…</p>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl overflow-hidden shadow-lg border border-white/10 ${className}`} style={{ height }}>
      <MapContainer
        id={mapId}
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter position={userPosition || driverPosition} />

        {/* Clic sur la carte pour repositionner (mode edition) */}
        {onPositionChange && <ClickToSetPosition onPositionChange={onPositionChange} />}

        {/* Marqueur utilisateur / client */}
        {userPosition && (
          <Marker
            position={[userPosition.latitude, userPosition.longitude]}
            icon={ICONS.user}
            draggable={Boolean(onPositionChange)}
            eventHandlers={
              onPositionChange
                ? {
                    dragend: (e) => {
                      const { lat, lng } = e.target.getLatLng()
                      onPositionChange({ latitude: lat, longitude: lng })
                    },
                  }
                : undefined
            }
          >
            <Popup>
              <div className="text-sm font-medium">📍 Votre position</div>
              <div className="text-xs text-gray-600">
                {userPosition.latitude.toFixed(5)}, {userPosition.longitude.toFixed(5)}
              </div>
              {onPositionChange && (
                <div className="text-xs text-gray-500 mt-1">Déplacez le marqueur ou cliquez sur la carte pour ajuster.</div>
              )}
            </Popup>
          </Marker>
        )}

        {/* Marqueur livreur */}
        {driverPosition && (
          <Marker position={[driverPosition.latitude, driverPosition.longitude]} icon={ICONS.driver}>
            <Popup>
              <div className="text-sm font-medium">🛵 Livreur</div>
              <div className="text-xs text-gray-600">
                {driverPosition.latitude.toFixed(5)}, {driverPosition.longitude.toFixed(5)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marqueur destination */}
        {destination && (
          <Marker position={[destination.latitude, destination.longitude]} icon={ICONS.destination}>
            <Popup>
              <div className="text-sm font-medium">🏁 {destination.label || 'Destination'}</div>
            </Popup>
          </Marker>
        )}

        {/* Ligne de route (optionnel) */}
        {showRoute && userPosition && driverPosition && (
          <RouteLine start={userPosition} end={driverPosition} />
        )}
        {showRoute && userPosition && destination && !driverPosition && (
          <RouteLine start={userPosition} end={destination} />
        )}
      </MapContainer>
    </div>
  )
}

/**
 * Capte les clics sur la carte pour repositionner le marqueur utilisateur.
 */
function ClickToSetPosition({ onPositionChange }) {
  useMapEvents({
    click(e) {
      onPositionChange({ latitude: e.latlng.lat, longitude: e.latlng.lng })
    },
  })
  return null
}

/**
 * Ligne de route entre deux points
 */
function RouteLine({ start, end }) {
  const map = useMap()

  useEffect(() => {
    if (!start || !end) return

    const latlngs = [
      [start.latitude, start.longitude],
      [end.latitude, end.longitude],
    ]

    const polyline = L.polyline(latlngs, {
      color: '#22d3ee',
      weight: 4,
      opacity: 0.8,
      dashArray: '8, 8',
      lineCap: 'round',
    }).addTo(map)

    // Ajuster le zoom pour voir les deux points
    map.fitBounds(polyline.getBounds(), { padding: [40, 40] })

    return () => {
      map.removeLayer(polyline)
    }
  }, [start, end, map])

  return null
}
