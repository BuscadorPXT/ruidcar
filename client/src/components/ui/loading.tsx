import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

interface PageLoadingProps {
  message?: string;
  className?: string;
}

interface TableLoadingProps {
  rows?: number;
  columns?: number;
}

interface CardLoadingProps {
  count?: number;
  className?: string;
}

// Spinner de loading unificado
export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2
      className={cn(
        'animate-spin text-primary',
        sizeClasses[size],
        className
      )}
    />
  );
}

// Skeleton loading para texto
export function LoadingSkeleton({ className, lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-muted rounded animate-pulse',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

// Loading para páginas inteiras
export function PageLoading({ message = 'Carregando...', className }: PageLoadingProps) {
  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center bg-background',
      className
    )}>
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

// Loading para auth (mais rápido)
export function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
      </div>
    </div>
  );
}

// Loading para tabelas
export function TableLoading({ rows = 5, columns = 4 }: TableLoadingProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={cn(
                'h-10 bg-muted rounded animate-pulse',
                colIndex === 0 ? 'w-1/4' : 'flex-1'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Loading para cards
export function CardLoading({ count = 4, className }: CardLoadingProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-muted rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Loading para dashboard admin
export function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="h-4 bg-muted rounded w-96 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-muted rounded w-32 animate-pulse" />
          <div className="h-10 bg-muted rounded w-28 animate-pulse" />
        </div>
      </div>

      {/* Stats cards */}
      <CardLoading count={4} />

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/2" />
          </CardHeader>
          <CardContent>
            <LoadingSkeleton lines={5} />
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3" />
          </CardHeader>
          <CardContent>
            <LoadingSkeleton lines={4} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Loading para lista de workshops
export function WorkshopListLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-64 animate-pulse" />
          <div className="h-4 bg-muted rounded w-32 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-muted rounded w-28 animate-pulse" />
          <div className="h-10 bg-muted rounded w-32 animate-pulse" />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-20 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <TableLoading rows={8} columns={6} />
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de erro para fallback
export function LoadingError({
  message = 'Erro ao carregar',
  onRetry
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="text-destructive text-lg font-semibold">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}