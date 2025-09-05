'use client'

import { useEffect, useRef, useState } from 'react'
import { MagnifyingGlassIcon, MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface MapLocationSelectorProps {
  onLocationSelect: (location: { lat: number; lng: number; name: string }) => void
  onClose: () => void
  initialLocation?: { lat: number; lng: number }
}

export default function MapLocationSelector({ onLocationSelect, onClose, initialLocation }: MapLocationSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    import('leaflet').then(async (L) => {
      if (!mapRef.current) return

      try {
        // Create map
        const map = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          dragging: true
        }).setView([
          initialLocation?.lat || 28.6139, 
          initialLocation?.lng || 77.2090
        ], 10)
        
        mapInstanceRef.current = map

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(map)

        // Add click handler for map
        map.on('click', (e: any) => {
          const lat = e.latlng.lat
          const lng = e.latlng.lng
          
          // Update marker position
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng])
          } else {
            markerRef.current = L.marker([lat, lng], {
              draggable: true
            }).addTo(map)
            
            markerRef.current.on('dragend', (event: any) => {
              const newPos = event.target.getLatLng()
              reverseGeocode(newPos.lat, newPos.lng)
            })
          }
          
          reverseGeocode(lat, lng)
        })

        setIsLoading(false)
      } catch (error) {
        console.error('Map initialization error:', error)
        setIsLoading(false)
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [initialLocation])

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
      const data = await response.json()
      
      const locationName = data.display_name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      
      setSelectedLocation({
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        name: locationName
      })
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
      setSelectedLocation({
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      })
    }
  }

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`)
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15)
      
      // Update marker
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        import('leaflet').then(L => {
          markerRef.current = L.marker([lat, lng], {
            draggable: true
          }).addTo(mapInstanceRef.current)
          
          markerRef.current.on('dragend', (event: any) => {
            const newPos = event.target.getLatLng()
            reverseGeocode(newPos.lat, newPos.lng)
          })
        })
      }
    }
    
    setSelectedLocation({
      lat,
      lng,
      name: result.display_name
    })
    
    setSearchQuery('')
    setSearchResults([])
  }

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation)
    }
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchLocation(searchQuery)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <MapPinIcon className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Select Location on Map</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location (e.g., Connaught Place, Delhi)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => selectSearchResult(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900 truncate">
                    {result.display_name.split(',')[0]}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {result.display_name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
          <div className="location-selector-map">
            <div ref={mapRef} className="w-full h-full" />
          </div>
          
          {/* Map Instructions */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg text-sm text-gray-700 max-w-xs">
            <div className="font-medium mb-1">📍 How to select location:</div>
            <ul className="text-xs space-y-1">
              <li>• Search for a place above</li>
              <li>• Click anywhere on the map</li>
              <li>• Drag the marker to adjust</li>
            </ul>
          </div>
        </div>

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Selected Location:</h4>
                <p className="text-sm text-gray-600 mt-1 truncate">{selectedLocation.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Coordinates: {selectedLocation.lat}, {selectedLocation.lng}
                </p>
              </div>
              <div className="ml-4 flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Use This Location
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 