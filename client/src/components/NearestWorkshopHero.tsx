import { useState, useEffect } from 'react';
import { MapPin, Phone, Navigation, Loader2, Target, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useImmediateLocation } from '@/hooks/use-immediate-location';
import { useAnalytics } from '@/hooks/use-analytics';
import { type Workshop } from '@shared/schema';

interface NearestWorkshopHeroProps {
  onViewOnMap?: (workshop: Workshop) => void;
  className?: string;
}

interface NearestWorkshopData {
  workshop: Workshop;
  distance: number;
}

export default function NearestWorkshopHero({ onViewOnMap, className = '' }: NearestWorkshopHeroProps) {
  const { toast } = useToast();
  const { trackConversion } = useAnalytics();
  const { location, isLoading: locationLoading, error: locationError, source } = useImmediateLocation();
  const [nearestWorkshop, setNearestWorkshop] = useState<NearestWorkshopData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(true);

  // Fetch nearest workshop when location is available
  useEffect(() => {
    if (location && !locationLoading) {
      fetchNearestWorkshop(location[0], location[1]);
    }
  }, [location, locationLoading]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  const fetchNearestWorkshop = async (lat: number, lng: number) => {
    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`/api/workshops/nearest-one?lat=${lat}&lng=${lng}`);
      const data = await response.json();

      if (response.ok && data.workshop) {
        setNearestWorkshop(data);
        console.log('✅ Nearest workshop found:', data.workshop.name, `(${data.distance.toFixed(1)}km)`);

        // Track nearest workshop found
        if (isMounted) {
          try {
            trackConversion('view_map', data.workshop.id.toString(), 'nearest_hero', {
              workshopName: data.workshop.name,
              distance: data.distance,
              locationSource: source,
              interaction: 'nearest_found'
            });
          } catch (error) {
            console.warn('Failed to track nearest workshop found:', error);
          }
        }
      } else {
        throw new Error(data.message || 'Nenhuma oficina encontrada');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar oficina mais próxima';
      setSearchError(errorMessage);
      console.error('❌ Error fetching nearest workshop:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCallWorkshop = (phone: string) => {
    if (nearestWorkshop && isMounted) {
      try {
        trackConversion('call', nearestWorkshop.workshop.id.toString(), 'nearest_hero', {
          workshopName: nearestWorkshop.workshop.name,
          distance: nearestWorkshop.distance,
          interaction: 'hero_call_button'
        });
      } catch (error) {
        console.warn('Failed to track call conversion:', error);
      }
    }
    window.open(`tel:${phone.replace(/\D/g, '')}`, '_self');
  };

  const handleNavigateToWorkshop = (workshop: Workshop) => {
    if (nearestWorkshop && isMounted) {
      try {
        trackConversion('navigate', nearestWorkshop.workshop.id.toString(), 'nearest_hero', {
          workshopName: nearestWorkshop.workshop.name,
          distance: nearestWorkshop.distance,
          interaction: 'hero_navigate_button'
        });
      } catch (error) {
        console.warn('Failed to track navigate conversion:', error);
      }
    }
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${workshop.name} ${workshop.address}`
    )}`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleWhatsApp = (workshop: Workshop) => {
    if (!workshop.phone) return;

    if (nearestWorkshop && isMounted) {
      try {
        trackConversion('whatsapp', nearestWorkshop.workshop.id.toString(), 'nearest_hero', {
          workshopName: nearestWorkshop.workshop.name,
          distance: nearestWorkshop.distance,
          interaction: 'hero_whatsapp_button'
        });
      } catch (error) {
        console.warn('Failed to track WhatsApp conversion:', error);
      }
    }

    const whatsappUrl = `https://wa.me/55${workshop.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
      `Olá! Vi vocês no mapa de oficinas RuidCar. Gostaria de saber mais sobre os serviços.`
    )}`;
    window.open(whatsappUrl, '_blank');
  };

  // Loading state
  if (locationLoading || isSearching) {
    return (
      <Card className={`border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="font-semibold text-lg text-gray-900">
                {locationLoading ? 'Obtendo sua localização...' : 'Encontrando oficina mais próxima...'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {locationLoading
                  ? 'Aguarde enquanto detectamos onde você está'
                  : 'Buscando a melhor opção para você'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (locationError || searchError) {
    return (
      <Card className={`border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center">
            <Target className="h-12 w-12 mx-auto text-orange-500 mb-3" />
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              Não foi possível localizar oficinas próximas
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {locationError || searchError}
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              🔄 Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state - show nearest workshop
  if (nearestWorkshop) {
    const { workshop, distance } = nearestWorkshop;

    return (
      <Card className={`border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg ${className}`}>
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Sua oficina mais próxima</h2>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              📍 {distance.toFixed(1)} km de distância
            </Badge>
            {source && (
              <Badge variant="outline" className="ml-2 text-xs">
                {source === 'gps' ? '📡 GPS' : source === 'ip' ? '🌐 IP' : '💾 Cache'}
              </Badge>
            )}
          </div>

          {/* Workshop Info */}
          <div className="bg-white rounded-lg p-4 mb-4 border border-green-100">
            <h3 className="font-bold text-lg text-gray-900 mb-2">{workshop.name}</h3>
            <p className="text-gray-600 text-sm mb-2 flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
              {workshop.address}
            </p>
            {workshop.phone && (
              <p className="text-gray-600 text-sm flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                {workshop.phone}
              </p>
            )}
            {(workshop.city || workshop.state) && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {workshop.city && workshop.state
                    ? `${workshop.city}, ${workshop.state}`
                    : workshop.city || workshop.state
                  }
                </Badge>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {workshop.phone && (
              <Button
                onClick={() => handleCallWorkshop(workshop.phone!)}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Phone className="h-4 w-4 mr-2" />
                Ligar
              </Button>
            )}

            <Button
              onClick={() => handleNavigateToWorkshop(workshop)}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
              size="sm"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Navegar
            </Button>

            {onViewOnMap && (
              <Button
                onClick={() => {
                  if (nearestWorkshop && isMounted) {
                    try {
                      trackConversion('view_map', nearestWorkshop.workshop.id.toString(), 'nearest_hero', {
                        workshopName: nearestWorkshop.workshop.name,
                        distance: nearestWorkshop.distance,
                        interaction: 'hero_view_map_button'
                      });
                    } catch (error) {
                      console.warn('Failed to track view map conversion:', error);
                    }
                  }
                  onViewOnMap(workshop);
                }}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                size="sm"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Ver no mapa
              </Button>
            )}
          </div>

          {/* WhatsApp button if phone available */}
          {workshop.phone && (
            <div className="mt-3 pt-3 border-t border-green-100">
              <Button
                onClick={() => handleWhatsApp(workshop)}
                variant="outline"
                size="sm"
                className="w-full bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
              >
                💬 Falar no WhatsApp
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* RuidCar info */}
          <div className="mt-4 pt-3 border-t border-green-100">
            <p className="text-xs text-gray-500 text-center">
              🛠️ Esta oficina possui equipamento RuidCar para diagnóstico automotivo
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback - no workshop found
  return (
    <Card className={`border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 ${className}`}>
      <CardContent className="p-6">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="font-semibold text-lg text-gray-900 mb-2">
            Nenhuma oficina encontrada
          </h3>
          <p className="text-sm text-gray-600">
            Não encontramos oficinas RuidCar na sua região. Tente buscar manualmente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}