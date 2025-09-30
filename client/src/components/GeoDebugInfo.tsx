
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GeoDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  const testGeolocation = async () => {
    try {
      // Testa a API de geolocalização
      const response = await fetch('https://ipinfo.io?token=9473f46e9baeed');
      const data = await response.json();
      
      // Informações do navegador
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      };
      
      setDebugInfo({
        ipInfo: data,
        browserInfo,
        currentUrl: window.location.href,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Verifica parâmetros de teste na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'geo') {
      setIsVisible(true);
      testGeolocation();
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Debug Geolocalização
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={testGeolocation} className="w-full">
            Testar Detecção
          </Button>
          
          {debugInfo && (
            <div className="space-y-2 text-xs">
              {debugInfo.ipInfo && (
                <div>
                  <Badge variant={debugInfo.ipInfo.country === 'BR' ? 'default' : 'secondary'}>
                    País: {debugInfo.ipInfo.country}
                  </Badge>
                  <p>IP: {debugInfo.ipInfo.ip}</p>
                  <p>Cidade: {debugInfo.ipInfo.city}</p>
                  <p>Região: {debugInfo.ipInfo.region}</p>
                </div>
              )}
              
              {debugInfo.browserInfo && (
                <div>
                  <p><strong>Idioma:</strong> {debugInfo.browserInfo.language}</p>
                  <p><strong>Idiomas:</strong> {debugInfo.browserInfo.languages?.join(', ')}</p>
                  <p><strong>Plataforma:</strong> {debugInfo.browserInfo.platform}</p>
                </div>
              )}
              
              {debugInfo.error && (
                <p className="text-red-500">Erro: {debugInfo.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
