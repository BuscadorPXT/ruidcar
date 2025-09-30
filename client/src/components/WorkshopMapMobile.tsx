import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { ZoomIn, ZoomOut, Locate, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Workshop } from "@shared/schema";
import { useMobile } from "@/hooks/use-mobile";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface WorkshopMapMobileProps {
  workshops: Workshop[];
  selectedWorkshop?: Workshop | null;
  onWorkshopClick: (workshop: Workshop) => void;
  center?: [number, number];
  onNearbySearch?: () => void;
  searchRadius?: number;
  userLocation?: [number, number] | null;
}

// Function to calculate zoom level based on search radius (mobile optimized)
function calculateZoomFromRadius(radiusKm: number): number {
  // Slightly closer zoom levels for mobile for better visibility
  if (radiusKm <= 25) return 12;    // Very close view
  if (radiusKm <= 50) return 11;    // Close view
  if (radiusKm <= 100) return 10;   // Medium view
  if (radiusKm <= 200) return 9;    // Wide view
  if (radiusKm <= 500) return 8;    // Very wide view
  return 7;                         // Maximum wide view
}

// Component to handle map centering with smooth animation
function MapCenterController({ center, searchRadius }: { center: [number, number]; searchRadius?: number }) {
  const map = useMap();

  useEffect(() => {
    const targetZoom = searchRadius ? calculateZoomFromRadius(searchRadius) : map.getZoom();

    // Smooth animated transition to new center and zoom
    map.flyTo(center, targetZoom, {
      duration: 2.0, // Slightly faster for mobile
      easeLinearity: 0.1
    });
  }, [center, searchRadius, map]);

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
        fillOpacity: 0.15, // Slightly more visible on mobile
        weight: 3, // Thicker line for mobile
        opacity: 0.7
      }}
    />
  );
}

// Custom zoom controls for mobile
function MobileZoomControls() {
  const map = useMap();

  const zoomIn = () => map.zoomIn();
  const zoomOut = () => map.zoomOut();

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={zoomIn}
        className="h-12 w-12 p-0 bg-white hover:bg-gray-50 shadow-lg border-2"
        aria-label="Ampliar mapa"
      >
        <ZoomIn className="h-6 w-6" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={zoomOut}
        className="h-12 w-12 p-0 bg-white hover:bg-gray-50 shadow-lg border-2"
        aria-label="Reduzir mapa"
      >
        <ZoomOut className="h-6 w-6" />
      </Button>
    </div>
  );
}

// Location button for mobile
function MobileLocationButton({ onNearbySearch }: { onNearbySearch?: () => void }) {
  if (!onNearbySearch) return null;

  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      <Button
        size="sm"
        onClick={onNearbySearch}
        className="h-12 w-12 p-0 bg-primary hover:bg-primary/90 shadow-lg"
        aria-label="Buscar oficinas próximas"
      >
        <Locate className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
}

export default function WorkshopMapMobile({
  workshops,
  selectedWorkshop,
  onWorkshopClick,
  center = [-15.7801, -47.9292],
  onNearbySearch,
  searchRadius = 100,
  userLocation: propUserLocation
}: WorkshopMapMobileProps) {
  const isMobile = useMobile();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(propUserLocation || null);
  const mapRef = useRef<L.Map | null>(null);

  // Track if we have a user location for showing radius circle
  const hasUserLocation = userLocation || propUserLocation;
  const actualUserLocation = propUserLocation || userLocation;

  // Custom icon for selected workshop
  const selectedIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [30, 49], // Larger for mobile
    iconAnchor: [15, 49],
    popupAnchor: [1, -41],
    shadowSize: [49, 49],
    className: 'selected-marker-mobile'
  });

  // Regular icon optimized for mobile
  const mobileIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41], // Standard size but larger touch area
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  // User location icon
  const userIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzYjgyZjYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIgZmlsbD0iIzNiODJmNiIvPjwvc3ZnPg==',
    iconSize: [36, 36], // Larger for mobile
    iconAnchor: [18, 18],
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
        },
        {
          enableHighAccuracy: false, // Faster on mobile
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  }, [propUserLocation]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden shadow-lg relative">
      {/* Screen reader description */}
      <div id="map-description-mobile" className="sr-only">
        Mapa interativo mobile mostrando {workshops.length} oficinas credenciadas RuidCar.
        Use gestos de toque para navegar pelo mapa, toque nos marcadores para selecionar oficinas.
        {userLocation && " Sua localização atual está marcada no mapa."}
      </div>

      <div
        role="application"
        aria-label="Mapa interativo mobile de oficinas credenciadas RuidCar"
        aria-describedby="map-description-mobile"
        className="h-full w-full"
      >
        <MapContainer
          center={center}
          zoom={isMobile ? 6 : 5} // Higher zoom for mobile
          className="h-full w-full"
          ref={mapRef as any}
          zoomControl={false} // Disable default zoom controls
          attributionControl={false} // Clean mobile interface
          scrollWheelZoom={false} // Prevent conflicts with page scroll
          doubleClickZoom={true}
          touchZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
          />

          {/* Custom controls */}
          <MobileZoomControls />
          <MobileLocationButton onNearbySearch={onNearbySearch} />

          {/* Animated center controller - only when user location is detected */}
          {(center[0] !== -15.7801 || center[1] !== -47.9292) && (
            <MapCenterController center={center} searchRadius={searchRadius} />
          )}

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
              <Popup className="mobile-popup">
                <div className="text-center p-2">
                  <strong className="text-base">Sua localização</strong>
                  <p className="text-sm mt-1">Esta é sua posição atual no mapa</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">Raio: {searchRadius}km</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Workshop markers */}
          {workshops.map((workshop) => (
            <Marker
              key={workshop.id}
              position={[parseFloat(workshop.latitude), parseFloat(workshop.longitude)]}
              icon={selectedWorkshop?.id === workshop.id ? selectedIcon : mobileIcon}
              alt={`Oficina ${workshop.name} em ${workshop.city}, ${workshop.state}`}
              eventHandlers={{
                click: () => onWorkshopClick(workshop),
              }}
            >
              <Popup className="mobile-popup" closeButton={false}>
                <div className="p-3" role="dialog" aria-label={`Informações da oficina ${workshop.name}`}>
                  <h3 className="font-bold text-base mb-2">{workshop.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">📍 {workshop.address}</p>
                  {workshop.phone && (
                    <p className="text-sm text-gray-600 mb-3">📞 {workshop.phone}</p>
                  )}
                  {workshop.city && workshop.state && (
                    <p className="text-sm text-gray-500 mb-3">🌍 {workshop.city}, {workshop.state}</p>
                  )}
                  <Button
                    onClick={() => onWorkshopClick(workshop)}
                    size="sm"
                    className="w-full mt-2 text-sm h-9"
                    aria-label={`Ver detalhes completos da oficina ${workshop.name}`}
                  >
                    Ver detalhes
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <style>{`
        .selected-marker-mobile {
          filter: hue-rotate(120deg) brightness(1.2);
          transform: scale(1.1);
        }

        /* Mobile-optimized popup styles */
        .mobile-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          min-width: 200px;
        }

        .mobile-popup .leaflet-popup-content {
          margin: 0;
          line-height: 1.4;
        }

        .mobile-popup .leaflet-popup-tip {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        /* Better touch targets for mobile */
        .leaflet-marker-icon {
          cursor: pointer;
        }

        /* Improve mobile map interaction */
        .leaflet-container {
          background: #f8f9fa;
        }

        .leaflet-control-attribution {
          display: none; /* Clean mobile interface */
        }

        /* Better focus indicators for mobile */
        .leaflet-container:focus {
          outline: 3px solid hsl(var(--primary));
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}