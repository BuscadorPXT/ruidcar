import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Eye, Monitor, Palette, Check, Info } from 'lucide-react';
import { useHighContrast } from '@/hooks/use-high-contrast';

interface HighContrastToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'button' | 'icon' | 'minimal';
  size?: 'sm' | 'default' | 'lg';
}

export default function HighContrastToggle({
  className = '',
  showLabel = false,
  variant = 'icon',
  size = 'default'
}: HighContrastToggleProps) {
  const {
    mode,
    isEnabled,
    toggleContrast,
    setContrastMode,
    resetToSystemPreference,
    validateWCAGCompliance,
    systemPreference,
    autoDetect
  } = useHighContrast();

  const [showCompliance, setShowCompliance] = useState(false);

  const compliance = validateWCAGCompliance();

  const getModeLabel = (contrastMode: string) => {
    switch (contrastMode) {
      case 'high':
        return 'Alto Contraste';
      case 'extra-high':
        return 'Contraste Máximo';
      default:
        return 'Normal';
    }
  };

  const getModeDescription = (contrastMode: string) => {
    switch (contrastMode) {
      case 'high':
        return 'Cores mais definidas para melhor legibilidade';
      case 'extra-high':
        return 'Máximo contraste para deficiência visual';
      default:
        return 'Aparência padrão do sistema';
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'high':
        return <Eye className="h-4 w-4" />;
      case 'extra-high':
        return <Palette className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getButtonContent = () => {
    if (variant === 'minimal') {
      return getIcon();
    }

    if (variant === 'button' || showLabel) {
      return (
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="hidden sm:inline">{getModeLabel(mode)}</span>
        </div>
      );
    }

    return getIcon();
  };

  const buttonSizeClass = {
    sm: 'h-8 w-8',
    default: 'h-9 w-9',
    lg: 'h-10 w-10'
  }[size];

  if (variant === 'minimal') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={toggleContrast}
        className={`${buttonSizeClass} ${className}`}
        aria-label={`Alternar modo de contraste. Atual: ${getModeLabel(mode)}`}
        title={getModeDescription(mode)}
      >
        {getButtonContent()}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={`${variant === 'icon' ? buttonSizeClass : ''} ${className}`}
          aria-label={`Configurações de contraste. Modo atual: ${getModeLabel(mode)}`}
        >
          {getButtonContent()}
          {isEnabled && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {mode === 'high' ? 'AC' : 'MAX'}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Modo de Contraste
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Normal Mode */}
        <DropdownMenuItem
          onClick={() => setContrastMode('normal')}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <div>
              <div className="font-medium">Normal</div>
              <div className="text-xs text-muted-foreground">
                Aparência padrão
              </div>
            </div>
          </div>
          {mode === 'normal' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        {/* High Contrast Mode */}
        <DropdownMenuItem
          onClick={() => setContrastMode('high')}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <div>
              <div className="font-medium">Alto Contraste</div>
              <div className="text-xs text-muted-foreground">
                Cores mais definidas
              </div>
            </div>
          </div>
          {mode === 'high' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        {/* Extra High Contrast Mode */}
        <DropdownMenuItem
          onClick={() => setContrastMode('extra-high')}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <div>
              <div className="font-medium">Contraste Máximo</div>
              <div className="text-xs text-muted-foreground">
                Para deficiência visual
              </div>
            </div>
          </div>
          {mode === 'extra-high' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* System Preference */}
        <DropdownMenuItem
          onClick={resetToSystemPreference}
          className="flex items-center gap-2"
        >
          <Monitor className="h-4 w-4" />
          <div>
            <div className="font-medium">Usar preferência do sistema</div>
            <div className="text-xs text-muted-foreground">
              Detectado: {getModeLabel(systemPreference)}
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* WCAG Compliance Info */}
        <DropdownMenuItem
          onClick={() => setShowCompliance(!showCompliance)}
          className="flex items-center gap-2"
        >
          <Info className="h-4 w-4" />
          <span>Informações de Acessibilidade</span>
        </DropdownMenuItem>

        {showCompliance && (
          <div className="p-3 mt-1 bg-muted rounded-md">
            <div className="text-xs space-y-2">
              <div className="font-medium">WCAG 2.1 Compliance</div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${compliance.aa ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>AA Normal</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${compliance.aaa ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>AAA Normal</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${compliance.aaLarge ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>AA Large</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${compliance.aaaLarge ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>AAA Large</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Ratio: {compliance.ratio.toFixed(2)}:1
              </div>

              {autoDetect && (
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  🔄 Auto-detectando preferências do sistema
                </div>
              )}
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}