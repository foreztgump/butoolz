'use client' // Add this directive to make it a Client Component

import dynamic from 'next/dynamic'
import { useMemo } from 'react'

const MapWrapper = () => {
  // Dynamically import the Map component to prevent SSR issues
  const Map = useMemo(
    () =>
      dynamic(() => import('./Map'), {
        loading: () => <p className="text-center">Loading map...</p>, // Optional loading indicator
        ssr: false, // Ensure component only renders on the client side
      }),
    []
  )

  // Render the dynamically loaded Map component
  return <Map />
}

export default MapWrapper 