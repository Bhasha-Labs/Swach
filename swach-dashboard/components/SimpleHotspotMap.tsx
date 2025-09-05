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

interface SimpleHotspotMapProps {
  areas: AreaData[]
}

export default function SimpleHotspotMap({ areas }: SimpleHotspotMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const mapInstanceRef = useRef<any>(null)

  // Clean approach - recreate map when areas change
  useEffect(() => {
    if (typeof window === 'undefined') return

    let mounted = true
    setIsLoading(true)
    setMapError(null)

    const initializeMap = async () => {
      try {
        // Always clean up first
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        // Small delay to ensure cleanup
        await new Promise(resolve => setTimeout(resolve, 100))

        if (!mounted || !mapRef.current) return

        const L = await import('leaflet')

        // Create fresh map instance
        const map = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: false,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: true,
          touchZoom: true
        })

        mapInstanceRef.current = map

        // Add tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '© OpenStreetMap'
        }).addTo(map)

        // Set initial view
        if (areas.length > 0) {
          const firstArea = areas[0]
          map.setView([firstArea.location.lat, firstArea.location.lng], 11)

          // Add markers for each area
          areas.forEach((area) => {
            const markerColor = area.averageSwachtaIndex >= 80 ? '#22c55e' :
                              area.averageSwachtaIndex >= 60 ? '#3b82f6' :
                              area.averageSwachtaIndex >= 40 ? '#f59e0b' : '#ef4444'

            // Create circle marker
            const marker = L.circleMarker([area.location.lat, area.location.lng], {
              radius: Math.max(8, Math.min(20, (100 - area.averageSwachtaIndex) / 4)),
              fillColor: markerColor,
              color: '#ffffff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }).addTo(map)

            // Add popup
            marker.bindPopup(`
              <div style="font-family: system-ui; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${area.name}</h3>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: #6b7280;">Score:</span>
                  <span style="font-weight: 600; color: ${markerColor};">${area.averageSwachtaIndex}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: #6b7280;">Grade:</span>
                  <span style="font-weight: 600;">${area.grade}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #6b7280;">Detections:</span>
                  <span style="font-weight: 600;">${area.totalDetections}</span>
                </div>
              </div>
            `)
          })

          // Fit to show all markers if multiple areas
          if (areas.length > 1) {
            const group = L.featureGroup(
              areas.map(area => 
                L.circleMarker([area.location.lat, area.location.lng])
              )
            )
            map.fitBounds(group.getBounds().pad(0.1))
          }
        } else {
          // Default view (Delhi)
          map.setView([28.6139, 77.2090], 10)
        }

        if (mounted) {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Map initialization error:', error)
        if (mounted) {
          setMapError('Failed to load map')
          setIsLoading(false)
        }
      }
    }

    initializeMap()

    return () => {
      mounted = false
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        } catch (error) {
          console.error('Map cleanup error:', error)
        }
      }
    }
  }, [areas]) // Recreate when areas change

  if (mapError) {
    return (
      <div className="h-64 bg-red-50 rounded-lg flex items-center justify-center border border-red-200">
        <div className="text-center text-red-600">
          <div className="text-sm font-medium">{mapError}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs rounded"
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