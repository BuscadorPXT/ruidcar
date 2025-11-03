import { useEffect, useState } from "react";
import { X, MapPin, Phone, Clock, ExternalLink, ArrowLeft, ArrowRight, Navigation } from "lucide-react";
import { useDrag } from "@use-gesture/react";
import { useSpring, animated } from "@react-spring/web";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Workshop } from "@shared/schema";
import { useAnalytics } from "@/hooks/use-analytics";

interface WorkshopModalMobileProps {
  workshop: Workshop | null;
  open: boolean;
  onClose: () => void;
  source?: 'search' | 'nearest_hero' | 'map' | 'proximity_notification';
}

export default function WorkshopModalMobile({ workshop, open, onClose, source = 'map' }: WorkshopModalMobileProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeAction, setSwipeAction] = useState<'call' | 'navigate' | null>(null);
  const [isMounted, setIsMounted] = useState(true);
  const { trackConversion } = useAnalytics();

  // Spring animation for swipe feedback
  const [{ x, scale, backgroundColor }, api] = useSpring(() => ({
    x: 0,
    scale: 1,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    config: { tension: 300, friction: 30 }
  }));

  useEffect(() => {
    if (!isMounted) return;

    if (open) {
      setIsAnimating(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      // Track modal view only if component is still mounted
      if (workshop && isMounted) {
        try {
          trackConversion('view_map', workshop.id.toString(), source, {
            workshopName: workshop.name,
            workshopCity: workshop.city,
            interaction: 'modal_open'
          });
        } catch (error) {
          console.warn('Failed to track conversion:', error);
        }
      }
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
    }

    return () => {
      // Always restore body scroll on cleanup
      document.body.style.overflow = '';
    };
  }, [open, workshop, trackConversion, source, isMounted]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      setIsMounted(false);
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    if (!isMounted) return;

    setIsAnimating(false);
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        onClose();
      }
    }, 200); // Wait for animation to complete

    // Cleanup timeout if component unmounts
    return () => clearTimeout(timeoutId);
  };

  // Early return APÓS todos os hooks para evitar React Error #310
  if (!workshop) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
        <div className="w-full bg-white rounded-t-3xl p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando informações da oficina...</p>
          </div>
        </div>
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${workshop.name} ${workshop.address}`
  )}`;

  const whatsappUrl = workshop.phone
    ? `https://wa.me/55${workshop.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Olá! Vi vocês no mapa de oficinas RuidCar. Gostaria de saber mais sobre os serviços.`
      )}`
    : null;

  // Handler functions for actions
  const handleCallWorkshop = (phone: string) => {
    if (!isMounted || !workshop) return;

    try {
      trackConversion('call', workshop.id.toString(), source, {
        workshopName: workshop.name,
        phone: phone,
        interaction: 'direct_call'
      });
    } catch (error) {
      console.warn('Failed to track conversion:', error);
    }
    window.open(`tel:${phone.replace(/\D/g, '')}`, '_self');
  };

  const handleNavigateToWorkshop = (workshop: Workshop) => {
    if (!isMounted) return;

    try {
      trackConversion('navigate', workshop.id.toString(), source, {
        workshopName: workshop.name,
        destination: 'google_maps',
        interaction: 'navigate_button'
      });
    } catch (error) {
      console.warn('Failed to track conversion:', error);
    }
    window.open(googleMapsUrl, '_blank');
  };

  // Swipe gesture configuration
  const bind = useDrag(
    ({ active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
      if (!workshop || !isMounted) return;

      const trigger = Math.abs(mx) > 50; // Minimum distance to trigger action
      const isQuickSwipe = Math.abs(vx) > 0.5; // Quick swipe detection

      if (active) {
        // During drag - provide visual feedback
        const clampedMx = Math.max(-150, Math.min(150, mx));
        const intensity = Math.abs(clampedMx) / 150;

        // Determine action based on direction
        if (mx > 30) {
          setSwipeAction('call');
          api.start({
            x: clampedMx,
            backgroundColor: `rgba(34, 197, 94, ${0.1 + intensity * 0.2})`, // Green for call
            scale: 1 + intensity * 0.05
          });
        } else if (mx < -30) {
          setSwipeAction('navigate');
          api.start({
            x: clampedMx,
            backgroundColor: `rgba(59, 130, 246, ${0.1 + intensity * 0.2})`, // Blue for navigate
            scale: 1 + intensity * 0.05
          });
        } else {
          setSwipeAction(null);
          api.start({
            x: clampedMx,
            backgroundColor: 'rgba(255, 255, 255, 1)',
            scale: 1
          });
        }
      } else {
        // End of drag - execute action if threshold is met
        if ((trigger || isQuickSwipe) && swipeAction) {
          if (swipeAction === 'call' && workshop.phone) {
            handleCallWorkshop(workshop.phone);
          } else if (swipeAction === 'navigate') {
            handleNavigateToWorkshop(workshop);
          }
        }

        // Reset animation
        setSwipeAction(null);
        api.start({
          x: 0,
          backgroundColor: 'rgba(255, 255, 255, 1)',
          scale: 1
        });
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      rubberband: true
    }
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${
          open && isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Escape' && handleClose()}
        aria-label="Fechar modal"
      />

      {/* Bottom Sheet Modal with Swipe Gestures */}
      <animated.div
        {...bind()}
        style={{
          transform: x.to(x => `translateX(${x}px)`),
          scale,
          backgroundColor
        }}
        className={`fixed bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl z-50 max-h-[85vh] overflow-hidden transition-transform duration-300 ease-out touch-none ${
          open && isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="workshop-title"
        aria-describedby="workshop-description"
      >
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b">
          <div className="flex-1 pr-4">
            <h2 id="workshop-title" className="text-xl font-bold text-gray-900 mb-2">
              {workshop.name}
            </h2>
            <p id="workshop-description" className="text-gray-600 flex items-start gap-2">
              <MapPin className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" aria-hidden="true" />
              <span>{workshop.address}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-10 w-10 p-0 rounded-full hover:bg-gray-100"
            aria-label="Fechar detalhes da oficina"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
          <div className="space-y-6">
            {/* Location Info */}
            {(workshop.city || workshop.state) && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {workshop.city && workshop.state
                    ? `${workshop.city}, ${workshop.state}`
                    : workshop.city || workshop.state
                  }
                </Badge>
              </div>
            )}

            {/* Contact Info */}
            {workshop.phone && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
                  Contato
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 mb-3">{workshop.phone}</p>
                  {whatsappUrl && (
                    <Button
                      asChild
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Enviar mensagem via WhatsApp para ${workshop.name}`}
                        onClick={() => {
                          if (isMounted) {
                            try {
                              trackConversion('whatsapp', workshop.id.toString(), source, {
                                workshopName: workshop.name,
                                phone: workshop.phone,
                                interaction: 'whatsapp_button'
                              });
                            } catch (error) {
                              console.warn('Failed to track WhatsApp conversion:', error);
                            }
                          }
                        }}
                      >
                        💬 Falar no WhatsApp
                        <ExternalLink className="h-4 w-4 ml-2" aria-hidden="true" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}


            {/* RuidCar Info */}
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <h3 className="font-semibold text-primary mb-2">🛠️ Equipamento RuidCar</h3>
              <p className="text-sm text-gray-700">
                Esta oficina possui equipamento RuidCar para diagnóstico e manutenção
                automotiva com tecnologia avançada.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t bg-gray-50 space-y-3">
          <Button
            asChild
            size="lg"
            className="w-full h-12 text-base"
          >
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ver localização de ${workshop.name} no Google Maps`}
              onClick={() => {
                if (isMounted) {
                  try {
                    trackConversion('navigate', workshop.id.toString(), source, {
                      workshopName: workshop.name,
                      destination: 'google_maps',
                      interaction: 'main_button'
                    });
                  } catch (error) {
                    console.warn('Failed to track navigation conversion:', error);
                  }
                }
              }}
            >
              🗺️ Ver no Google Maps
              <ExternalLink className="h-5 w-5 ml-2" aria-hidden="true" />
            </a>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleClose}
            className="w-full h-12 text-base"
          >
            Fechar
          </Button>
        </div>

        {/* Swipe Instructions - Show when no active swipe */}
        {!swipeAction && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
            <div className="flex items-center gap-1 text-xs text-gray-400 bg-white/80 rounded-full px-3 py-1">
              <ArrowRight className="h-3 w-3 text-green-500" />
              <span>Arrastar para ligar</span>
              <span className="mx-1">•</span>
              <ArrowLeft className="h-3 w-3 text-blue-500" />
              <span>Arrastar para navegar</span>
            </div>
          </div>
        )}

        {/* Swipe Action Feedback */}
        {swipeAction && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className={`flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-full ${
              swipeAction === 'call' ? 'bg-green-500' : 'bg-blue-500'
            }`}>
              {swipeAction === 'call' ? (
                <>
                  <Phone className="h-5 w-5" />
                  <span>Ligar</span>
                </>
              ) : (
                <>
                  <Navigation className="h-5 w-5" />
                  <span>Navegar</span>
                </>
              )}
            </div>
          </div>
        )}
      </animated.div>
    </>
  );
}