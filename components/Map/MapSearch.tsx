'use client'

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { AggregatedMarkerData } from '@/lib/map-data'
import { Input } from "@/components/ui/input" // Assuming Shadcn Input
// Use standard div for scrolling for now
import { ScrollArea } from "@/components/ui/scroll-area" // Import ScrollArea
import { SearchIcon } from 'lucide-react'

interface MapSearchProps {
  allMarkers: AggregatedMarkerData[]
  isLoading: boolean
  error: string | null
  onSelect: (lat: number, lng: number) => void // Callback when result is clicked
}

const MapSearch: React.FC<MapSearchProps> = ({ 
  allMarkers, 
  isLoading, 
  error, 
  onSelect 
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<AggregatedMarkerData[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search term updates slightly to avoid excessive filtering on fast typing
  const debouncedSearchTerm = useDebounce(searchTerm, 200); 

  // Filter markers based on the debounced search term
  useEffect(() => {
    if (isLoading || error || !debouncedSearchTerm) {
      setSearchResults([]);
      return;
    }

    const lowerCaseSearch = debouncedSearchTerm.toLowerCase();
    const filtered = allMarkers.filter(marker => 
      marker.title?.toLowerCase().includes(lowerCaseSearch) || 
      marker.popup?.toLowerCase().includes(lowerCaseSearch)
    );
    setSearchResults(filtered);

  }, [debouncedSearchTerm, allMarkers, isLoading, error]);

  // Handle clicking outside to close results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  const handleSelectResult = (marker: AggregatedMarkerData) => {
    onSelect(marker.lat, marker.lng)
    setSearchTerm('') // Clear search term after selection
    setSearchResults([]) // Clear results
    setIsFocused(false) // Close dropdown
  }

  const showResults = isFocused && searchTerm.length > 0 && !isLoading && !error;

  return (
    <div 
      ref={searchContainerRef}
      // Responsive positioning: Top-left offset on small, top-right on medium+
      className="absolute top-4 left-16 right-4 z-[1000] 
                 md:left-auto md:right-4 md:w-80 
                 bg-background/80 backdrop-blur-sm rounded-md p-1 shadow-lg"
    >
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search markers by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full pl-9 pr-4 py-2 border"
          disabled={isLoading || !!error}
        />
      </div>

      {isFocused && isLoading && <div className="absolute mt-1 w-[calc(100%-0.5rem)] left-1 rounded-md bg-popover p-2 text-sm text-muted-foreground shadow-md">Loading all marker data...</div>}
      {isFocused && error && <div className="absolute mt-1 w-[calc(100%-0.5rem)] left-1 rounded-md bg-destructive p-2 text-sm text-destructive-foreground shadow-md">{error}</div>}

      {showResults && (
        <div className="absolute mt-1 w-[calc(100%-0.5rem)] left-1 rounded-md bg-popover shadow-md">
          <ScrollArea className="h-60 w-full p-2">
            {searchResults.length > 0 ? (
              <ul>
                {searchResults.map((marker, index) => (
                  <li 
                    key={`${marker.categorySlug}-${index}-${marker.lat}`}
                    onClick={() => handleSelectResult(marker)}
                    className="cursor-pointer p-2 hover:bg-accent rounded text-sm text-gray-800"
                  >
                    {marker.title || 'Untitled Marker'} 
                    <span className="text-xs text-muted-foreground ml-1">({marker.popup.split('<br>')[0]})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-2 text-sm text-muted-foreground text-center">No results found.</p>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}


export default MapSearch 