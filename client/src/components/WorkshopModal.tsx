import { useState, useEffect } from "react";
import { X, MapPin, Phone, Globe, Navigation, Calendar, Stethoscope, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { type Workshop } from "@shared/schema";
import BookingModal from "@/components/BookingModal";
import { useToast } from "@/hooks/use-toast";

interface WorkshopModalProps {
  workshop: Workshop | null;
  open: boolean;
  onClose: () => void;
}

interface DiagnosticStatus {
  isActive: boolean;
  hasValidPricing: boolean;
  hasAvailableSlots: boolean;
}

export default function WorkshopModal({ workshop, open, onClose }: WorkshopModalProps) {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [diagnosticStatus, setDiagnosticStatus] = useState<DiagnosticStatus | null>(null);
  const [loadingDiagnosticStatus, setLoadingDiagnosticStatus] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (workshop && open) {
      checkDiagnosticStatus();
    }
  }, [workshop, open]);

  const checkDiagnosticStatus = async () => {
    if (!workshop) return;

    setLoadingDiagnosticStatus(true);
    try {
      const response = await fetch(`/api/public/diagnostic/status/${workshop.id}`);
      if (response.ok) {
        const result = await response.json();
        setDiagnosticStatus(result.data);
      } else {
        setDiagnosticStatus(null);
      }
    } catch (error) {
      console.error('Erro ao verificar status do diagnóstico:', error);
      setDiagnosticStatus(null);
    } finally {
      setLoadingDiagnosticStatus(false);
    }
  };

  const handleBookingClick = () => {
    if (!diagnosticStatus?.isActive) {
      toast({
        title: 'Serviço não disponível',
        description: 'O serviço de diagnóstico não está disponível nesta oficina no momento.',
        variant: 'destructive'
      });
      return;
    }
    setBookingModalOpen(true);
  };

  // Early return APÓS todos os hooks para evitar React Error #310
  if (!workshop) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando informações da oficina...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleWhatsApp = () => {
    if (workshop.phone) {
      const phoneNumber = workshop.phone.replace(/\D/g, '');
      const message = encodeURIComponent(`Olá! Vi que vocês têm o equipamento RuidCar. Gostaria de mais informações.`);
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    }
  };

  const handleCall = () => {
    if (workshop.phone) {
      window.location.href = `tel:${workshop.phone}`;
    }
  };

  const handleDirections = () => {
    const address = encodeURIComponent(workshop.address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  const handleWebsite = () => {
    if (workshop.website) {
      const url = workshop.website.startsWith('http') ? workshop.website : `https://${workshop.website}`;
      window.open(url, '_blank');
    }
  };

  const isDiagnosticAvailable = diagnosticStatus?.isActive &&
                                 diagnosticStatus?.hasValidPricing &&
                                 diagnosticStatus?.hasAvailableSlots;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <span className="text-xl font-bold">{workshop.name}</span>
              {diagnosticStatus?.isActive && (
                <Badge className="bg-green-500 text-white ml-2">
                  <Stethoscope className="h-3 w-3 mr-1" />
                  Diagnóstico RuidCar
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-muted-foreground">Endereço</p>
              <p className="text-sm">{workshop.address}</p>
            </div>
          </div>

          {workshop.phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-muted-foreground">Telefone</p>
                <p className="text-sm">{workshop.phone}</p>
              </div>
            </div>
          )}

          {workshop.website && (
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-muted-foreground">Website</p>
                <p className="text-sm">{workshop.website}</p>
              </div>
            </div>
          )}

          {/* Seção de Diagnóstico RuidCar */}
          {diagnosticStatus && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Diagnóstico RuidCar</h3>
              </div>

              {isDiagnosticAvailable ? (
                <Button
                  onClick={handleBookingClick}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                  disabled={loadingDiagnosticStatus}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Diagnóstico
                </Button>
              ) : diagnosticStatus.isActive ? (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-sm">
                    {!diagnosticStatus.hasValidPricing
                      ? "Preços em configuração. Entre em contato para mais informações."
                      : "Sem horários disponíveis no momento. Entre em contato para agendar."}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-gray-200 bg-gray-50">
                  <AlertCircle className="h-4 w-4 text-gray-600" />
                  <AlertDescription className="text-sm">
                    Serviço de diagnóstico em breve. Entre em contato para mais informações.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="pt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {workshop.phone && (
                <>
                  <Button
                    onClick={handleCall}
                    variant="outline"
                    className="w-full"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Ligar
                  </Button>
                  <Button
                    onClick={handleWhatsApp}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    WhatsApp
                  </Button>
                </>
              )}
            </div>

            <Button
              onClick={handleDirections}
              variant="default"
              className="w-full"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Como Chegar
            </Button>

            {workshop.website && (
              <Button
                onClick={handleWebsite}
                variant="outline"
                className="w-full"
              >
                <Globe className="h-4 w-4 mr-2" />
                Visitar Site
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Modal de Agendamento */}
    <BookingModal
      isOpen={bookingModalOpen}
      onClose={() => setBookingModalOpen(false)}
      workshop={workshop}
    />
  </>
  );
}