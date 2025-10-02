import { memo } from 'react';
import VirtualList from '@/components/VirtualList';
import { type Workshop } from '@shared/schema';
import { MapPin, Phone, Globe } from 'lucide-react';

interface VirtualizedWorkshopListProps {
  workshops: Workshop[];
  onWorkshopClick?: (workshop: Workshop) => void;
  containerHeight?: number;
}

// Memoized workshop item to prevent unnecessary re-renders
const WorkshopItem = memo(({
  workshop,
  onClick
}: {
  workshop: Workshop;
  onClick?: (workshop: Workshop) => void;
}) => {
  return (
    <div
      className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onClick?.(workshop)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">
            {workshop.name}
          </h3>

          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{workshop.address}</span>
            </div>

            {workshop.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{workshop.phone}</span>
              </div>
            )}

            {workshop.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <a
                  href={workshop.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Website
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="ml-4 text-right">
          {workshop.active ? (
            <span className="inline-block px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
              Ativa
            </span>
          ) : (
            <span className="inline-block px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
              Inativa
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

WorkshopItem.displayName = 'WorkshopItem';

export default function VirtualizedWorkshopList({
  workshops,
  onWorkshopClick,
  containerHeight = 600
}: VirtualizedWorkshopListProps) {
  if (workshops.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Nenhuma oficina encontrada
      </div>
    );
  }

  // Use virtualization only for large lists
  if (workshops.length < 20) {
    // For small lists, render normally
    return (
      <div className="border rounded-lg overflow-hidden">
        {workshops.map((workshop) => (
          <WorkshopItem
            key={workshop.id}
            workshop={workshop}
            onClick={onWorkshopClick}
          />
        ))}
      </div>
    );
  }

  // Use virtualization for large lists
  return (
    <div className="border rounded-lg overflow-hidden">
      <VirtualList
        items={workshops}
        itemHeight={120} // Estimated height of each item
        containerHeight={containerHeight}
        overscan={5}
        renderItem={(workshop) => (
          <WorkshopItem
            workshop={workshop}
            onClick={onWorkshopClick}
          />
        )}
        getItemKey={(workshop) => workshop.id}
        className="bg-white"
      />
    </div>
  );
}

// Export memoized version to prevent unnecessary re-renders
export const MemoizedVirtualizedWorkshopList = memo(VirtualizedWorkshopList);