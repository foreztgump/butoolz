'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { type CheckedState } from "@radix-ui/react-checkbox"
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

// Reuse the CategoryInfo type if needed, or define inline props
interface CategoryInfo {
  slug: string
  name: string
}

interface SidebarProps {
  categories: CategoryInfo[]
  initialVisibility: Record<string, boolean>
  onVisibilityChange: (slug: string, isVisible: boolean) => void
  onClearTempMarkers: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ 
  categories, 
  initialVisibility, 
  onVisibilityChange, 
  onClearTempMarkers
}) => {
  const [isOpen, setIsOpen] = useState(false)
  
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsOpen(true)
    }
  }, [])

  const handleCheckboxChange = (slug: string, checked: CheckedState) => {
    if (typeof checked === 'boolean') {
      onVisibilityChange(slug, checked)
    }
  }

  const toggleSidebar = () => setIsOpen(!isOpen)

  return (
    <div 
      className={`absolute top-4 left-4 
                 ${isOpen ? 'z-[1001] p-4 w-64' : 'z-[1000] p-0 w-auto'} 
                 bg-background/80 backdrop-blur-sm 
                 rounded-md shadow-lg flex flex-col 
                 transition-all duration-300 ease-in-out 
                 max-h-[calc(100%-2rem)]`}
    >
      <div className={`flex items-center justify-between ${isOpen ? 'mb-3 border-b pb-2' : 'p-1'}`}>
        {isOpen && (
          <h2 className="text-lg font-semibold">Layers</h2>
        )}
        <Button 
          variant={isOpen ? "ghost" : "outline"}
          size="sm"
          onClick={toggleSidebar}
          className={isOpen ? "-mr-2" : ""}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      
      {isOpen && (
        <>
          <ul className="space-y-2 overflow-y-auto flex-grow mb-4">
            {categories.map((category) => (
              <li key={category.slug} className="flex items-center space-x-2">
                <Checkbox
                  id={`checkbox-${category.slug}`}
                  checked={initialVisibility[category.slug] ?? true}
                  onCheckedChange={(checked: CheckedState) => handleCheckboxChange(category.slug, checked)}
                />
                <label 
                  htmlFor={`checkbox-${category.slug}`} 
                  className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {category.name}
                </label>
              </li>
            ))}
          </ul>
          <Button 
            variant="default"
            size="sm"
            onClick={onClearTempMarkers}
            className="mt-auto w-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Markers
          </Button>
        </>
      )}
    </div>
  )
}

export default Sidebar 