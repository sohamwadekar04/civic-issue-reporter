'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Custom larger marker for mobile friendliness
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [37, 61], // Original is 25x41, scaled ~1.5x
  iconAnchor: [18, 61], // Base of the icon
  popupAnchor: [1, -45],
  shadowSize: [61, 61],
})

interface LocationPickerProps {
  latitude: number | null
  longitude: number | null
  onChange: (lat: number, lng: number) => void
}

function LocationMarker({ position, onChange }: { position: [number, number] | null, onChange: (lat: number, lng: number) => void }) {
  const map = useMap()
  
  useEffect(() => {
    if (position) {
      // Zoom in closer (level 16) when position changes externally (e.g. search result)
      map.flyTo(position, Math.max(map.getZoom(), 16))
    }
  }, [position, map])

  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })

  const markerRef = useRef<L.Marker>(null)
  
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker != null) {
          const latlng = marker.getLatLng()
          onChange(latlng.lat, latlng.lng)
        }
      },
    }),
    [onChange],
  )

  return position === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={customMarkerIcon}
    />
  )
}

export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const defaultCenter: [number, number] = [20.5937, 78.9629] // Center of India
  const position: [number, number] | null = latitude && longitude ? [latitude, longitude] : null

  useEffect(() => {
    if (!street.trim() && !city.trim() && !state.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const params = new URLSearchParams()
        params.append('format', 'json')
        if (street.trim()) params.append('street', street)
        if (city.trim()) params.append('city', city)
        if (state.trim()) params.append('state', state)
        params.append('countrycodes', 'in') // Bias towards India

        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          headers: {
            'User-Agent': 'CivicIssueReporter/1.0 (contact@example.com)'
          }
        })
        const data = await res.json()
        setResults(data)
      } catch (err) {
        console.error('Search failed', err)
      } finally {
        setSearching(false)
      }
    }, 800) // slightly longer debounce for structured search

    return () => clearTimeout(timer)
  }, [street, city, state])

  return (
    <div className="flex flex-col gap-3">
      <div className="relative bg-gray-50 p-4 rounded-lg border border-gray-200">
        <label className="block text-xs font-medium text-gray-700 mb-2">Search Location (India)</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input 
            type="text" 
            placeholder="Street / Area" 
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition bg-white"
          />
          <input 
            type="text" 
            placeholder="City" 
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition bg-white"
          />
          <input 
            type="text" 
            placeholder="State" 
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition bg-white"
          />
        </div>
        
        {searching && <div className="mt-2 text-xs text-indigo-600 font-medium">Searching...</div>}
        
        {results.length > 0 && (
          <ul className="absolute z-[1000] mt-2 max-h-60 w-[calc(100%-2rem)] overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
            {results.map((r, i) => (
              <li 
                key={i} 
                onClick={() => {
                  onChange(parseFloat(r.lat), parseFloat(r.lon))
                  setStreet('')
                  setCity('')
                  setState('')
                  setResults([])
                }}
                className="cursor-pointer px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition border-b border-gray-50 last:border-0"
              >
                {r.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="h-[350px] w-full rounded-lg border border-gray-300 overflow-hidden relative z-0">
        <MapContainer center={position || defaultCenter} zoom={position ? 16 : 5} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} onChange={onChange} />
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 italic text-center">
        Can't find your exact spot? Just drag the pin — it only takes a second.
      </p>
    </div>
  )
}
