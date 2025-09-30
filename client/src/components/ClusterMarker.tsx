import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { type WorkshopCluster } from "@/hooks/use-workshop-clustering";
import { type Workshop } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stethoscope } from "lucide-react";

// Extended Workshop type with diagnostic status (temporary)
interface WorkshopWithDiagnostic extends Workshop {
  diagnosisActive?: boolean;
}

interface ClusterMarkerProps {
  cluster: WorkshopCluster;
  onWorkshopClick: (workshop: Workshop) => void;
  isSelected?: boolean;
}

// Create cluster icon
function createClusterIcon(count: number, isSelected = false): L.Icon {
  const size = Math.min(50, 30 + count * 2); // Scale with count
  const color = isSelected ? '#22c55e' : '#3b82f6'; // Green if selected, blue otherwise

  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="20" fill="${color}" stroke="white" stroke-width="3" opacity="0.9"/>
        <text x="25" y="31" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
          ${count > 99 ? '99+' : count}
        </text>
      </svg>
    `)}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    className: `cluster-marker ${isSelected ? 'selected' : ''}`
  });
}

// Enhanced single workshop icon
function createWorkshopIcon(isSelected = false, hasDiagnostic = false): L.Icon {
  if (hasDiagnostic) {
    // Custom icon for workshops with diagnostic service
    const color = isSelected ? '#22c55e' : '#3b82f6';
    return new L.Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48">
          <!-- Main pin shape -->
          <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 48 16 48S32 28 32 16C32 7.16 24.84 0 16 0Z" fill="${color}" stroke="white" stroke-width="1.5"/>
          <!-- Inner circle -->
          <circle cx="16" cy="16" r="11" fill="white"/>
          <!-- Stethoscope icon (simplified) -->
          <path d="M12 14 C12 10, 20 10, 20 14 L20 18 C20 20, 18 22, 16 22 C14 22, 12 20, 12 18 Z" fill="${color}" stroke="none"/>
          <circle cx="16" cy="16" r="2" fill="${color}"/>
        </svg>
      `)}`,
      iconSize: [32, 48],
      iconAnchor: [16, 48],
      popupAnchor: [0, -42],
      className: `workshop-marker diagnostic ${isSelected ? 'selected' : ''}`
    });
  }

  return new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: `workshop-marker ${isSelected ? 'selected' : ''}`
  });
}

export default function ClusterMarker({ cluster, onWorkshopClick, isSelected = false }: ClusterMarkerProps) {
  // Check if any workshop in the cluster has diagnostic active
  const hasDiagnostic = cluster.workshops.some((w: any) => w.diagnosisActive);

  const icon = cluster.isCluster
    ? createClusterIcon(cluster.count, isSelected)
    : createWorkshopIcon(isSelected, hasDiagnostic);

  if (cluster.isCluster) {
    // Render cluster marker
    return (
      <Marker
        position={[cluster.latitude, cluster.longitude]}
        icon={icon}
        alt={`Cluster com ${cluster.count} oficinas`}
      >
        <Popup maxWidth={300} className="cluster-popup">
          <div className="p-4">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              🏢 {cluster.count} Oficinas Próximas
              <Badge variant="secondary">{cluster.count}</Badge>
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {cluster.workshops.map((workshop) => (
                <div
                  key={workshop.id}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-sm">{workshop.name}</h4>
                    {(workshop as any).diagnosisActive && (
                      <Badge className="bg-green-500 text-white text-xs px-1 py-0">
                        <Stethoscope className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-2 flex items-start gap-1">
                    📍 {workshop.address}
                  </p>
                  {workshop.phone && (
                    <p className="text-xs text-gray-600 mb-2">📞 {workshop.phone}</p>
                  )}
                  {workshop.city && workshop.state && (
                    <p className="text-xs text-gray-500 mb-2">
                      🌍 {workshop.city}, {workshop.state}
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onWorkshopClick(workshop)}
                    className="w-full text-xs h-7"
                    aria-label={`Ver detalhes da oficina ${workshop.name}`}
                  >
                    Ver detalhes
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t text-center">
              <p className="text-xs text-gray-500">
                Clique em uma oficina acima para ver mais detalhes
              </p>
            </div>
          </div>
        </Popup>
      </Marker>
    );
  } else {
    // Render single workshop marker
    const workshop = cluster.workshops[0];
    return (
      <Marker
        position={[cluster.latitude, cluster.longitude]}
        icon={icon}
        alt={`Oficina ${workshop.name} em ${workshop.city}, ${workshop.state}`}
        eventHandlers={{
          click: () => onWorkshopClick(workshop),
        }}
      >
        <Popup className="workshop-popup">
          <div className="p-3">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-sm">{workshop.name}</h3>
              {(workshop as any).diagnosisActive && (
                <Badge className="bg-green-500 text-white text-xs px-1 py-0" title="Diagnóstico RuidCar disponível">
                  <Stethoscope className="h-3 w-3" />
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-600 mb-2">📍 {workshop.address}</p>
            {workshop.phone && (
              <p className="text-xs text-gray-600 mb-2">📞 {workshop.phone}</p>
            )}
            {workshop.city && workshop.state && (
              <p className="text-xs text-gray-500 mb-3">🌍 {workshop.city}, {workshop.state}</p>
            )}
            <Button
              onClick={() => onWorkshopClick(workshop)}
              size="sm"
              className="w-full text-xs h-7"
              aria-label={`Ver detalhes completos da oficina ${workshop.name}`}
            >
              Ver detalhes
            </Button>
          </div>
        </Popup>
      </Marker>
    );
  }
}