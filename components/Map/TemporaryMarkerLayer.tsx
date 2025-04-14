'use client'

import React, { useState, useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { TemporaryMarkerData } from '@/lib/map-data'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

// Import default Leaflet CSS for icons (if not already global)
// import 'leaflet/dist/leaflet.css'; // Keep commented if already in layout

// Import the images directly
// import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
// import iconUrl from 'leaflet/dist/images/marker-icon.png';
// import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// --- REMOVED Update Leaflet's default icon paths section ---
// L.Icon.Default.mergeOptions({ ... }); // REMOVED

// -----------------------------------------

interface TemporaryMarkerLayerProps {
  markers: TemporaryMarkerData[]
  onPositionChange: (id: string, lat: number, lng: number) => void
  onNameChange: (id: string, name: string) => void
  onRemoveMarker: (id: string) => void
}

// Component for the popup content, including the name input
const TempMarkerPopupContent: React.FC<{
  marker: TemporaryMarkerData
  onNameChange: (id: string, name: string) => void
  onRemoveMarker: (id: string) => void
}> = ({ marker, onNameChange, onRemoveMarker }) => {
  const [nameInput, setNameInput] = useState(marker.name)

  const handleSaveName = () => {
    onNameChange(marker.id, nameInput)
    // Optionally close popup after save - requires map instance or context
  }

  // Stop click propagation to prevent map click handler firing
  const handlePopupClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="w-48 space-y-2 p-1" onClick={handlePopupClick}>
      <p className="text-sm font-semibold text-center break-words">{marker.name}</p>
      <p className="text-xs text-muted-foreground text-center">
        Lat: {marker.lat.toFixed(5)}, Lng: {marker.lng.toFixed(5)}
      </p>
      <Input
        type="text"
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
        placeholder="Marker name..."
        className=""
      />
      <div className="flex items-center space-x-2">
        <Button 
          onClick={handleSaveName} 
          size="sm" 
          className="flex-grow"
        >
          Save Name
        </Button>
        <Button 
          variant="destructive"
          size="icon"
          onClick={() => onRemoveMarker(marker.id)}
          aria-label="Remove marker"
          data-variant="destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Formatted: <code className="text-xs">{`{lat: ${marker.lat.toFixed(5)}, lng: ${marker.lng.toFixed(5)}}`}</code>
      </p>
    </div>
  )
}

const TemporaryMarkerLayer: React.FC<TemporaryMarkerLayerProps> = ({ 
  markers, 
  onPositionChange, 
  onNameChange, 
  onRemoveMarker
}) => {

  // Use L.DivIcon to create an HTML-based marker (e.g., SVG with Tailwind)
  const divIcon = useMemo(() => new L.DivIcon({
    html: `
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        class="w-10 h-10 text-red-600 drop-shadow-md" 
        stroke="black"
        stroke-width="1"
      >
        <path fill-rule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25c0 3.63 3.43 8.07 5.25 9.9 1.82-1.83 5.25-6.27 5.25-9.9A5.25 5.25 0 0012 1.5zm0 1.5a3.75 3.75 0 00-3.75 3.75c0 2.85 2.92 6.84 3.75 7.87 0.83-1.03 3.75-5.02 3.75-7.87A3.75 3.75 0 0012 3z" clip-rule="evenodd" />
      </svg>
    `, // Use CORRECT Heroicons MapPinIcon SVG - Larger, Red, Stroke, Shadow
    className: '', // No extra classes needed, styling is in HTML
    iconSize: [40, 40], // Size of the icon (increased)
    iconAnchor: [20, 40], // Point of the icon corresponding to marker's location (bottom center)
    popupAnchor:  [0, -40] // Point from which the popup should open relative to the iconAnchor
  }), []);

  const eventHandlers = (marker: TemporaryMarkerData) => ({ 
    dragend(e: L.DragEndEvent) {
      const { lat, lng } = e.target.getLatLng()
      onPositionChange(marker.id, lat, lng)
      // Force popup update if open? Might not be necessary if content relies on props
    },
  })

  if (!markers || markers.length === 0) {
    return null
  }

  return (
    <>
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={divIcon} // Use the DivIcon instance
          draggable={true}
          eventHandlers={eventHandlers(marker)}
          autoPan={true}
        >
          <Popup minWidth={200}>
            <TempMarkerPopupContent marker={marker} onNameChange={onNameChange} onRemoveMarker={onRemoveMarker} />
          </Popup>
        </Marker>
      ))}
    </>
  )
}

export default TemporaryMarkerLayer 