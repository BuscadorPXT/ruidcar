import { useEffect, useState } from "react";
import { X, MapPin, Phone, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Workshop } from "@shared/schema";

interface WorkshopModalMobileProps {
  workshop: Workshop | null;
  open: boolean;
  onClose: () => void;
}

export default function WorkshopModalMobile({ workshop, open, onClose }: WorkshopModalMobileProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setIsAnimating(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 200); // Wait for animation to complete
  };

  if (!workshop) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${workshop.name} ${workshop.address}`
  )}`;

  const whatsappUrl = workshop.phone
    ? `https://wa.me/55${workshop.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Olá! Vi vocês no mapa de oficinas RuidCar. Gostaria de saber mais sobre os serviços.`
      )}`
    : null;

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

      {/* Bottom Sheet Modal */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[85vh] overflow-hidden transition-transform duration-300 ease-out ${
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
                      >
                        💬 Falar no WhatsApp
                        <ExternalLink className="h-4 w-4 ml-2" aria-hidden="true" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Business Hours (if available) */}
            {workshop.business_hours && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
                  Horário de Funcionamento
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{workshop.business_hours}</p>
                </div>
              </div>
            )}

            {/* Description (if available) */}
            {workshop.description && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Sobre a Oficina</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{workshop.description}</p>
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
      </div>
    </>
  );
}