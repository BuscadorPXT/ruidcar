import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Search, Loader2, CheckCircle, XCircle, MapPin, Phone } from 'lucide-react';

interface Workshop {
  id: number;
  uniqueCode: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  active: boolean;
}

interface WorkshopSearchResult {
  found: boolean;
  workshop?: Workshop;
  message?: string;
}

interface WorkshopSearchFieldProps {
  value: string;
  onCodeChange: (code: string) => void;
  onWorkshopFound?: (workshop: Workshop) => void;
  onWorkshopNotFound?: () => void;
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
  showWorkshopInfo?: boolean;
}

export function WorkshopSearchField({
  value,
  onCodeChange,
  onWorkshopFound,
  onWorkshopNotFound,
  label = "Código da Oficina",
  placeholder = "Ex: RCW-1234",
  className = "",
  error,
  disabled = false,
  showWorkshopInfo = true
}: WorkshopSearchFieldProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [searchError, setSearchError] = useState<string>('');
  const [debouncedCode, setDebouncedCode] = useState(value);

  // Função para formatar código (sempre maiúsculo)
  const formatCode = (code: string): string => {
    return code.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  };

  // Debounce para evitar muitas consultas
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCode(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  // Buscar oficina quando o código debounced muda
  useEffect(() => {
    const formattedCode = formatCode(debouncedCode);

    if (formattedCode.length >= 3 && formattedCode.includes('-')) {
      buscarOficina(formattedCode);
    } else {
      setWorkshop(null);
      setSearchError('');
    }
  }, [debouncedCode]);

  const buscarOficina = async (code: string) => {
    if (isLoading) return;

    setIsLoading(true);
    setSearchError('');
    setWorkshop(null);

    try {
      const response = await fetch(`/api/workshops/search-by-code/${encodeURIComponent(code)}`);
      const data: WorkshopSearchResult = await response.json();

      if (response.ok && data.found && data.workshop) {
        setWorkshop(data.workshop);

        // Callback para o componente pai
        if (onWorkshopFound) {
          onWorkshopFound(data.workshop);
        }
      } else {
        setSearchError(data.message || 'Oficina não encontrada');

        if (onWorkshopNotFound) {
          onWorkshopNotFound();
        }
      }
    } catch (error) {
      console.error('Erro ao buscar oficina:', error);
      setSearchError('Erro ao buscar oficina. Tente novamente.');

      if (onWorkshopNotFound) {
        onWorkshopNotFound();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedCode = formatCode(inputValue);

    // Limitar a um tamanho razoável
    if (formattedCode.length <= 10) {
      onCodeChange(formattedCode);
    }
  };

  const handleManualSearch = () => {
    const formattedCode = formatCode(value);
    if (formattedCode.length >= 3) {
      buscarOficina(formattedCode);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }

    if (workshop) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }

    if (searchError) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }

    return null;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="workshopCode">{label}</Label>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="workshopCode"
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={handleInputChange}
              className={`pl-10 pr-10 ${error || searchError ? 'border-red-500' : ''}`}
              disabled={disabled}
            />
            <div className="absolute right-3 top-3">
              {getStatusIcon()}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualSearch}
            disabled={isLoading || disabled || value.length < 3}
            className="px-3"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Exibir erro */}
        {(error || searchError) && (
          <p className="text-sm text-destructive">
            {error || searchError}
          </p>
        )}

        {/* Instruções de uso */}
        <p className="text-xs text-muted-foreground">
          Digite o código único da oficina (ex: RCW-1234) para carregar os dados automaticamente
        </p>
      </div>

      {/* Exibir informações da oficina encontrada */}
      {workshop && showWorkshopInfo && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>

              <div className="flex-1 space-y-2">
                <div>
                  <h4 className="font-semibold text-green-800">{workshop.name}</h4>
                  <p className="text-sm text-green-700">
                    Código: <span className="font-mono font-medium">{workshop.uniqueCode}</span>
                  </p>
                </div>

                <div className="space-y-1 text-sm text-green-700">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {workshop.address}, {workshop.city} - {workshop.state}
                    </span>
                  </div>

                  {workshop.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>{workshop.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${workshop.active ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-green-600">
                    {workshop.active ? 'Oficina Ativa' : 'Oficina Inativa'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta se oficina encontrada mas inativa */}
      {workshop && !workshop.active && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Esta oficina está inativa no sistema. Entre em contato com o suporte para mais informações.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}