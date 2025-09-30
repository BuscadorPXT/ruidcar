import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Loader2, Shield } from 'lucide-react';

/**
 * Componente de redirecionamento para manter compatibilidade
 * com a URL /admin/login existente.
 *
 * Redireciona automaticamente para /login
 */
export default function AdminLoginRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirecionar para login unificado (detecção automática de tipo)
    setLocation('/login');
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Redirecionando...
        </h2>
        <p className="text-gray-600 mb-4">
          Você está sendo redirecionado para o novo login administrativo
        </p>
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    </div>
  );
}