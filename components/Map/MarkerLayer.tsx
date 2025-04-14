'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import type { MapMarkerData } from '@/lib/map-data'
import { createLeafletIcon } from '@/lib/map-data'
import L from 'leaflet'
import MarkerPopup from './MarkerPopup'
import type { LeafletEventHandlerFnMap } from 'leaflet' // Import type for event handlers

interface MarkerLayerProps {
  categorySlug: string
}

const MarkerLayer: React.FC<MarkerLayerProps> = ({ categorySlug }) => {
  const [markers, setMarkers] = useState<MapMarkerData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create the icon instance only once per categorySlug
  const icon = useMemo(() => createLeafletIcon(categorySlug), [categorySlug])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/data/map-markers/${categorySlug}.json`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: MapMarkerData[] = await response.json()
        setMarkers(data)
      } catch (e) {
        console.error(`Failed to fetch markers for ${categorySlug}:`, e)
        setError(`Failed to load markers for ${categorySlug}.`)
        setMarkers([]) // Clear markers on error
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [categorySlug]) // Re-fetch if categorySlug changes

  // Render nothing while loading or if there's an error (or provide feedback)
  if (loading) {
    // Optional: return a loading indicator placeholder if needed
    // console.log(`Loading markers for ${categorySlug}...`)
    return null 
  }

  if (error) {
    // Optional: render an error message or indicator
    // console.error(error)
    return null
  }
  
  // Optimization: Return null if no markers to render
  if (!markers || markers.length === 0) {
    return null;
  }

  // console.log(`Rendering ${markers.length} markers for ${categorySlug}`)

  return (
    <>
      {markers.map((marker, index) => {
        // Define event handlers for each marker
        const eventHandlers: LeafletEventHandlerFnMap = {
          popupopen: (e) => {
            const popup = e.popup;
            // Need a slight delay for the content to render in the DOM
            setTimeout(() => {
              const img = popup.getElement()?.querySelector('img');
              if (img && !img.complete) { // Check if image exists and isn't already loaded
                const handleLoad = () => {
                  popup.update();
                  // Clean up the listener after it runs once
                  img.removeEventListener('load', handleLoad);
                  // console.log('Popup updated after image load');
                };
                img.addEventListener('load', handleLoad);
              }
            }, 0); // Minimal delay
          },
          // Optional: Add popupclose handler for more robust cleanup if needed
        };

        return (
          <Marker
            key={`${categorySlug}-${index}-${marker.lat}-${marker.lng}`}
            position={[marker.lat, marker.lng]}
            icon={icon}
            title={marker.title} // Used for browser tooltip on hover
            eventHandlers={eventHandlers} // Add event handlers
          >
            <Popup>
              <MarkerPopup 
                title={marker.title}
                popup={marker.popup}
                img={marker.img}
              />
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

export default React.memo(MarkerLayer) // Memoize for performance 