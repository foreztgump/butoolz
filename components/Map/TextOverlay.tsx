'use client'

import React from 'react'
import { Marker } from 'react-leaflet'
import L from 'leaflet'

interface TextOverlayProps {
  position: L.LatLngExpression
  text: string
  className?: string // Pass custom Tailwind classes for styling
  zIndexOffset?: number // Optional z-index control
}

const TextOverlay: React.FC<TextOverlayProps> = ({ 
  position, 
  text, 
  className = '', 
  zIndexOffset = 1000 
}) => {
  
  const textIcon = L.divIcon({
    className: 'leaflet-div-icon-text', // Base class, can be empty if using only Tailwind
    html: `<span class="${className} p-0.5 whitespace-nowrap bg-transparent font-bold drop-shadow-sm">${text}</span>`,
    iconSize: [150, 20], // Adjust size as needed, this is arbitrary for divIcon
    iconAnchor: [75, 10] // Center the text horizontally and vertically
  });

  return (
    <Marker 
      position={position} 
      icon={textIcon} 
      zIndexOffset={zIndexOffset} 
      interactive={false} // Typically text overlays aren't interactive
    />
  );
};

export default TextOverlay; 