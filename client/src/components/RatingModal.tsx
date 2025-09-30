import { useState } from 'react';
import {
  Star,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: number;
  customerName: string;
  workshopName: string;
  confirmationCode: string;
}

interface RatingAspect {
  id: string;
  label: string;
  icon: React.ReactNode;
  rating: number;
}

const RATING_LABELS = [
  'Muito Ruim',
  'Ruim',
  'Regular',
  'Bom',
  'Excelente'
];

export default function RatingModal({
  isOpen,
  onClose,
  appointmentId,
  customerName,
  workshopName,
  confirmationCode
}: RatingModalProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [aspects, setAspects] = useState<RatingAspect[]>([
    { id: 'service', label: 'Qualidade do Serviço', icon: '🔧', rating: 0 },
    { id: 'time', label: 'Pontualidade', icon: '⏰', rating: 0 },
    { id: 'care', label: 'Atendimento', icon: '👥', rating: 0 },
    { id: 'price', label: 'Custo-Benefício', icon: '💰', rating: 0 }
  ]);
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleAspectRating = (aspectId: string, rating: number) => {
    setAspects(prev => prev.map(aspect =>
      aspect.id === aspectId ? { ...aspect, rating } : aspect
    ));
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast({
        title: 'Avaliação incompleta',
        description: 'Por favor, dê uma nota geral para o serviço',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/public/appointment/${confirmationCode}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId,
          overallRating,
          aspects: aspects.reduce((acc, aspect) => ({
            ...acc,
            [aspect.id]: aspect.rating
          }), {}),
          comment,
          wouldRecommend
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar avaliação');
      }

      setSubmitted(true);
      toast({
        title: 'Obrigado pela sua avaliação!',
        description: 'Sua opinião é muito importante para nós.'
      });

      // Fechar modal após 3 segundos
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar sua avaliação. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ rating, onRate, size = 'default' }: {
    rating: number;
    onRate: (rating: number) => void;
    size?: 'small' | 'default' | 'large';
  }) => {
    const [hover, setHover] = useState(0);
    const sizeClasses = {
      small: 'h-4 w-4',
      default: 'h-6 w-6',
      large: 'h-8 w-8'
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              className={`${sizeClasses[size]} transition-colors ${
                star <= (hover || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Obrigado!</h2>
            <p className="text-gray-600">
              Sua avaliação foi enviada com sucesso.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Agradecemos por compartilhar sua experiência!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avalie seu Diagnóstico RuidCar</DialogTitle>
          <DialogDescription>
            {customerName}, como foi sua experiência na {workshopName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avaliação Geral */}
          <div className="text-center py-4">
            <Label className="text-lg font-semibold mb-3 block">
              Avaliação Geral
            </Label>
            <div className="flex justify-center mb-2">
              <StarRating
                rating={overallRating}
                onRate={setOverallRating}
                size="large"
              />
            </div>
            {overallRating > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {RATING_LABELS[overallRating - 1]}
              </p>
            )}
          </div>

          {/* Aspectos Específicos */}
          <div>
            <Label className="text-base font-semibold mb-4 block">
              Avalie cada aspecto do serviço (opcional)
            </Label>
            <div className="grid gap-4">
              {aspects.map((aspect) => (
                <div
                  key={aspect.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{aspect.icon}</span>
                    <span className="text-sm font-medium">{aspect.label}</span>
                  </div>
                  <StarRating
                    rating={aspect.rating}
                    onRate={(rating) => handleAspectRating(aspect.id, rating)}
                    size="small"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recomendação */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Você recomendaria nosso serviço?
            </Label>
            <div className="flex gap-4 justify-center">
              <Button
                variant={wouldRecommend === true ? 'default' : 'outline'}
                onClick={() => setWouldRecommend(true)}
                className="flex-1"
              >
                👍 Sim, recomendaria
              </Button>
              <Button
                variant={wouldRecommend === false ? 'default' : 'outline'}
                onClick={() => setWouldRecommend(false)}
                className="flex-1"
              >
                👎 Não recomendaria
              </Button>
            </div>
          </div>

          {/* Comentário */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              <MessageSquare className="inline h-4 w-4 mr-2" />
              Deixe seu comentário (opcional)
            </Label>
            <Textarea
              placeholder="Conte-nos mais sobre sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Seu feedback nos ajuda a melhorar nossos serviços
            </p>
          </div>

          {/* Informações sobre uso dos dados */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Sua avaliação será compartilhada com a oficina e poderá ser usada
              para melhorar nossos serviços. Dados pessoais não serão divulgados
              publicamente.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Avaliar depois
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || overallRating === 0}
          >
            {loading ? (
              <>Enviando...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Avaliação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}