import { useState, useEffect } from "react";
import { Search, MapPin, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { useMobile } from "@/hooks/use-mobile";
import { useAnalytics } from "@/hooks/use-analytics";
import LocationAutocomplete from "@/components/LocationAutocomplete";

interface WorkshopSearchProps {
  onSearch: (query: string) => Promise<void>;
  onNearbySearch: () => void;
  isLoading?: boolean;
  isGeolocating?: boolean;
  searchQuery?: string; // Current search query from URL state
}

export default function WorkshopSearch({ onSearch, onNearbySearch, isLoading, isGeolocating, searchQuery: externalSearchQuery = "" }: WorkshopSearchProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(externalSearchQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [useSmartSearch, setUseSmartSearch] = useState(false);
  const { toast } = useToast();
  const { trackEvent, setupABTest, trackABTestResult } = useAnalytics();
  const isMobile = useMobile();

  // A/B Testing para placeholders
  const placeholderVariant = setupABTest('search_placeholder_test', ['classic', 'friendly', 'action']);

  // A/B Testing para layout do botão
  const buttonLayoutVariant = setupABTest('button_layout_test', ['side', 'below']);

  // Sync local state with external search query from URL
  useEffect(() => {
    setLocalSearchQuery(externalSearchQuery);
  }, [externalSearchQuery]);

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(localSearchQuery, 500);

  // Auto-search when debounced query changes (and is not empty)
  useEffect(() => {
    if (debouncedSearchQuery.trim() && debouncedSearchQuery.length > 2) {
      performSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      return;
    }

    setIsSearching(true);
    try {
      // Track search event
      trackEvent('workshop_search', {
        query: query.toLowerCase(),
        queryLength: query.length,
        searchType: useSmartSearch ? 'smart' : 'traditional',
        isMobile,
        timestamp: Date.now(),
        placeholderVariant,
        buttonLayoutVariant
      });

      // Track A/B test results (conversion = successful search)
      trackABTestResult('search_placeholder_test', 'conversion', {
        searchPerformed: true,
        queryLength: query.length
      });
      trackABTestResult('button_layout_test', 'conversion', {
        searchPerformed: true,
        queryLength: query.length
      });

      await onSearch(query);
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Ocorreu um erro ao realizar a busca. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!localSearchQuery.trim()) {
      toast({
        title: "Digite uma busca",
        description: "Por favor, digite o que você está procurando (mínimo 3 caracteres)",
        variant: "destructive"
      });
      return;
    }

    // Força busca imediatamente (sem debounce) quando enviado via formulário
    await performSearch(localSearchQuery);
  };

  // Handle location selection from autocomplete
  const handleLocationSelect = async (location: { name: string; state: string; coordinates?: { lat: number; lng: number } }) => {
    const searchTerm = location.name;
    setLocalSearchQuery(searchTerm);

    // Track location selection
    trackEvent('location_autocomplete_select', {
      locationName: location.name,
      locationState: location.state,
      hasCoordinates: !!location.coordinates,
      isMobile,
      timestamp: Date.now()
    });

    // If we have coordinates, we could do a proximity search, but for now just search by name
    await performSearch(searchTerm);

    toast({
      title: "🎯 Local selecionado",
      description: `Buscando oficinas em ${location.name}`,
    });
  };

  // Placeholders baseados no A/B test
  const getPlaceholderText = () => {
    switch (placeholderVariant) {
      case 'classic':
        return "Buscar por cidade ou estado...";
      case 'friendly':
        return "Onde tem RuidCar perto de você? 😊";
      case 'action':
        return "🔍 Digite sua cidade e encontre oficinas!";
      default:
        return "Buscar por cidade ou estado...";
    }
  };

  const placeholders = [
    getPlaceholderText(),
    "Oficinas em Minas Gerais",
    "RuidCar perto de mim",
    "Oficinas no Rio de Janeiro",
    "Buscar por cidade ou estado..."
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Smart Search Toggle */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <Button
          variant={useSmartSearch ? "outline" : "ghost"}
          size="sm"
          onClick={() => {
            trackEvent('search_mode_toggle', {
              newMode: 'traditional',
              previousMode: useSmartSearch ? 'smart' : 'traditional',
              isMobile,
              timestamp: Date.now()
            });
            setUseSmartSearch(false);
          }}
          className="text-xs"
        >
          <Search className="h-3 w-3 mr-1" />
          Busca tradicional
        </Button>
        <Button
          variant={useSmartSearch ? "default" : "outline"}
          size="sm"
          onClick={() => {
            trackEvent('search_mode_toggle', {
              newMode: 'smart',
              previousMode: useSmartSearch ? 'smart' : 'traditional',
              isMobile,
              timestamp: Date.now()
            });
            setUseSmartSearch(true);
          }}
          className="text-xs"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Busca inteligente
        </Button>
      </div>

      {useSmartSearch ? (
        /* Smart Search with Autocomplete */
        <div className="space-y-4">
          <LocationAutocomplete
            value={localSearchQuery}
            onChange={setLocalSearchQuery}
            onLocationSelect={handleLocationSelect}
            placeholder="Digite cidade, estado ou CEP para sugestões..."
            className="w-full"
          />
          {(isSearching || isLoading) && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Buscando oficinas...</span>
            </div>
          )}
        </div>
      ) : (
        /* Traditional Search */
        buttonLayoutVariant === 'side' ? (
          <form onSubmit={handleSearch} className="flex gap-2" role="search" aria-label="Buscar oficinas credenciadas">
            <div className="relative flex-1">
              <label htmlFor="workshop-search" className="sr-only">
                Buscar oficinas por nome, cidade ou estado
              </label>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="workshop-search"
                type="text"
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                placeholder={placeholders[0]}
                className="pl-10 pr-4 h-12 text-base"
                disabled={isLoading || isSearching}
                aria-describedby="search-help"
                aria-label="Campo de busca de oficinas"
                autoComplete="off"
              />
              {(isSearching || isLoading) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
                </div>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || isSearching || localSearchQuery.length < 3}
              className="px-6"
              aria-label={isSearching ? "Buscando oficinas..." : "Buscar oficinas"}
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" aria-hidden="true" />
                  Buscar
                </>
              )}
            </Button>
          </form>
        ) : (
          /* Button Below Layout */
          <form onSubmit={handleSearch} className="space-y-3" role="search" aria-label="Buscar oficinas credenciadas">
            <div className="relative">
              <label htmlFor="workshop-search" className="sr-only">
                Buscar oficinas por nome, cidade ou estado
              </label>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="workshop-search"
                type="text"
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                placeholder={placeholders[0]}
                className="pl-10 pr-4 h-12 text-base"
                disabled={isLoading || isSearching}
                aria-describedby="search-help"
                aria-label="Campo de busca de oficinas"
                autoComplete="off"
              />
              {(isSearching || isLoading) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
                </div>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || isSearching || localSearchQuery.length < 3}
              className="w-full h-12 text-base"
              aria-label={isSearching ? "Buscando oficinas..." : "Buscar oficinas"}
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" aria-hidden="true" />
                  Buscar
                </>
              )}
            </Button>
          </form>
        )
      )}

      <div className="flex items-center justify-center">
        <Button
          variant="outline"
          onClick={() => {
            // Track nearby search
            trackEvent('nearby_search', {
              isMobile,
              timestamp: Date.now()
            });
            onNearbySearch();
          }}
          disabled={isLoading || isGeolocating}
          className="flex items-center gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={isGeolocating ? "Obtendo sua localização..." : "Buscar oficinas próximas à sua localização atual"}
        >
          {isGeolocating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Localizando...
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Oficinas próximas a mim
            </>
          )}
        </Button>
      </div>

      <div className="text-center">
        <p id="search-help" className="text-sm text-muted-foreground">
          {useSmartSearch ? (
            <>
              ✨ <strong>Busca inteligente</strong>: Sugestões automáticas de estados, cidades e CEP<br />
              📍 <strong>Histórico</strong>: Suas buscas recentes aparecem automaticamente<br />
              🎯 Exemplos: "São Paulo", "SP", "01310-100", "Belo Horizonte"
            </>
          ) : (
            <>
              🔍 <strong>Busca automática</strong>: Digite 3+ caracteres para buscar automaticamente<br />
              📍 <strong>Localização</strong>: Permita acesso para encontrar oficinas próximas<br />
              💭 Exemplos: "oficinas em SP", "RuidCar no Paraná", "oficinas perto de Brasília"
            </>
          )}
        </p>
      </div>
    </div>
  );
}