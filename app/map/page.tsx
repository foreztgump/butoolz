import MapWrapper from '@/components/Map/MapWrapper'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Interactive Map - BuTools',
  description: 'Interactive map for Bless Unleashed PC with markers for various points of interest.',
}

export default function MapPage() {
  return (
    <section className="w-full">
      <h1 className="text-2xl font-bold mb-4">Bless Unleashed Interactive Map</h1>
      <div className="h-[calc(100vh-200px)]"> {/* Example height, adjust as needed */} 
        <MapWrapper />
      </div>
    </section>
  )
} 