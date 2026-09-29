'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import Image from 'next/image'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createClient } from '@/lib/supabase/client'

// Fix missing marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Issue {
  id: string
  title: string
  category: string
  status: string
  photo_url: string | null
  latitude: number | null
  longitude: number | null
  upvotes: number
  created_at: string
}

const CATEGORIES = ['All', 'pothole', 'garbage', 'streetlight', 'water', 'other']
const STATUSES = ['All', 'reported', 'in_progress', 'resolved']

export default function IssuesMap() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    async function fetchIssues() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
      
      if (data) setIssues(data)
      setLoading(false)
    }
    fetchIssues()
  }, [])

  const filteredIssues = issues.filter((issue) => {
    if (categoryFilter !== 'All' && issue.category !== categoryFilter) return false
    if (statusFilter !== 'All' && issue.status !== statusFilter) return false
    return true
  })

  // Calculate center based on all issues
  const center: [number, number] = issues.length > 0
    ? [
        issues.reduce((sum, issue) => sum + (issue.latitude || 0), 0) / issues.length,
        issues.reduce((sum, issue) => sum + (issue.longitude || 0), 0) / issues.length,
      ]
    : [37.7749, -122.4194] // Default SF if empty

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Filters */}
      <div className="bg-white border-b border-gray-200 p-4 shrink-0 flex flex-col sm:flex-row gap-4 items-center justify-center z-10 relative shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-300 py-1.5 pl-3 pr-8 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 capitalize"
          >
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 py-1.5 pl-3 pr-8 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 capitalize"
          >
            {STATUSES.map(stat => <option key={stat} value={stat}>{stat.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div className="text-sm text-gray-500 sm:ml-auto">
          Showing {filteredIssues.length} issues
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative z-0">
        {!loading && (
          <MapContainer center={center} zoom={12} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredIssues.map(issue => (
              issue.latitude && issue.longitude && (
                <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
                  <Popup className="civic-popup" minWidth={200}>
                    <div className="flex flex-col gap-2 min-w-[200px] pb-1">
                      {issue.photo_url && (
                        <div className="relative h-28 w-full rounded-md overflow-hidden bg-gray-100">
                          <Image src={issue.photo_url} alt={issue.title} fill className="object-cover" sizes="200px" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm leading-tight m-0 mb-1.5">{issue.title}</h3>
                        <div className="flex gap-1.5 flex-wrap">
                          <span className="inline-flex items-center rounded-md bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 capitalize">
                            {issue.category}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getStatusColor(issue.status)}`}>
                            {formatStatus(issue.status)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500 mt-1 border-t border-gray-100 pt-1.5">
                        <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1 text-gray-600 font-medium">
                          👍 {issue.upvotes}
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  )
}
