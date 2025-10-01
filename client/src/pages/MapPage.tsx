import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { ArrowLeft, MapPin, List, Loader2, LogIn, Filter, X, Target } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMapFilters } from '@/hooks/use-url-state';
import { useWorkshopCache } from '@/hooks/use-workshop-cache';
import { useUserAnalytics } from '@/hooks/use-user-analytics';
import WorkshopMap from '@/components/WorkshopMap';
import WorkshopMapMobile from '@/components/WorkshopMapMobile';
import WorkshopSearch from '@/components/WorkshopSearch';
import WorkshopModal from '@/components/WorkshopModal';
import WorkshopModalMobile from '@/components/WorkshopModalMobile';
import HighContrastToggle from '@/components/HighContrastToggle';
import NearestWorkshopHero from '@/components/NearestWorkshopHero';
import { useMobile } from '@/hooks/use-mobile';
import { type Workshop } from '@shared/schema';
import { BRAZILIAN_STATES, STATE_NAMES } from '@shared/constants';

export default function MapPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const isMobile = useMobile();
  const { state: urlState, updateState: updateUrlState, isInitialized } = useMapFilters();
  const {
    getCachedSearchResults,
    setCachedSearchResults,
    getCachedAllWorkshops,
    setCachedAllWorkshops,
    getCacheStats
  } = useWorkshopCache();
  const analytics = useUserAnalytics();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [filteredWorkshops, setFilteredWorkshops] = useState<Workshop[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-15.7801, -47.9292]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [searchRadius, setSearchRadius] = useState(100); // Raio de busca em km
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Extract URL state
  const searchQuery = urlState.search;
  const selectedState = urlState.state;
  const viewMode = urlState.view as 'map' | 'list';

  // Load all workshops on mount (only after URL state is initialized)
  useEffect(() => {
    if (isInitialized) {
      loadWorkshops();
    }
  }, [isInitialized]);

  // Filter workshops by state when selectedState changes
  useEffect(() => {
    if (selectedState === 'all') {
      setFilteredWorkshops(workshops);
    } else {
      const filtered = workshops.filter(workshop => workshop.state === selectedState);
      setFilteredWorkshops(filtered);
    }
  }, [selectedState, workshops]);

  // Perform search when URL search query changes
  useEffect(() => {
    if (isInitialized && searchQuery && searchQuery.trim().length > 2) {
      handleSearch(searchQuery);
    } else if (isInitialized && !searchQuery) {
      // Reset to all workshops if search is cleared
      setFilteredWorkshops(workshops);
    }
  }, [searchQuery, isInitialized]);

  // Auto-geolocation after workshops are loaded
  useEffect(() => {
    if (workshops.length > 0 && !searchQuery && navigator.geolocation) {
      // Try automatic geolocation silently
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('🎯 Auto-localização bem-sucedida:', { latitude, longitude });
          await searchNearbyWorkshops(latitude, longitude, false);
        },
        (error) => {
          // Silent failure - just log for debugging
          console.log('Auto-localização falhou (silencioso):', error.code);
          // Keep showing all workshops
        },
        {
          enableHighAccuracy: false, // Use less battery for auto-detection
          timeout: 5000, // Shorter timeout for auto-detection
          maximumAge: 600000 // 10 minutes cache
        }
      );
    }
  }, [workshops.length, searchQuery]);

  const loadWorkshops = async () => {
    setIsLoading(true);
    console.log('🔄 Iniciando carregamento das oficinas...');
    const startTime = performance.now();

    // Check cache first
    const cachedWorkshops = getCachedAllWorkshops();
    if (cachedWorkshops) {
      console.log('🎯 Using cached workshops:', cachedWorkshops.length);
      setWorkshops(cachedWorkshops);
      setFilteredWorkshops(cachedWorkshops);
      setIsLoading(false);

      // Track cache hit
      analytics.trackPerformance('workshopsLoadTime', performance.now() - startTime, {
        source: 'cache',
        count: cachedWorkshops.length
      });
      return;
    }

    try {
      console.log('📡 Fazendo fetch para /api/workshops');
      const response = await fetch('/api/workshops');
      console.log('📊 Response status:', response.status, response.statusText);

      const data = await response.json();
      console.log('📋 Dados recebidos:', data);

      if (response.ok) {
        console.log('✅ Dados carregados com sucesso:', data.workshops?.length, 'oficinas');
        const workshopsData = data.workshops || [];

        // Cache the results
        setCachedAllWorkshops(workshopsData);

        setWorkshops(workshopsData);
        setFilteredWorkshops(workshopsData);

        // Track successful API load
        analytics.trackPerformance('workshopsLoadTime', performance.now() - startTime, {
          source: 'api',
          count: workshopsData.length,
          responseTime: performance.now() - startTime
        });

        if (workshopsData.length === 0) {
          toast({
            title: 'Nenhuma oficina encontrada',
            description: 'O banco de dados não retornou oficinas. Verifique se os dados foram importados.',
            variant: 'destructive'
          });

          // Track empty result
          analytics.trackError('empty_workshops_result', {
            apiCall: '/api/workshops',
            responseTime: performance.now() - startTime
          });
        }
      } else {
        throw new Error(data.message || 'Erro ao carregar oficinas');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar oficinas:', error);
      console.error('🔍 Detalhes do erro:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      });

      // Track API error
      analytics.trackError('workshops_load_failed', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        apiCall: '/api/workshops',
        responseTime: performance.now() - startTime
      });

      toast({
        title: 'Erro ao carregar oficinas',
        description: `Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique se o servidor está rodando.`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    updateUrlState({ search: query });
    setIsLoading(true);
    console.log('🔍 Iniciando busca com query:', query);
    const startTime = performance.now();

    // Check cache first
    const cachedResults = getCachedSearchResults(query, { state: selectedState });
    if (cachedResults) {
      console.log('🎯 Using cached search results for:', query);
      setFilteredWorkshops(cachedResults);
      setIsLoading(false);

      // Track search with cache hit
      analytics.trackSearch(query, { state: selectedState }, cachedResults.length, performance.now() - startTime);

      toast({
        title: `${cachedResults.length} oficinas encontradas`,
        description: cachedResults.length === 0 ? 'Tente buscar por outro termo ou ajustar o filtro' : '⚡ Resultado do cache',
      });

      if (cachedResults.length > 0) {
        const first = cachedResults[0];
        setMapCenter([parseFloat(first.latitude), parseFloat(first.longitude)]);
      }
      return;
    }

    try {
      console.log('📡 Fazendo POST para /api/workshops/search');
      const response = await fetch('/api/workshops/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      console.log('📊 Search response status:', response.status, response.statusText);

      const data = await response.json();
      console.log('📋 Resultados da busca:', data);

      if (response.ok) {
        console.log('✅ Busca realizada com sucesso:', data.count, 'oficinas encontradas');
        let workshops = data.workshops || [];

        // Apply state filter if one is selected
        if (selectedState !== 'all') {
          workshops = workshops.filter((workshop: Workshop) => workshop.state === selectedState);
        }

        // Cache the results
        setCachedSearchResults(query, { state: selectedState }, workshops);

        // Track successful search
        analytics.trackSearch(query, { state: selectedState }, workshops.length, performance.now() - startTime);

        setFilteredWorkshops(workshops);
        toast({
          title: `${workshops.length} oficinas encontradas`,
          description: workshops.length === 0 ? 'Tente buscar por outro termo ou ajustar o filtro' : undefined,
        });

        // Center map on first result if available
        if (workshops.length > 0) {
          const first = workshops[0];
          setMapCenter([parseFloat(first.latitude), parseFloat(first.longitude)]);
        }
      } else {
        throw new Error(data.message || 'Erro na busca');
      }
    } catch (error) {
      console.error('❌ Erro na busca:', error);
      console.error('🔍 Detalhes do erro de busca:', {
        message: error instanceof Error ? error.message : String(error),
        query: query
      });

      // Track search error
      analytics.trackError('search_failed', {
        query,
        filters: { state: selectedState },
        message: error instanceof Error ? error.message : String(error),
        responseTime: performance.now() - startTime
      });

      toast({
        title: 'Erro na busca',
        description: `Falha ao buscar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchNearbyWorkshops = async (latitude: number, longitude: number, showToasts = true) => {
    setIsLoading(true);

    try {
      console.log('📍 Localização obtida:', { latitude, longitude });
      const response = await fetch(
        `/api/workshops/nearby?lat=${latitude}&lng=${longitude}&radius=${searchRadius}`
      );
      const data = await response.json();

      if (response.ok) {
        let workshops = data.workshops;

        // Apply state filter if one is selected
        if (selectedState !== 'all') {
          workshops = workshops.filter((workshop: Workshop) => workshop.state === selectedState);
        }

        setFilteredWorkshops(workshops);
        setMapCenter([latitude, longitude]);
        setUserLocation([latitude, longitude]);

        if (showToasts) {
          toast({
            title: `🎯 ${workshops.length} oficinas encontradas`,
            description: `Num raio de ${data.radius}km da sua localização`,
          });
        }
      } else {
        throw new Error(data.message || 'Erro na busca');
      }
    } catch (error) {
      console.error('Erro na busca por proximidade:', error);
      if (showToasts) {
        toast({
          title: 'Erro na busca por proximidade',
          description: 'Não foi possível buscar oficinas próximas. Tente buscar manualmente por cidade.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNearbySearch = async () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocalização não suportada',
        description: 'Seu navegador não suporta geolocalização. Tente buscar manualmente por cidade.',
        variant: 'destructive'
      });
      return;
    }

    setIsGeolocating(true);

    // Mostrar toast informativo sobre permissão
    toast({
      title: '📍 Solicitando sua localização',
      description: 'Permita o acesso à localização para encontrar oficinas próximas a você.',
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await searchNearbyWorkshops(latitude, longitude, true);
        setIsGeolocating(false);
      },
      (error) => {
        setIsGeolocating(false);
        setIsLoading(false);

        let errorMessage = 'Por favor, permita o acesso à sua localização.';
        let fallbackAction = 'Você pode buscar manualmente por cidade ou estado.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Acesso à localização foi negado.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Localização não disponível no momento.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tempo limite para obter localização esgotado.';
            break;
        }

        toast({
          title: '⚠️ Erro ao obter localização',
          description: `${errorMessage} ${fallbackAction}`,
          variant: 'destructive'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 segundos
        maximumAge: 300000 // 5 minutos
      }
    );
  };

  const handleWorkshopClick = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setModalOpen(true);

    // Track workshop view
    analytics.trackWorkshopView(
      workshop.id.toString(),
      searchQuery ? 'search' : 'map',
      {
        name: workshop.name,
        state: workshop.state,
        city: workshop.city,
        hasSearchContext: !!searchQuery,
        currentViewMode: viewMode
      }
    );
  };

  const handleHeroViewOnMap = (workshop: Workshop) => {
    // Switch to map view and center on workshop
    updateUrlState({ view: 'map' });
    setMapCenter([parseFloat(workshop.latitude), parseFloat(workshop.longitude)]);
    setSelectedWorkshop(workshop);

    // Scroll to map area
    setTimeout(() => {
      const mapElement = document.querySelector('[role="tabpanel"][aria-label="Visualização em mapa"]');
      if (mapElement) {
        mapElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);

    // Track hero interaction
    analytics.trackWorkshopView(
      workshop.id.toString(),
      'nearest_hero',
      {
        name: workshop.name,
        state: workshop.state,
        city: workshop.city,
        source: 'nearest_workshop_hero'
      }
    );
  };

  const handleClearSearch = () => {
    updateUrlState({ search: '', state: 'all' });
    setFilteredWorkshops(workshops);
    setMapCenter([-15.7801, -47.9292]);
  };

  const getStateCount = () => {
    const states = new Set(filteredWorkshops.map(w => w.state).filter(Boolean));
    return states.size;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="w-full bg-white shadow-sm border-b" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="inline-flex items-center text-primary hover:underline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Voltar</span>
            </Link>
            <div className="flex items-center gap-2">
              <HighContrastToggle
                variant="icon"
                size="default"
                className="mr-2"
              />
              <Link href="/login">
                <a className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm text-primary hover:bg-accent">
                  <LogIn className="w-4 h-4" />
                  Login
                </a>
              </Link>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2" id="page-title">
            Oficinas Credenciadas RuidCar
          </h1>
          <p className="text-muted-foreground mb-4" aria-describedby="page-title">
            Encontre a oficina mais próxima de você com equipamento RuidCar instalado
          </p>

          {!isLoading && (
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="px-3 py-1">
                {filteredWorkshops.length} oficinas
              </Badge>
              <Badge variant="secondary" className="px-3 py-1">
                {getStateCount()} estados
              </Badge>
              {getCacheStats().searchCacheSize > 0 && (
                <Badge variant="outline" className="px-2 py-1 text-xs">
                  💾 {getCacheStats().searchCacheSize} cache
                </Badge>
              )}
              {(searchQuery || selectedState !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSearch}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Nearest Workshop Hero - Show on mobile when no active search */}
        {isMobile && !searchQuery && !isLoading && (
          <div className="mb-6">
            <NearestWorkshopHero
              onViewOnMap={handleHeroViewOnMap}
              className="mb-4"
            />
          </div>
        )}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <WorkshopSearch
                onSearch={handleSearch}
                onNearbySearch={handleNearbySearch}
                isLoading={isLoading || isGeolocating}
                isGeolocating={isGeolocating}
                searchQuery={searchQuery}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Select value={selectedState} onValueChange={(value) => {
                updateUrlState({ state: value });
                analytics.trackNavigation('state_filter', value, 'click');
              }}>
                <SelectTrigger className="w-full" aria-label="Filtrar oficinas por estado">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {BRAZILIAN_STATES.map(state => (
                    <SelectItem key={state} value={state}>
                      {state} - {STATE_NAMES[state]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Select value={searchRadius.toString()} onValueChange={(value) => {
                setSearchRadius(parseInt(value));
                analytics.trackNavigation('radius_filter', value, 'click');
              }}>
                <SelectTrigger className="w-full" aria-label="Definir raio de busca">
                  <SelectValue placeholder="Raio de busca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                  <SelectItem value="100">100 km</SelectItem>
                  <SelectItem value="200">200 km</SelectItem>
                  <SelectItem value="500">500 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => {
          updateUrlState({ view: v });
          analytics.trackNavigation(viewMode, v, 'click');
        }}>
          <TabsList className="grid w-full max-w-xs mx-auto grid-cols-2 mb-4" role="tablist" aria-label="Escolher visualização">
            <TabsTrigger
              value="map"
              className="flex items-center gap-2"
              aria-label="Visualizar oficinas no mapa"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Mapa
            </TabsTrigger>
            <TabsTrigger
              value="list"
              className="flex items-center gap-2"
              aria-label="Visualizar oficinas em lista"
            >
              <List className="h-4 w-4" aria-hidden="true" />
              Lista
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-0" role="tabpanel" aria-label="Visualização em mapa">
            {isLoading ? (
              <div className="h-[600px] flex items-center justify-center bg-white rounded-lg shadow" role="status" aria-live="polite">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                <span className="sr-only">Carregando mapa das oficinas...</span>
              </div>
            ) : (
              <div className={isMobile ? "h-[500px]" : "h-[600px]"}>
                {isMobile ? (
                  <WorkshopMapMobile
                    workshops={filteredWorkshops}
                    selectedWorkshop={selectedWorkshop}
                    onWorkshopClick={handleWorkshopClick}
                    center={mapCenter}
                    onNearbySearch={handleNearbySearch}
                    searchRadius={searchRadius}
                    userLocation={userLocation}
                  />
                ) : (
                  <WorkshopMap
                    workshops={filteredWorkshops}
                    selectedWorkshop={selectedWorkshop}
                    onWorkshopClick={handleWorkshopClick}
                    center={mapCenter}
                    searchRadius={searchRadius}
                    userLocation={userLocation}
                  />
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="list" className="mt-0" role="tabpanel" aria-label="Visualização em lista">
            {isLoading ? (
              <div className="h-[600px] flex items-center justify-center" role="status" aria-live="polite">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                <span className="sr-only">Carregando lista de oficinas...</span>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredWorkshops.map((workshop) => (
                  <Card
                    key={workshop.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleWorkshopClick(workshop)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2">{workshop.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {workshop.address}
                      </p>
                      {workshop.phone && (
                        <p className="text-sm text-muted-foreground">
                          📞 {workshop.phone}
                        </p>
                      )}
                      {workshop.city && workshop.state && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {workshop.city}, {workshop.state}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoading && filteredWorkshops.length === 0 && (
              <div className="text-center py-12" role="status" aria-live="polite">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma oficina encontrada</h3>
                <p className="text-muted-foreground">
                  Tente buscar por outro termo ou limpe a busca para ver todas as oficinas.
                </p>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={handleClearSearch}
                    className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label="Limpar filtros e mostrar todas as oficinas"
                  >
                    Mostrar todas as oficinas
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {isMobile ? (
        <WorkshopModalMobile
          workshop={selectedWorkshop}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedWorkshop(null);
          }}
        />
      ) : (
        <WorkshopModal
          workshop={selectedWorkshop}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedWorkshop(null);
          }}
        />
      )}
    </div>
  );
}