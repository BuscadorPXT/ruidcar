import React, { Component, ReactNode } from 'react';
import { AlertCircle, Copy, RefreshCw, Bug, Info } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string; // Nome do componente para contexto
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId: string;
  timestamp: number;
  retryCount: number;
}

interface ErrorReport {
  id: string;
  timestamp: number;
  url: string;
  userAgent: string;
  component: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  componentStack?: string;
  retryCount: number;
  performance: {
    memory?: any;
    timing?: any;
  };
}

export default class ErrorBoundary extends Component<Props, State> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: '',
      timestamp: 0,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = Math.random().toString(36).substring(2, 15);
    return {
      hasError: true,
      error,
      errorId,
      timestamp: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log detalhado do erro
    console.group('🚨 Error Boundary - Erro Capturado');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Props context:', this.props.name || 'Unknown');
    console.groupEnd();

    // Criar relatório detalhado
    const report = this.createErrorReport(error, errorInfo);

    // Enviar para analytics/monitoring
    this.sendErrorReport(report);

    // Chamar callback customizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private createErrorReport(error: Error, errorInfo: React.ErrorInfo): ErrorReport {
    return {
      id: this.state.errorId,
      timestamp: this.state.timestamp,
      url: window.location.href,
      userAgent: navigator.userAgent,
      component: this.props.name || 'Unknown Component',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack || undefined
      },
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      performance: {
        // @ts-ignore - Performance memory API
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : undefined,
        timing: performance.timing ? {
          loadEventEnd: performance.timing.loadEventEnd,
          domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd
        } : undefined
      }
    };
  }

  private async sendErrorReport(report: ErrorReport) {
    try {
      // Enviar para endpoint de monitoramento
      await fetch('/api/error-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        keepalive: true
      }).catch(() => {
        // Falha silenciosa para não gerar mais erros
        console.warn('Failed to send error report');
      });
    } catch {
      // Falha silenciosa
    }
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleCopyErrorInfo = async () => {
    const errorText = this.generateErrorText();
    try {
      await navigator.clipboard.writeText(errorText);
      // Feedback visual seria ideal aqui
    } catch {
      console.warn('Failed to copy error info');
    }
  };

  private generateErrorText(): string {
    const { error, errorInfo, errorId, timestamp } = this.state;
    return `
Error ID: ${errorId}
Timestamp: ${new Date(timestamp).toISOString()}
Component: ${this.props.name || 'Unknown'}
URL: ${window.location.href}

Error: ${error?.name || 'Unknown'}
Message: ${error?.message || 'No message'}

Stack Trace:
${error?.stack || 'No stack trace'}

Component Stack:
${errorInfo?.componentStack || 'No component stack'}
    `.trim();
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Enhanced error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-neutral-50 p-4">
          <div className="text-center max-w-2xl w-full">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Algo deu errado
            </h1>

            <p className="text-gray-600 mb-6">
              Encontramos um erro inesperado no componente{' '}
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {this.props.name || 'desconhecido'}
              </span>
              . Por favor, tente uma das opções abaixo.
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                disabled={this.state.retryCount >= 3}
              >
                <RefreshCw className="h-4 w-4" />
                Tentar Novamente
                {this.state.retryCount > 0 && (
                  <span className="text-xs opacity-75">({this.state.retryCount})</span>
                )}
              </button>

              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Recarregar Página
              </button>

              <button
                onClick={this.handleCopyErrorInfo}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy className="h-4 w-4" />
                Copiar Info do Erro
              </button>
            </div>

            {/* Error info box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-left">
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                <Info className="h-4 w-4" />
                <span>ID do Erro: </span>
                <code className="font-mono text-xs bg-white px-2 py-1 rounded">
                  {this.state.errorId}
                </code>
              </div>

              <div className="text-sm text-gray-600">
                <strong>Timestamp:</strong> {new Date(this.state.timestamp).toLocaleString('pt-BR')}
              </div>

              {this.state.error && (
                <div className="text-sm text-gray-600 mt-2">
                  <strong>Erro:</strong> {this.state.error.message}
                </div>
              )}
            </div>

            {/* Development details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-red-50 border border-red-200 rounded-lg p-4">
                <summary className="cursor-pointer text-sm text-red-700 font-medium flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Detalhes Técnicos (Desenvolvimento)
                </summary>

                <div className="mt-3 space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-red-700 mb-1">Error Stack:</h4>
                    <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40 border">
                      {this.state.error.stack}
                    </pre>
                  </div>

                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <h4 className="text-xs font-semibold text-red-700 mb-1">Component Stack:</h4>
                      <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32 border">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Retry limit warning */}
            {this.state.retryCount >= 3 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Limite de tentativas atingido. Considere recarregar a página.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }
}