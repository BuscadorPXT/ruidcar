import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import LeadCard from './LeadCard';
import LeadStatusBadge from './LeadStatusBadge';
import {
  User,
  Building,
  MapPin,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Hash
} from 'lucide-react';

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

interface LeadKanbanProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onRefresh: () => void;
}

const LEAD_STATUSES = [
  { id: 'new', label: 'Novo', color: 'bg-blue-500' },
  { id: 'contacted', label: 'Contactado', color: 'bg-yellow-500' },
  { id: 'qualified', label: 'Qualificado', color: 'bg-purple-500' },
  { id: 'proposal', label: 'Proposta', color: 'bg-orange-500' },
  { id: 'negotiation', label: 'Negociação', color: 'bg-indigo-500' },
  { id: 'closed_won', label: 'Ganho', color: 'bg-green-500' },
  { id: 'closed_lost', label: 'Perdido', color: 'bg-red-500' },
  { id: 'nurturing', label: 'Nutrição', color: 'bg-gray-500' },
];

export default function LeadKanban({ leads, onLeadClick, onRefresh }: LeadKanbanProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Organize leads by status
  const leadsByStatus = useMemo(() => {
    const organized: Record<string, Lead[]> = {};
    LEAD_STATUSES.forEach(status => {
      organized[status.id] = [];
    });

    // Check if leads exists and is an array before processing
    if (leads && Array.isArray(leads)) {
      leads.forEach(lead => {
        if (organized[lead.status]) {
          organized[lead.status].push(lead);
        } else {
          organized['new'].push(lead); // Default to 'new' if status unknown
        }
      });
    }

    return organized;
  }, [leads]);

  // Update lead status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, newStatus }: { leadId: number; newStatus: string }) => {
      const response = await fetch(`/api/admin/leads/${leadId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          newStatus,
          notes: `Status alterado via Kanban para ${newStatus}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update lead status');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Status atualizado',
        description: `Lead movido para ${LEAD_STATUSES.find(s => s.id === variables.newStatus)?.label}`,
      });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onRefresh();
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do lead',
        variant: 'destructive'
      });
      onRefresh(); // Refresh to revert visual changes
    }
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeLeadId = parseInt(active.id as string);
    const overStatus = over.id as string;

    // Check if it's a status column
    if (LEAD_STATUSES.some(s => s.id === overStatus)) {
      // Find the lead
      const lead = leads.find(l => l.id === activeLeadId);
      if (lead && lead.status !== overStatus) {
        // Update the lead status
        updateStatusMutation.mutate({
          leadId: activeLeadId,
          newStatus: overStatus
        });
      }
    }

    setActiveId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeLeadId = parseInt(active.id as string);
    const overStatus = over.id as string;

    // Visual feedback during drag
    if (LEAD_STATUSES.some(s => s.id === overStatus)) {
      // Could add visual feedback here
    }
  };

  const activeLead = activeId ? leads.find(l => l.id === parseInt(activeId as string)) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {LEAD_STATUSES.map((status) => (
          <div key={status.id} className="min-w-[320px]">
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${status.color}`} />
                  <h3 className="font-medium">{status.label}</h3>
                  <Badge variant="secondary" className="ml-1">
                    {leadsByStatus[status.id]?.length || 0}
                  </Badge>
                </div>
              </div>
            </div>

            <Card className="h-[calc(100vh-300px)]">
              <ScrollArea className="h-full">
                <SortableContext
                  items={leadsByStatus[status.id]?.map(l => l.id.toString()) || []}
                  strategy={verticalListSortingStrategy}
                  id={status.id}
                >
                  <div className="p-2 space-y-2 min-h-full" data-status={status.id}>
                    {leadsByStatus[status.id]?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Nenhum lead neste status
                      </div>
                    ) : (
                      leadsByStatus[status.id]?.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onClick={() => onLeadClick(lead)}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </ScrollArea>
            </Card>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="font-medium">{activeLead.fullName}</div>
                {activeLead.company && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building className="h-3 w-3" />
                    {activeLead.company}
                  </div>
                )}
                {activeLead.city && activeLead.state && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {activeLead.city}, {activeLead.state}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <LeadStatusBadge status={activeLead.status} />
                  {activeLead.leadScore && (
                    <Badge variant="outline" className="text-xs">
                      Score: {activeLead.leadScore}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}