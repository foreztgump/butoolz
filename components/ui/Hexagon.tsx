import React from 'react';
import { cn } from '@/lib/utils'; // Assuming you have this utility

interface HexagonProps extends React.SVGProps<SVGSVGElement> {
  colorClass?: string;
}

const Hexagon: React.FC<HexagonProps> = ({ colorClass = 'fill-gray-500', className, ...props }) => {
  // Correct path for viewBox="0 0 184 160"
  // Points: (92,0), (184,40), (184,120), (92,160), (0,120), (0,40)
  const hexPath = "M92 0 L184 40 L184 120 L92 160 L0 120 L0 40 Z";

  return (
    <svg
      viewBox="0 0 184 160" // Width 184, Height ~160
      xmlns="http://www.w3.org/2000/svg"
      // Ensure className passed overrides default if necessary, but w/h-full is good
      className={cn("w-full h-full block", className)} // Added display: block
      {...props}
    >
      <path
        d={hexPath}
        className={cn(colorClass)} // Apply only fill color class
        vectorEffect="non-scaling-stroke" // Keeps stroke width consistent if scaled (though we removed stroke)
      />
    </svg>
  );
};

export default Hexagon; 