import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LeadStatusBadge from './LeadStatusBadge';
import {
  User,
  Building,
  MapPin,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Hash,
  Clock,
  GripVertical
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Lead {
  id: number;
  fullName: string;
  company: string | null;
  email: string;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  status: string;
  leadScore: number | null;
  assignedTo: number | null;
  assignedUser?: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
  lastInteraction: string | null;
  interactionCount: number;
  tags: string[] | null;
  message: string;
  businessType: string | null;
}

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  isDragging?: boolean;
}

export default function LeadCard({ lead, onClick, isDragging }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCurrentlyDragging = isDragging || isSortableDragging;

  // Calculate days since creation
  const daysSinceCreation = Math.floor(
    (new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Determine urgency color based on days and status
  const getUrgencyColor = () => {
    if (lead.status === 'new' && daysSinceCreation > 3) return 'border-red-500';
    if (lead.status === 'contacted' && daysSinceCreation > 7) return 'border-orange-500';
    if (lead.status === 'qualified' && daysSinceCreation > 14) return 'border-yellow-500';
    return '';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "transition-all duration-200",
        isCurrentlyDragging && "opacity-50 scale-95"
      )}
    >
      <Card
        className={cn(
          "cursor-pointer hover:shadow-md transition-shadow border-l-4",
          getUrgencyColor(),
          "relative group"
        )}
        onClick={onClick}
      >
        <div
          {...attributes}
          {...listeners}
          className="absolute right-2 top-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <CardContent className="p-3 space-y-2">
          {/* Header with name and score */}
          <div className="flex items-start justify-between">
            <div className="font-medium text-sm leading-tight pr-6">
              {lead.fullName}
            </div>
            {lead.leadScore !== null && lead.leadScore > 0 && (
              <Badge
                variant={lead.leadScore >= 70 ? 'default' : lead.leadScore >= 40 ? 'secondary' : 'outline'}
                className="text-xs shrink-0"
              >
                {lead.leadScore}
              </Badge>
            )}
          </div>

          {/* Company and location */}
          {lead.company && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building className="h-3 w-3" />
              <span className="truncate">{lead.company}</span>
            </div>
          )}

          {(lead.city || lead.state) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">
                {[lead.city, lead.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {/* Contact buttons */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `mailto:${lead.email}`;
              }}
            >
              <Mail className="h-3 w-3" />
            </Button>
            {lead.whatsapp && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`, '_blank');
                }}
              >
                <Phone className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(lead.createdAt), { locale: ptBR, addSuffix: true })}</span>
            </div>
            {lead.interactionCount > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{lead.interactionCount}</span>
              </div>
            )}
          </div>

          {/* Assigned user */}
          {lead.assignedUser && (
            <div className="flex items-center gap-1 text-xs bg-muted rounded px-1.5 py-0.5">
              <User className="h-3 w-3" />
              <span className="truncate">{lead.assignedUser.name}</span>
            </div>
          )}

          {/* Tags */}
          {lead.tags && Array.isArray(lead.tags) && lead.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {lead.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {lead.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{lead.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}