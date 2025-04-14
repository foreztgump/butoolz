// components/Map/CustomMapControls.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useMap } from 'react-leaflet'
import { Home, Plus, Minus } from 'lucide-react'
import L from 'leaflet'

interface CustomMapControlsProps {
  homeCenter: L.LatLngExpression
  homeZoom: number
}

const CustomMapControls: React.FC<CustomMapControlsProps> = ({ homeCenter, homeZoom }) => {
  const map = useMap()
  const [currentZoom, setCurrentZoom] = useState(map.getZoom())
  const [isMinZoom, setIsMinZoom] = useState(currentZoom <= map.getMinZoom())
  const [isMaxZoom, setIsMaxZoom] = useState(currentZoom >= map.getMaxZoom())

  useEffect(() => {
    const handleZoomEnd = () => {
      const newZoom = map.getZoom()
      setCurrentZoom(newZoom)
      setIsMinZoom(newZoom <= map.getMinZoom())
      setIsMaxZoom(newZoom >= map.getMaxZoom())
    }

    map.on('zoomend', handleZoomEnd)
    handleZoomEnd();

    return () => {
      map.off('zoomend', handleZoomEnd)
    }
  }, [map])

  const resetView = useCallback(() => {
    map.flyTo(homeCenter, homeZoom)
  }, [map, homeCenter, homeZoom])

  const zoomIn = useCallback(() => {
    map.zoomIn()
  }, [map])

  const zoomOut = useCallback(() => {
    map.zoomOut()
  }, [map])

  const baseButtonClasses = "inline-flex items-center justify-center w-[30px] h-[30px] border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative focus:z-[1] hover:z-[1] transition-colors";

  return (
    <div 
      className="absolute bottom-4 right-4 z-[1000] flex flex-col rounded-md shadow-md overflow-hidden"
    >
      <button
        type="button"
        onClick={resetView}
        className={`${baseButtonClasses} rounded-b-none border-b-0`}
        aria-label="Reset map view"
        title="Reset map view"
      >
        <Home className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={zoomIn}
        disabled={isMaxZoom}
        className={`${baseButtonClasses} rounded-none border-b-0 border-t-0`}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <Plus className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={zoomOut}
        disabled={isMinZoom}
        className={`${baseButtonClasses} rounded-t-none border-t-0`}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <Minus className="h-5 w-5" />
      </button>
    </div>
  )
}

export default CustomMapControls