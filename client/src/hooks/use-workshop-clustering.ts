import { useMemo } from 'react';
import { type Workshop } from '@shared/schema';

export interface WorkshopCluster {
  id: string;
  latitude: number;
  longitude: number;
  workshops: Workshop[];
  count: number;
  isCluster: boolean;
}

/**
 * Hook para clustering de oficinas baseado em proximidade geográfica
 * Agrupa oficinas próximas para melhorar performance e UX
 */
export function useWorkshopClustering(
  workshops: Workshop[],
  options: {
    /**
     * Distância mínima em graus para considerar clustering
     * Menor valor = clusters mais próximos
     */
    clusterDistance?: number;
    /**
     * Número mínimo de oficinas para formar um cluster
     */
    minClusterSize?: number;
    /**
     * Nível de zoom atual do mapa (usado para ajustar clustering)
     */
    zoomLevel?: number;
    /**
     * Se o clustering está habilitado
     */
    enabled?: boolean;
  } = {}
) {
  const {
    clusterDistance = 0.1, // ~11km
    minClusterSize = 2,
    zoomLevel = 5,
    enabled = true
  } = options;

  const clusters = useMemo(() => {
    if (!enabled || workshops.length === 0) {
      // Return individual workshops if clustering is disabled
      return workshops.map(workshop => ({
        id: workshop.id.toString(),
        latitude: parseFloat(workshop.latitude),
        longitude: parseFloat(workshop.longitude),
        workshops: [workshop],
        count: 1,
        isCluster: false
      }));
    }

    // Adjust cluster distance based on zoom level
    // Higher zoom = smaller clusters (more precise)
    const adjustedDistance = clusterDistance / Math.pow(2, Math.max(0, zoomLevel - 5));

    const clustered: WorkshopCluster[] = [];
    const used = new Set<string>();

    workshops.forEach(workshop => {
      if (used.has(workshop.id.toString())) return;

      const lat = parseFloat(workshop.latitude);
      const lng = parseFloat(workshop.longitude);

      // Find nearby workshops
      const nearby = workshops.filter(other => {
        if (used.has(other.id.toString()) || other.id === workshop.id) return false;

        const otherLat = parseFloat(other.latitude);
        const otherLng = parseFloat(other.longitude);

        const distance = Math.sqrt(
          Math.pow(lat - otherLat, 2) + Math.pow(lng - otherLng, 2)
        );

        return distance <= adjustedDistance;
      });

      if (nearby.length >= minClusterSize - 1) {
        // Create cluster
        const clusterWorkshops = [workshop, ...nearby];

        // Calculate cluster center (average position)
        const centerLat = clusterWorkshops.reduce((sum, w) => sum + parseFloat(w.latitude), 0) / clusterWorkshops.length;
        const centerLng = clusterWorkshops.reduce((sum, w) => sum + parseFloat(w.longitude), 0) / clusterWorkshops.length;

        clustered.push({
          id: `cluster_${workshop.id}_${nearby.length}`,
          latitude: centerLat,
          longitude: centerLng,
          workshops: clusterWorkshops,
          count: clusterWorkshops.length,
          isCluster: true
        });

        // Mark all workshops in this cluster as used
        clusterWorkshops.forEach(w => used.add(w.id.toString()));
      } else {
        // Single workshop
        clustered.push({
          id: workshop.id.toString(),
          latitude: lat,
          longitude: lng,
          workshops: [workshop],
          count: 1,
          isCluster: false
        });

        used.add(workshop.id.toString());
      }
    });

    return clustered;
  }, [workshops, clusterDistance, minClusterSize, zoomLevel, enabled]);

  return {
    clusters,
    totalWorkshops: workshops.length,
    clusterCount: clusters.filter(c => c.isCluster).length,
    individualCount: clusters.filter(c => !c.isCluster).length
  };
}

/**
 * Utility function to calculate distance between two coordinates
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

export default useWorkshopClustering;