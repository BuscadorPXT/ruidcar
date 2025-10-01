import { useState, useRef, useEffect } from 'react';
import { MapPin, Search, X, Loader2, History, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocationSuggestions } from '@/hooks/use-location-suggestions';

interface LocationAutocompleteProps {
  onLocationSelect: (location: {
    name: string;
    state: string;
    coordinates?: { lat: number; lng: number };
  }) => void;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function LocationAutocomplete({
  onLocationSelect,
  placeholder = "Digite cidade, estado ou CEP...",
  className = "",
  value = "",
  onChange
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('location_searches') || '[]').slice(0, 5);
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading, error, clearSuggestions } = useLocationSuggestions(query, {
    minQueryLength: 2,
    debounceMs: 300,
    maxResults: 6
  });

  // Sync with external value
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Handle input change
  const handleInputChange = (newValue: string) => {
    setQuery(newValue);
    onChange?.(newValue);
    setIsOpen(true);
  };

  // Handle location selection
  const handleLocationSelect = (suggestion: any) => {
    const locationName = suggestion.name;
    setQuery(locationName);
    setIsOpen(false);
    clearSuggestions();
    onChange?.(locationName);

    // Save to recent searches
    saveToRecentSearches(locationName);

    // Notify parent
    onLocationSelect({
      name: suggestion.name,
      state: suggestion.state,
      coordinates: suggestion.coordinates
    });
  };

  // Save to localStorage
  const saveToRecentSearches = (search: string) => {
    try {
      const existing = JSON.parse(localStorage.getItem('location_searches') || '[]');
      const updated = [search, ...existing.filter((s: string) => s !== search)].slice(0, 5);
      localStorage.setItem('location_searches', JSON.stringify(updated));
    } catch (error) {
      console.warn('Error saving search history:', error);
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    onChange?.(search);
    setIsOpen(false);

    onLocationSelect({
      name: search,
      state: '', // Will be determined by actual search
    });
  };

  // Handle clear
  const handleClear = () => {
    setQuery('');
    onChange?.('');
    setIsOpen(false);
    clearSuggestions();
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showRecent = isOpen && query.length === 0 && recentSearches.length > 0;
  const showSuggestions = isOpen && query.length >= 2 && (suggestions.length > 0 || isLoading || error);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
          autoComplete="off"
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-700"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {(showRecent || showSuggestions) && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">

          {/* Recent Searches */}
          {showRecent && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500 font-medium">
                <History className="h-3 w-3" />
                Buscas recentes
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(search)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {search}
                </button>
              ))}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
              <span className="text-sm text-gray-500">Buscando localizações...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50">
              ⚠️ {error}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              {query.length >= 2 && (
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500 font-medium">
                  <Navigation className="h-3 w-3" />
                  Sugestões
                </div>
              )}

              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleLocationSelect(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                    <span className="text-gray-900">{suggestion.name}</span>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      suggestion.type === 'state' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      suggestion.type === 'cep' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {suggestion.type === 'state' ? 'Estado' :
                     suggestion.type === 'cep' ? 'CEP' :
                     'Cidade'}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {!isLoading && !error && query.length >= 2 && suggestions.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              <MapPin className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              Nenhuma localização encontrada para "{query}"
              <div className="text-xs text-gray-400 mt-1">
                Tente buscar por cidade, estado ou CEP
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}