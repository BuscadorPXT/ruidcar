import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LeadStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig = {
  new: {
    label: 'Novo',
    variant: 'default' as const,
    className: 'bg-blue-500 hover:bg-blue-600'
  },
  contacted: {
    label: 'Contactado',
    variant: 'secondary' as const,
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
  },
  qualified: {
    label: 'Qualificado',
    variant: 'secondary' as const,
    className: 'bg-purple-500 hover:bg-purple-600 text-white'
  },
  proposal: {
    label: 'Proposta',
    variant: 'secondary' as const,
    className: 'bg-orange-500 hover:bg-orange-600 text-white'
  },
  negotiation: {
    label: 'Negociação',
    variant: 'secondary' as const,
    className: 'bg-indigo-500 hover:bg-indigo-600 text-white'
  },
  closed_won: {
    label: 'Ganho',
    variant: 'default' as const,
    className: 'bg-green-500 hover:bg-green-600'
  },
  closed_lost: {
    label: 'Perdido',
    variant: 'destructive' as const,
    className: 'bg-red-500 hover:bg-red-600'
  },
  nurturing: {
    label: 'Nutrição',
    variant: 'outline' as const,
    className: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  }
};

export default function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: 'outline' as const,
    className: ''
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}