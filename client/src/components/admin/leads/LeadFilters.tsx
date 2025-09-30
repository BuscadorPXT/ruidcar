import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Search, Filter, X } from 'lucide-react';

export interface LeadFiltersType {
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  assignedTo: string;
  minScore: string;
  maxScore: string;
  tags: string;
}

interface LeadFiltersProps {
  filters: LeadFiltersType;
  onFilterChange: (key: keyof LeadFiltersType, value: string) => void;
  onClearFilters: () => void;
}

export default function LeadFilters({ filters, onFilterChange, onClearFilters }: LeadFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">Filtros</h3>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <Label htmlFor="search" className="text-xs text-muted-foreground">
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nome, empresa, email..."
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status" className="text-xs text-muted-foreground">
              Status
            </Label>
            <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="contacted">Contactado</SelectItem>
                <SelectItem value="qualified">Qualificado</SelectItem>
                <SelectItem value="proposal">Proposta</SelectItem>
                <SelectItem value="negotiation">Negociação</SelectItem>
                <SelectItem value="closed_won">Fechado (Ganho)</SelectItem>
                <SelectItem value="closed_lost">Fechado (Perdido)</SelectItem>
                <SelectItem value="nurturing">Nutrição</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div>
            <Label htmlFor="startDate" className="text-xs text-muted-foreground">
              Data Inicial
            </Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="endDate" className="text-xs text-muted-foreground">
              Data Final
            </Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
            />
          </div>

          {/* Lead Score Range */}
          <div>
            <Label htmlFor="minScore" className="text-xs text-muted-foreground">
              Score Mínimo
            </Label>
            <Input
              id="minScore"
              type="number"
              min="0"
              max="100"
              placeholder="0"
              value={filters.minScore}
              onChange={(e) => onFilterChange('minScore', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="maxScore" className="text-xs text-muted-foreground">
              Score Máximo
            </Label>
            <Input
              id="maxScore"
              type="number"
              min="0"
              max="100"
              placeholder="100"
              value={filters.maxScore}
              onChange={(e) => onFilterChange('maxScore', e.target.value)}
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags" className="text-xs text-muted-foreground">
              Tags
            </Label>
            <Input
              id="tags"
              placeholder="Separadas por vírgula"
              value={filters.tags}
              onChange={(e) => onFilterChange('tags', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}