'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

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
  const router = useRouter()
  const [issues, setIssues] = useState<Issue[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [upvotedIssueIds, setUpvotedIssueIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isUpvoting, setIsUpvoting] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      // Get session
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null
      setUser(currentUser)

      // Fetch issues
      const { data: issuesData } = await supabase
        .from('issues')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
      
      if (issuesData) setIssues(issuesData)

      // Fetch user's upvotes if logged in
      if (currentUser) {
        const { data: upvotes } = await supabase
          .from('issue_upvotes')
          .select('issue_id')
          .eq('user_id', currentUser.id)
        
        if (upvotes) {
          setUpvotedIssueIds(new Set(upvotes.map(u => u.issue_id)))
        }
      }
      
      setLoading(false)
    }
    
    fetchData()
  }, [])

  const toggleUpvote = async (issueId: string) => {
    if (!user) {
      router.push('/login')
      return
    }

    if (isUpvoting[issueId]) return

    setIsUpvoting(prev => ({ ...prev, [issueId]: true }))
    const supabase = createClient()
    const hasUpvoted = upvotedIssueIds.has(issueId)

    try {
      if (hasUpvoted) {
        // Remove upvote
        const { error } = await supabase
          .from('issue_upvotes')
          .delete()
          .match({ issue_id: issueId, user_id: user.id })

        if (!error) {
          setUpvotedIssueIds(prev => {
            const next = new Set(prev)
            next.delete(issueId)
            return next
          })
          setIssues(issues.map(i => i.id === issueId ? { ...i, upvotes: i.upvotes - 1 } : i))
        }
      } else {
        // Add upvote
        const { error } = await supabase
          .from('issue_upvotes')
          .insert({ issue_id: issueId, user_id: user.id })

        if (!error) {
          setUpvotedIssueIds(prev => {
            const next = new Set(prev)
            next.add(issueId)
            return next
          })
          setIssues(issues.map(i => i.id === issueId ? { ...i, upvotes: i.upvotes + 1 } : i))
        }
      }
    } finally {
      setIsUpvoting(prev => ({ ...prev, [issueId]: false }))
    }
  }

  const filteredIssues = issues.filter((issue) => {
    if (categoryFilter !== 'All' && issue.category !== categoryFilter) return false
    if (statusFilter !== 'All' && issue.status !== statusFilter) return false
    return true
  })

  const center: [number, number] = issues.length > 0
    ? [
        issues.reduce((sum, issue) => sum + (issue.latitude || 0), 0) / issues.length,
        issues.reduce((sum, issue) => sum + (issue.longitude || 0), 0) / issues.length,
      ]
    : [37.7749, -122.4194]

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
            {filteredIssues.map(issue => {
              const hasUpvoted = upvotedIssueIds.has(issue.id)
              
              return (
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
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleUpvote(issue.id);
                            }}
                            disabled={isUpvoting[issue.id]}
                            className={`flex items-center gap-1 font-medium transition px-2 py-1 rounded-md ${
                              hasUpvoted 
                                ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' 
                                : 'text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-700'
                            }`}
                          >
                            <svg className={`w-4 h-4 ${hasUpvoted ? 'fill-indigo-600' : 'fill-none stroke-current stroke-2'}`} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514" />
                            </svg>
                            {issue.upvotes}
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              )
            })}
          </MapContainer>
        )}
      </div>
    </div>
  )
}
