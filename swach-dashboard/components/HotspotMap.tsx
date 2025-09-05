'use client'

import { useEffect, useRef, useState } from 'react'
import { getSwachataGrade } from '@/utils/swachataUtils'

interface AreaData {
  id: string
  name: string
  location: {
    lat: number
    lng: number
  }
  detections: any[]
  averageSwachtaIndex: number
  grade: string
  lastUpdated: Date
  rank: number
  totalDetections: number
  improvementTrend: 'up' | 'down' | 'stable'
}

interface HotspotMapProps {
  areas: AreaData[]
}

export default function HotspotMap({ areas }: HotspotMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsLoading(true)
    setMapError(null)

    // Dynamic import of Leaflet with proper error handling
    import('leaflet')
      .then(async (L) => {
        if (!mapRef.current) return

        try {
          // Clean up existing map
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove()
            mapInstanceRef.current = null
          }

          // Wait a bit to ensure cleanup is complete
          await new Promise(resolve => setTimeout(resolve, 100))

          // Create map with error handling
          const map = L.map(mapRef.current, {
            zoomControl: true,
            attributionControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: true,
            keyboard: true,
            dragging: true,
            tap: true,
            touchZoom: true
          }).setView([28.6139, 77.2090], 10)
          
          mapInstanceRef.current = map

          // Add tile layer with error handling
          const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
            subdomains: ['a', 'b', 'c']
          })

          tileLayer.on('tileerror', () => {
            console.warn('Map tiles failed to load, trying alternative source')
          })

          tileLayer.addTo(map)

          // Calculate bounds for all areas
          if (areas.length > 0) {
            const bounds = L.latLngBounds(areas.map(area => [area.location.lat, area.location.lng]))

            // Add markers for each area
            areas.forEach((area) => {
              // Determine marker color based on Swachta Index
              let markerColor = '#22c55e' // green
              if (area.averageSwachtaIndex < 40) markerColor = '#ef4444' // red
              else if (area.averageSwachtaIndex < 60) markerColor = '#f59e0b' // yellow
              else if (area.averageSwachtaIndex < 80) markerColor = '#3b82f6' // blue

              // Create custom marker
              const marker = L.circleMarker([area.location.lat, area.location.lng], {
                radius: Math.max(6, Math.min(15, (100 - area.averageSwachtaIndex) / 4)),
                fillColor: markerColor,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
              }).addTo(map)

              // Add popup with better formatting
              marker.bindPopup(`
                <div style="min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
                  <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${area.name}</h3>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: #6b7280; font-size: 14px;">Swachta Index:</span>
                    <span style="font-weight: 600; color: ${markerColor}; font-size: 14px;">${area.averageSwachtaIndex}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: #6b7280; font-size: 14px;">Grade:</span>
                    <span style="font-weight: 600; font-size: 14px;">${area.grade}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280; font-size: 14px;">Detections:</span>
                    <span style="font-weight: 600; font-size: 14px;">${area.totalDetections}</span>
                  </div>
                  <div style="color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 4px;">
                    Updated: ${area.lastUpdated.toLocaleDateString()}
                  </div>
                </div>
              `, {
                closeButton: true,
                autoClose: false,
                closeOnClick: false
              })
            })

            // Fit map to show all markers
            if (areas.length > 1) {
              map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 })
            } else {
              map.setView([areas[0].location.lat, areas[0].location.lng], 13)
            }
          }

          // Add legend
          const legend = L.control({ position: 'bottomright' })
          legend.onAdd = function() {
            const div = L.DomUtil.create('div', 'info legend')
            div.style.backgroundColor = 'rgba(255, 255, 255, 0.95)'
            div.style.padding = '12px'
            div.style.borderRadius = '8px'
            div.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)'
            div.style.border = '1px solid #e5e7eb'
            div.style.fontFamily = 'system-ui, -apple-system, sans-serif'
            div.style.fontSize = '12px'
            div.style.lineHeight = '1.4'
            
            const grades = [
              { range: '80+', color: '#22c55e', label: 'Excellent' },
              { range: '60-79', color: '#3b82f6', label: 'Good' },
              { range: '40-59', color: '#f59e0b', label: 'Fair' },
              { range: '<40', color: '#ef4444', label: 'Poor' }
            ]
            
            div.innerHTML = '<div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">Cleanliness Index</div>'
            
            grades.forEach(grade => {
              div.innerHTML += 
                `<div style="display: flex; align-items: center; margin-bottom: 4px;">
                  <div style="width: 12px; height: 12px; background-color: ${grade.color}; border-radius: 50%; margin-right: 8px; border: 1px solid rgba(255,255,255,0.8);"></div>
                  <span style="color: #374151;">${grade.range} - ${grade.label}</span>
                </div>`
            })
            
            return div
          }
          legend.addTo(map)

          setIsLoading(false)
        } catch (error) {
          console.error('Map initialization error:', error)
          setMapError('Failed to load map. Please refresh the page.')
          setIsLoading(false)
        }
      })
      .catch(error => {
        console.error('Leaflet import error:', error)
        setMapError('Failed to load map library. Please check your connection.')
        setIsLoading(false)
      })

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        } catch (error) {
          console.error('Map cleanup error:', error)
        }
      }
    }
  }, [areas])

  if (mapError) {
    return (
      <div className="h-64 bg-red-50 rounded-lg flex items-center justify-center border border-red-200">
        <div className="text-center text-red-600">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium">{mapError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (areas.length === 0) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m-6 3l6-3" />
          </svg>
          <p className="text-sm">No areas to display</p>
          <p className="text-xs text-gray-400">Add detection results to see hotspot map</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      <div className="map-container">
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  )
} 