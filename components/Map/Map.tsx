'use client' // Necessary for react-leaflet components

import React, { useState, useEffect, useCallback, useRef } from 'react' // Import more hooks
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet' // Import useMap hook and useMapEvents
// import 'leaflet/dist/leaflet.css' // Removed: CSS is imported globally in layout.tsx
import L from 'leaflet' // Import Leaflet type for LatLngExpression and latLngBounds
import MarkerLayer from './MarkerLayer' // Import the new component
// Import Sidebar (will be created next)
import Sidebar from './Sidebar' // Uncommented import
// Import types and functions for search data
import { loadAllMarkerData, type AggregatedMarkerData, type TemporaryMarkerData } from '@/lib/map-data' 
// Import Search Component (will be created next)
import MapSearch from './MapSearch' // Uncommented import
// Import LocationLayers
import LocationLayers from './LocationLayers'
// Import TemporaryMarkerLayer (will be created next)
import TemporaryMarkerLayer from './TemporaryMarkerLayer' // Uncommented import
import { Home, Plus, Minus } from 'lucide-react' // Added Plus/Minus icons
import { Button } from '@/components/ui/button' // Import Button
import CustomMapControls from './CustomMapControls' // Import new component

// Define the structure for categories passed to the Sidebar
interface CategoryInfo {
  slug: string
  name: string
}

// List of categories to display and control - Updated with full list
const controllableCategories: CategoryInfo[] = [
  { slug: 'bag-piece', name: 'Bag Piece' },
  { slug: 'ancient-chest', name: 'Ancient Chest' },
  { slug: 'telepost', name: 'Telepost' },
  { slug: 'pyre', name: 'Pyre' },
  { slug: 'elite-boss', name: 'Elite Boss' },
  { slug: 'unique-boss', name: 'Unique Boss' },
  { slug: 'pages', name: 'Pages' },
  { slug: 'books', name: 'Books' },
  { slug: 'smuggler-merchant', name: 'Smuggler Merchant' },
  { slug: 'giant-panda', name: 'Giant Panda' },
  { slug: 'moonwind-lioness', name: 'Moonwind Lioness' },
  { slug: 'razortusk', name: 'Razortusk' },
  { slug: 'goldenwave-ordia', name: 'Goldenwave Ordia' },
  { slug: 'ghost-stag', name: 'Ghost Stag' },
  { slug: 'crimson-pillager', name: 'Crimson Pillager' },
  { slug: 'golden-stag', name: 'Golden Stag' },
  { slug: 'fire-invasion', name: 'Fire Invasion' },
  { slug: 'growth-invasion', name: 'Growth Invasion' },
  { slug: 'light-invasion', name: 'Light Invasion' },
  { slug: 'darkness-invasion', name: 'Darkness Invasion' },
  { slug: 'chaos-invasion', name: 'Chaos Invasion' },
  { slug: 'ice-invasion', name: 'Ice Invasion' },
]

const LOCAL_STORAGE_KEY = 'blessmap_temp_markers'

// --- Map Component Internal Handlers ---
function MapInteractionHandler({ 
  setMapInstance,
  onMapClick // Add prop for map click
}: {
  setMapInstance: (map: L.Map | null) => void
  onMapClick: (event: L.LeafletMouseEvent) => void // Define type for click event
}) {
  const map = useMap()

  useMapEvents({ // Use hook to listen for map events
    click: (event) => { // Modify the click handler
      // Check if the click originated from within the custom controls
      let targetElement = event.originalEvent.target as HTMLElement;
      let isClickOnCustomControl = false;

      // Traverse up the DOM tree to check for the control container
      while (targetElement && targetElement !== map.getContainer()) {
        // Check if the element or its parent has the specific classes of our control container
        if (targetElement.classList.contains('absolute') && 
            targetElement.classList.contains('bottom-4') && 
            targetElement.classList.contains('right-4')) {
          isClickOnCustomControl = true;
          break; // Found the container, stop traversing
        }
        targetElement = targetElement.parentElement as HTMLElement;
      }

      // Only call onMapClick (addTempMarker) if the click was NOT on the custom controls
      if (!isClickOnCustomControl) {
        // *** DEBUG LOG REMOVED ***
        // console.log('Map click detected outside custom controls, calling onMapClick'); 
        onMapClick(event);
      } else {
        // *** DEBUG LOG REMOVED ***
        // console.log('Map click detected INSIDE custom controls, ignoring.'); 
      }
    },
  })

  useEffect(() => {
    setMapInstance(map)
    return () => {
      setMapInstance(null)
    }
  }, [map, setMapInstance])

  return null
}

// --- Main Map Component ---
const Map = () => {
  const mapCenter: L.LatLngExpression = [0, 0] // Default center, adjust as needed
  const defaultZoom = 3
  const minZoom = 3
  const maxZoom = 6
  const attribution = "Original map by <a href='https://github.com/jerzean/BlessMap' target='_blank' rel='noopener noreferrer'>Nareon</a> &amp; <a href='https://github.com/Boyd-XIX/BlessUnleashedMap' target='_blank' rel='noopener noreferrer'>Boyd-XIX</a>. Enhanced by ForeztGump."
  // Custom tile layer URL pointing to local .webp assets in /public/
  const tileUrl = "/BlessMap/Map/{z}/tile_{x}_{y}.webp"
  // IMPORTANT: Define the actual map boundaries to restrict panning
  // Example: const mapBounds: L.LatLngBoundsExpression = [[-85, -180], [85, 180]]
  const mapBounds: L.LatLngBoundsExpression | undefined = undefined 

  // State for layer visibility
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {}
    controllableCategories.forEach(cat => {
      initialState[cat.slug] = true // Start with all layers visible
    })
    return initialState
  })

  // State for all marker data (for Search)
  const [allMarkerData, setAllMarkerData] = useState<AggregatedMarkerData[]>([])
  const [isLoadingAllData, setIsLoadingAllData] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // State to hold the map instance
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)

  // State for temporary markers
  const [tempMarkers, setTempMarkers] = useState<TemporaryMarkerData[]>([])

  // --- NEW: State for estimated map bounds ---
  const [estimatedBounds, setEstimatedBounds] = useState<L.LatLngBounds | undefined>(undefined);

  // Load temp markers from local storage on mount
  useEffect(() => {
    const savedMarkers = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (savedMarkers) {
      try {
        const parsedMarkers = JSON.parse(savedMarkers)
        if (Array.isArray(parsedMarkers)) { // Basic validation
            setTempMarkers(parsedMarkers)
            // console.log(`Loaded ${parsedMarkers.length} temporary markers from local storage.`)
        }
      } catch (e) {
        console.error("Failed to parse temporary markers from local storage:", e)
        localStorage.removeItem(LOCAL_STORAGE_KEY) // Clear invalid data
      }
    }
  }, [])

  // Save temp markers to local storage whenever they change
  useEffect(() => {
    if (tempMarkers.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tempMarkers))
      // console.log(`Saved ${tempMarkers.length} temporary markers to local storage.`)
    } else {
      // Clear local storage if there are no markers to prevent empty array persistence
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    }
  }, [tempMarkers])

  // Fetch all marker data on mount AND calculate bounds
  useEffect(() => {
    async function fetchAllData() {
      setIsLoadingAllData(true)
      setLoadError(null)
      setEstimatedBounds(undefined); // Reset bounds on reload
      try {
        const data = await loadAllMarkerData()
        setAllMarkerData(data)

        // --- Calculate bounds from data ---
        if (data.length > 0) {
          let minLat = data[0].lat;
          let maxLat = data[0].lat;
          let minLng = data[0].lng;
          let maxLng = data[0].lng;

          data.forEach(marker => {
            if (marker.lat < minLat) minLat = marker.lat;
            if (marker.lat > maxLat) maxLat = marker.lat;
            if (marker.lng < minLng) minLng = marker.lng;
            if (marker.lng > maxLng) maxLng = marker.lng;
          });

          // Create bounds and add a small padding (e.g., 10% of the range)
          const bounds = L.latLngBounds([[minLat, minLng], [maxLat, maxLng]]);
          const paddedBounds = bounds.pad(0.1); // Adjust padding factor as needed
          setEstimatedBounds(paddedBounds);
          // console.log("Estimated map bounds calculated:", paddedBounds);
        } else {
           // console.log("No marker data found to estimate bounds.");
        }
        // --- End bounds calculation ---

      } catch (error) {
        console.error("Failed to load all marker data:", error)
        setLoadError("Failed to load data for search.")
      } finally {
        setIsLoadingAllData(false)
      }
    }
    fetchAllData()
  }, [])

  // Handler to update visibility from Sidebar
  const handleVisibilityChange = (slug: string, isVisible: boolean) => {
    setLayerVisibility(prev => ({ ...prev, [slug]: isVisible }))
  }

  // Handler for when a search result is selected
  const handleSearchResultSelect = useCallback((lat: number, lng: number) => {
    if (mapInstance) {
      // console.log("Search result selected: Flying to", lat, lng)
      // Use flyTo for smooth animation, adjust zoom level (e.g., 5 or 6) as needed
      mapInstance.flyTo([lat, lng], 6) 
    } else {
      console.warn("Map instance not available yet for search result selection.")
    }
  }, [mapInstance]) // Depend on mapInstance

  // --- Temporary Marker Handlers ---
  const addTempMarker = useCallback((event: L.LeafletMouseEvent) => {
    // *** DEBUGGING LOG REMOVED ***
    // console.log('Map clicked - addTempMarker called', event);
    const newMarker: TemporaryMarkerData = {
      id: `temp-${Date.now()}`, // Simple unique ID
      lat: event.latlng.lat,
      lng: event.latlng.lng,
      name: 'Temporary Marker' // Default name
    }
    setTempMarkers(prev => [...prev, newMarker])
  }, [])

  const updateTempMarkerPosition = useCallback((id: string, lat: number, lng: number) => {
    setTempMarkers(prev => 
      prev.map(marker => 
        marker.id === id ? { ...marker, lat, lng } : marker
      )
    )
  }, [])

  const updateTempMarkerName = useCallback((id: string, name: string) => {
    setTempMarkers(prev =>
      prev.map(marker =>
        marker.id === id ? { ...marker, name: name || 'Temporary Marker' } : marker // Ensure name isn't empty
      )
    )
  }, [])

  const clearTempMarkers = useCallback(() => {
    setTempMarkers([])
  }, [])

  // --- NEW: Handler to remove a single temporary marker ---
  const removeTempMarker = useCallback((idToRemove: string) => {
    setTempMarkers(prev => prev.filter(marker => marker.id !== idToRemove))
  }, [])
  // --- End Temporary Marker Handlers ---

  return (
    // Use relative positioning to contain the absolute positioned sidebar and search
    <div className="relative w-full h-full"> 
      <Sidebar 
        categories={controllableCategories} 
        initialVisibility={layerVisibility}
        onVisibilityChange={handleVisibilityChange}
        onClearTempMarkers={clearTempMarkers} // Pass clear handler
      /> 
      
      {/* Search Component (to be added) */}
      <MapSearch 
        allMarkers={allMarkerData} 
        isLoading={isLoadingAllData}
        error={loadError}
        onSelect={handleSearchResultSelect} // Pass the handler
      /> 

      {/* Conditionally render MapContainer only when bounds are ready */}
      {isLoadingAllData && <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 text-lg">Loading Map Data...</div>}
      {loadError && <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 text-destructive text-lg">Error: {loadError}</div>}
      {!isLoadingAllData && !loadError && estimatedBounds && (
        <MapContainer
          center={mapCenter}
          zoom={defaultZoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          scrollWheelZoom={true} 
          zoomControl={false} // Disable default zoom control
          className="w-full h-full z-0 bg-gray-900"
          maxBounds={estimatedBounds} // Use estimated bounds
          maxBoundsViscosity={1.0} 
        >
          {/* Pass map instance setter AND click handler */}
          <MapInteractionHandler 
            setMapInstance={setMapInstance} 
            onMapClick={addTempMarker} 
          />

          <TileLayer
            attribution={attribution}
            url={tileUrl}
            noWrap={true} // Prevent map repeating horizontally
            // errorTileUrl removed as no specific error tile is defined
          />
          
          {/* Conditionally Render Marker Layers based on visibility state */}
          {controllableCategories.map(cat => 
            layerVisibility[cat.slug] && <MarkerLayer key={cat.slug} categorySlug={cat.slug} />
          )}
          
          {/* Render Temporary Markers */}
          <TemporaryMarkerLayer 
            markers={tempMarkers}
            onPositionChange={updateTempMarkerPosition}
            onNameChange={updateTempMarkerName}
            onRemoveMarker={removeTempMarker} // Pass the remove handler
          /> 

          {/* Add Location Text Overlays */}
          <LocationLayers />

          {/* Render the new custom control component */} 
          <CustomMapControls homeCenter={mapCenter} homeZoom={defaultZoom} />

        </MapContainer>
      )}
    </div> // Close the relative container div
  )
}

export default Map 