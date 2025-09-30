import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface CEPData {
  valid: boolean;
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  message?: string;
}

interface CEPFieldProps {
  value: string;
  onCEPChange?: (cep: string, data?: CEPData) => void;
  onAddressChange?: (address: string) => void;
  onCityChange?: (city: string) => void;
  onStateChange?: (state: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

export function CEPField({
  value,
  onCEPChange,
  onAddressChange,
  onCityChange,
  onStateChange,
  label = "CEP",
  placeholder = "00000-000",
  className = "",
  error,
  disabled = false
}: CEPFieldProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cepData, setCepData] = useState<CEPData | null>(null);
  const [cepError, setCepError] = useState<string>('');
  const [debouncedCEP, setDebouncedCEP] = useState(value);

  // Função para formatar CEP
  const formatCEP = (cep: string): string => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length <= 5) {
      return cleanCEP;
    }
    return `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5, 8)}`;
  };

  // Função para limpar CEP (apenas números)
  const cleanCEP = (cep: string): string => {
    return cep.replace(/\D/g, '');
  };

  // Debounce para evitar muitas consultas
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCEP(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  // Consultar CEP quando o valor debounced muda
  useEffect(() => {
    const cleanedCEP = cleanCEP(debouncedCEP);

    if (cleanedCEP.length === 8) {
      consultarCEP(cleanedCEP);
    } else {
      setCepData(null);
      setCepError('');
    }
  }, [debouncedCEP]);

  const consultarCEP = async (cep: string) => {
    if (isLoading) return;

    setIsLoading(true);
    setCepError('');
    setCepData(null);

    try {
      const response = await fetch(`/api/cep/${cep}`);
      const data: CEPData = await response.json();

      if (response.ok && data.valid) {
        setCepData(data);

        // Auto-preenchimento dos campos
        if (onAddressChange && data.logradouro) {
          const address = data.complemento
            ? `${data.logradouro}, ${data.complemento}`
            : data.logradouro;
          onAddressChange(address);
        }

        if (onCityChange && data.localidade) {
          onCityChange(data.localidade);
        }

        if (onStateChange && data.uf) {
          onStateChange(data.uf);
        }

        // Callback para o componente pai
        if (onCEPChange) {
          onCEPChange(formatCEP(cep), data);
        }
      } else {
        setCepError(data.message || 'CEP não encontrado');
        if (onCEPChange) {
          onCEPChange(formatCEP(cep));
        }
      }
    } catch (error) {
      console.error('Erro ao consultar CEP:', error);
      setCepError('Erro ao consultar CEP. Tente novamente.');
      if (onCEPChange) {
        onCEPChange(formatCEP(cep));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedCEP = formatCEP(inputValue);

    // Limitar a 9 caracteres (00000-000)
    if (formattedCEP.length <= 9) {
      if (onCEPChange) {
        onCEPChange(formattedCEP);
      }
    }
  };

  const handleManualSearch = () => {
    const cleanedCEP = cleanCEP(value);
    if (cleanedCEP.length === 8) {
      consultarCEP(cleanedCEP);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }

    if (cepData?.valid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }

    if (cepError) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }

    return null;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="cep">{label}</Label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="cep"
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            className={`pl-10 pr-10 ${error || cepError ? 'border-red-500' : ''}`}
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
          disabled={isLoading || disabled || cleanCEP(value).length !== 8}
          className="px-3"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
        </Button>
      </div>

      {/* Exibir erro */}
      {(error || cepError) && (
        <p className="text-sm text-destructive">
          {error || cepError}
        </p>
      )}

      {/* Exibir informações do CEP encontrado */}
      {cepData?.valid && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <div className="text-sm">
              <strong>Endereço encontrado:</strong>
              <br />
              {cepData.logradouro && (
                <>
                  {cepData.logradouro}
                  {cepData.complemento && `, ${cepData.complemento}`}
                  <br />
                </>
              )}
              {cepData.bairro && `${cepData.bairro}, `}
              {cepData.localidade} - {cepData.uf}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Instruções de uso */}
      <p className="text-xs text-muted-foreground">
        Digite o CEP para preenchimento automático do endereço
      </p>
    </div>
  );
}