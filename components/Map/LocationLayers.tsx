'use client'

import React, { useState, useEffect } from 'react'
import { useMapEvents } from 'react-leaflet'
import TextOverlay from './TextOverlay'

// Define the structure of the location data from JSON
interface CityData {
  lat: number
  lng: number
  text: string
}

interface LocationData {
  country: string
  lat: number
  lng: number
  cities: CityData[]
}

const TOGGLE_ZOOM_LEVEL = 5 // Zoom level to switch between country and city names

const LocationLayers: React.FC = () => {
  const [locations, setLocations] = useState<LocationData[]>([])
  const [currentZoom, setCurrentZoom] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get map instance and initialize zoom level
  const map = useMapEvents({
    zoomend: () => {
      setCurrentZoom(map.getZoom())
      console.log("Zoom ended, current zoom:", map.getZoom())
    },
    load: () => {
      setCurrentZoom(map.getZoom()) // Set initial zoom on load
    }
  })

  // Fetch location data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/data/map-locations.json')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: LocationData[] = await response.json()
        setLocations(data)
        console.log("Location data loaded successfully")
      } catch (e) {
        console.error('Failed to fetch location data:', e)
        setError('Failed to load location names.')
        setLocations([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading || error || currentZoom === null) {
    // Don't render anything until data is loaded and zoom is known
    return null
  }

  // Determine which layer to show based on zoom
  const showCities = currentZoom >= TOGGLE_ZOOM_LEVEL

  return (
    <>
      {locations.map((location) => {
        if (showCities) {
          // Render city names
          return location.cities.map((city, index) => (
            <TextOverlay 
              key={`city-${location.country}-${index}`}
              position={[city.lat, city.lng]}
              text={city.text}
              className="text-gray-400 text-lg" // Apply city-specific styling
            />
          ))
        } else {
          // Render country name
          return (
            <TextOverlay 
              key={`country-${location.country}`}
              position={[location.lat, location.lng]}
              text={location.country}
              className="text-yellow-300 text-lg" // Apply country-specific styling
            />
          )
        }
      })}
    </>
  )
}

export default LocationLayers 