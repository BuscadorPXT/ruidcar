import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { type Workshop } from "@shared/schema";
import { useWorkshopClustering } from "@/hooks/use-workshop-clustering";
import ClusterMarker from "@/components/ClusterMarker";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface WorkshopMapProps {
  workshops: Workshop[];
  selectedWorkshop?: Workshop | null;
  onWorkshopClick: (workshop: Workshop) => void;
  center?: [number, number];
  enableClustering?: boolean;
  searchRadius?: number;
  userLocation?: [number, number] | null;
}

// Function to calculate zoom level based on search radius
function calculateZoomFromRadius(radiusKm: number): number {
  // Zoom levels that make sense for different radii
  if (radiusKm <= 25) return 11;    // Very close view
  if (radiusKm <= 50) return 10;    // Close view
  if (radiusKm <= 100) return 9;    // Medium view
  if (radiusKm <= 200) return 8;    // Wide view
  if (radiusKm <= 500) return 7;    // Very wide view
  return 6;                         // Maximum wide view
}

// Component to handle map centering with smooth animation
function MapCenterController({ center, searchRadius }: { center: [number, number]; searchRadius?: number }) {
  const map = useMap();

  useEffect(() => {
    const targetZoom = searchRadius ? calculateZoomFromRadius(searchRadius) : map.getZoom();

    // Smooth animated transition to new center and zoom
    map.flyTo(center, targetZoom, {
      duration: 2.5, // 2.5 seconds animation
      easeLinearity: 0.1
    });
  }, [center, searchRadius, map]);

  return null;
}

// Component to fit bounds to all markers
function FitBoundsController({ workshops }: { workshops: Workshop[] }) {
  const map = useMap();

  useEffect(() => {
    if (workshops.length > 0) {
      const bounds = L.latLngBounds(
        workshops.map(w => [parseFloat(w.latitude), parseFloat(w.longitude)])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [workshops, map]);

  return null;
}

// Component to track map zoom level
function MapEventHandler({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };

    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);

  return null;
}

// Component to show search radius circle
function SearchRadiusCircle({
  center,
  radius,
  show
}: {
  center: [number, number];
  radius: number;
  show: boolean;
}) {
  if (!show) return null;

  return (
    <Circle
      center={center}
      radius={radius * 1000} // Convert km to meters
      pathOptions={{
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 2,
        opacity: 0.6
      }}
    />
  );
}

export default function WorkshopMap({
  workshops,
  selectedWorkshop,
  onWorkshopClick,
  center = [-15.7801, -47.9292], // Default center: Brasil
  enableClustering = true,
  searchRadius = 100,
  userLocation: propUserLocation
}: WorkshopMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(propUserLocation || null);
  const [zoomLevel, setZoomLevel] = useState(5);
  const mapRef = useRef<L.Map | null>(null);

  // Track if we have a user location for showing radius circle
  const hasUserLocation = userLocation || propUserLocation;
  const actualUserLocation = propUserLocation || userLocation;

  // Use clustering for better performance
  const { clusters } = useWorkshopClustering(workshops, {
    enabled: enableClustering,
    zoomLevel: zoomLevel,
    clusterDistance: 0.08, // Adjusted for better grouping
    minClusterSize: 3
  });

  // Custom icon for selected workshop
  const selectedIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'selected-marker'
  });

  // User location icon
  const userIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzYjgyZjYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIgZmlsbD0iIzNiODJmNiIvPjwvc3ZnPg==',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  // Sync with prop user location
  useEffect(() => {
    if (propUserLocation) {
      setUserLocation(propUserLocation);
    }
  }, [propUserLocation]);

  useEffect(() => {
    // Get user location only if not provided via props
    if (!propUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log("Could not get user location:", error);
        }
      );
    }
  }, [propUserLocation]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden shadow-lg">
      {/* Screen reader description */}
      <div id="map-description" className="sr-only">
        Mapa interativo mostrando {workshops.length} oficinas credenciadas RuidCar.
        Use as teclas de seta para navegar pelo mapa, Enter para selecionar marcadores.
        {userLocation && " Sua localização atual está marcada no mapa."}
      </div>

      <div
        role="application"
        aria-label="Mapa interativo de oficinas credenciadas RuidCar"
        aria-describedby="map-description"
        tabIndex={0}
        className="h-full w-full"
      >
        <MapContainer
          center={center}
          zoom={5}
          className="h-full w-full"
          ref={mapRef as any}
        >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Map event tracking */}
        <MapEventHandler onZoomChange={setZoomLevel} />

        {/* Animated center controller - only when user location is detected */}
        {(center[0] !== -15.7801 || center[1] !== -47.9292) && (
          <MapCenterController center={center} searchRadius={searchRadius} />
        )}

        {/* Fit bounds only when showing all workshops without user location */}
        {workshops.length > 0 && !hasUserLocation && <FitBoundsController workshops={workshops} />}

        {/* Search radius circle - show when we have user location */}
        {actualUserLocation && (
          <SearchRadiusCircle
            center={actualUserLocation}
            radius={searchRadius}
            show={true}
          />
        )}

        {/* User location marker */}
        {actualUserLocation && (
          <Marker
            position={actualUserLocation}
            icon={userIcon}
            alt="Sua localização atual"
          >
            <Popup>
              <div className="text-center" role="dialog" aria-label="Informações da sua localização">
                <strong>Sua localização</strong>
                <p className="text-xs mt-1">Esta é sua posição atual no mapa</p>
                <p className="text-xs text-blue-600 mt-1">Raio de busca: {searchRadius}km</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Clustered markers */}
        {clusters.map((cluster) => {
          const isSelected = !!selectedWorkshop && cluster.workshops.some(w => w.id === selectedWorkshop.id);
          return (
            <ClusterMarker
              key={cluster.id}
              cluster={cluster}
              onWorkshopClick={onWorkshopClick}
              isSelected={isSelected}
            />
          );
        })}
        </MapContainer>
      </div>

      {/* Clustering info overlay removido conforme solicitação */}

      <style>{`
        .selected-marker {
          filter: hue-rotate(120deg) brightness(1.2);
        }

        .workshop-marker.selected {
          filter: hue-rotate(120deg) brightness(1.2);
        }

        .cluster-marker {
          transition: transform 0.2s ease;
        }

        .cluster-marker:hover {
          transform: scale(1.1);
        }

        .cluster-marker.selected {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        /* Improve cluster popup styling */
        .cluster-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        }

        .workshop-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }

        /* Improve keyboard navigation focus */
        .leaflet-container:focus {
          outline: 2px solid hsl(var(--primary));
          outline-offset: 2px;
        }

        /* Better focus indicators for map controls */
        .leaflet-control-zoom a:focus,
        .leaflet-control-attribution a:focus {
          outline: 2px solid hsl(var(--primary));
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}