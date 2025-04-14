import L from 'leaflet'

// Type definition for individual marker data points from JSON
export type MapMarkerData = {
  lat: number
  lng: number
  popup: string
  title: string
  img: string // Local path relative to /public, ending in .webp
}

// Interface for aggregated marker data including its category slug
export type AggregatedMarkerData = MapMarkerData & {
  categorySlug: string
}

// Type definition for user-placed temporary markers
export type TemporaryMarkerData = {
  id: string // Unique ID (e.g., using Date.now() or a UUID library)
  lat: number
  lng: number
  name: string // User-defined name
}

// --- Icon Configuration ---

// Default icon properties
const defaultIconSize: L.PointExpression = [32, 32]
const defaultIconAnchor: L.PointExpression = [16, 32] // Anchor point at the bottom center
const defaultPopupAnchor: L.PointExpression = [0, -16] // Try: Popup opens near vertical center

// Interface for icon configuration
interface IconConfig {
  iconUrl: string
  iconSize?: L.PointExpression
  iconAnchor?: L.PointExpression
  popupAnchor?: L.PointExpression
}

// Mapping from category slug (derived from JSON filename) to icon configuration
// Ensure iconUrls point to the correct .webp files in /public
export const iconConfigMapping: Record<string, IconConfig> = {
  'bag-piece': {
    iconUrl: '/BlessMap/Others/NormalChestMarker.webp',
  },
  'ancient-chest': {
    iconUrl: '/BlessMap/Others/AncientChestMarker.webp',
  },
  telepost: {
    iconUrl: '/BlessMap/Others/TelepostMarker.webp',
  },
  pyre: {
    iconUrl: '/BlessMap/Others/PyreMarker.webp',
  },
  'elite-boss': {
    iconUrl: '/BlessMap/Others/EliteBossMarker.webp',
  },
  'unique-boss': {
    iconUrl: '/BlessMap/Others/UniqueBossMarker.webp',
  },
  pages: {
    iconUrl: '/BlessMap/Others/LetterMarker.webp',
  },
  books: {
    iconUrl: '/BlessMap/Others/BookMarker.webp',
  },
  'smuggler-merchant': {
    iconUrl: '/BlessMap/Others/SmugglerMarker.webp',
  },
  'giant-panda': {
    iconUrl: '/BlessMap/Mounts/GiantPandaMarker.webp',
  },
  'moonwind-lioness': {
    iconUrl: '/BlessMap/Mounts/MoonwindLionessMarker.webp',
  },
  razortusk: {
    iconUrl: '/BlessMap/Mounts/RazortuskMarker.webp',
  },
  'goldenwave-ordia': {
    iconUrl: '/BlessMap/Mounts/GoldenwaveOrdiaMarker.webp',
  },
  'ghost-stag': {
    iconUrl: '/BlessMap/Mounts/GhostStagMarker.webp',
  },
  'crimson-pillager': {
    iconUrl: '/BlessMap/Mounts/CrimsonPillagerMarker.webp',
  },
  'golden-stag': {
    iconUrl: '/BlessMap/Mounts/GoldenStagMarker.webp',
  },
  'fire-invasion': {
    iconUrl: '/BlessMap/Invasions/FireEssenceMarker.webp',
  },
  'growth-invasion': {
    iconUrl: '/BlessMap/Invasions/GrowthEssenceMarker.webp',
  },
  'light-invasion': {
    iconUrl: '/BlessMap/Invasions/LightEssenceMarker.webp',
  },
  'darkness-invasion': {
    iconUrl: '/BlessMap/Invasions/DarknessEssenceMarker.webp',
  },
  'chaos-invasion': {
    iconUrl: '/BlessMap/Invasions/ChaosEssenceMarker.webp',
  },
  'ice-invasion': {
    iconUrl: '/BlessMap/Invasions/IceEssenceMarker.webp',
  },
  // Add a fallback configuration
  fallback: {
    iconUrl: '/BlessMap/Others/TelepostMarker.webp', // Using telepost as a fallback
  },
  // Add other categories as needed based on JSON filenames
}

// --- Icon Utility Function ---

/**
 * Creates a Leaflet Icon instance for a given category slug.
 * Uses the mapping and applies default properties.
 */
export function createLeafletIcon(categorySlug: string): L.Icon {
  // Use the specific config or the fallback config
  const config = iconConfigMapping[categorySlug] || iconConfigMapping.fallback
  
  return new L.Icon({
    iconUrl: config.iconUrl,
    iconSize: config.iconSize || defaultIconSize,
    iconAnchor: config.iconAnchor || defaultIconAnchor,
    popupAnchor: config.popupAnchor || defaultPopupAnchor,
  })
}

// --- Data Loading Function ---

/**
 * Loads marker data from all known category JSON files.
 * Runs client-side.
 */
export async function loadAllMarkerData(): Promise<AggregatedMarkerData[]> {
  let allMarkers: AggregatedMarkerData[] = []
  const categorySlugs = Object.keys(iconConfigMapping).filter(slug => slug !== 'fallback'); // Exclude fallback

  console.log(`Loading data for categories: ${categorySlugs.join(', ')}`)

  for (const slug of categorySlugs) {
    try {
      const response = await fetch(`/data/map-markers/${slug}.json`)
      if (!response.ok) {
        console.warn(`Could not fetch marker data for ${slug}: ${response.statusText}`)
        continue // Skip this category if fetch fails
      }
      const markers: MapMarkerData[] = await response.json()
      // Add categorySlug to each marker
      const markersWithCategory = markers.map(marker => ({ ...marker, categorySlug: slug }))
      allMarkers = allMarkers.concat(markersWithCategory)
    } catch (error) {
      console.error(`Error loading or parsing marker data for ${slug}:`, error)
    }
  }
  console.log(`Finished loading data. Total markers: ${allMarkers.length}`)
  return allMarkers
} 