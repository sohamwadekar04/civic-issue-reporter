'use client'

import { useState, FormEvent, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-100 rounded-lg animate-pulse" />
})

const CATEGORIES = ['pothole', 'garbage', 'streetlight', 'water', 'other']

function ReportForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  
  const [user, setUser] = useState<User | null>(null)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [photo, setPhoto] = useState<File | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchingIssue, setFetchingIssue] = useState(!!editId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
        return
      }
      setUser(session.user)
      
      if (editId) {
        // Fetch existing issue
        fetchIssue(session.user.id, editId)
      } else {
        captureLocation()
      }
    })
  }, [router, editId])

  async function fetchIssue(userId: string, issueId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', issueId)
      .eq('user_id', userId)
      .single()
      
    if (data) {
      setTitle(data.title)
      setDescription(data.description || '')
      setCategory(data.category)
      setLatitude(data.latitude)
      setLongitude(data.longitude)
      setExistingPhotoUrl(data.photo_url)
    } else {
      setError('Could not fetch the issue to edit, or you do not have permission.')
    }
    setFetchingIssue(false)
  }

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      return
    }
    
    setIsLocating(true)
    setLocationError(null)
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude)
        setLongitude(position.coords.longitude)
        setIsLocating(false)
      },
      (error) => {
        setIsLocating(false)
        setLocationError('Unable to retrieve your location. Please allow location access or search above.')
      }
    )
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0])
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    
    if (!user) {
      setError('You must be logged in to report an issue.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    
    let photoUrl = existingPhotoUrl

    // 1. Upload Photo (if new provided)
    if (photo) {
      const fileName = `${user.id}-${Date.now()}-${photo.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('issue-photos')
        .upload(fileName, photo)

      if (uploadError) {
        setError('Failed to upload photo: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('issue-photos')
        .getPublicUrl(fileName)
        
      photoUrl = publicUrlData.publicUrl
    }

    // 2. Insert or Update Issue
    if (editId) {
      const { error: updateError } = await supabase
        .from('issues')
        .update({
          title,
          description: description || null,
          category,
          photo_url: photoUrl,
          latitude,
          longitude,
        })
        .eq('id', editId)
        .eq('user_id', user.id) // Security check
        
      if (updateError) {
        setError('Failed to update report: ' + updateError.message)
        setLoading(false)
        return
      }
    } else {
      const { error: insertError } = await supabase.from('issues').insert({
        user_id: user.id,
        title,
        description: description || null,
        category,
        photo_url: photoUrl,
        latitude,
        longitude,
        status: 'reported' // Default status
      })
  
      if (insertError) {
        setError('Failed to submit report: ' + insertError.message)
        setLoading(false)
        return
      }
    }

    // Success! Redirect to dashboard
    router.push('/dashboard')
    router.refresh()
  }

  if (fetchingIssue) {
    return (
      <div className="flex justify-center items-center py-20">
        <svg className="h-8 w-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{editId ? 'Edit Issue' : 'Report New Issue'}</h1>
      
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
          <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g., Large pothole on Main St"
            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition capitalize"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide more details (optional)"
            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition"
          />
        </div>

        {/* Location Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Location <span className="text-red-500">*</span></label>
          </div>
          
          <button
            type="button"
            onClick={captureLocation}
            disabled={isLocating}
            className="w-full flex justify-center items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {isLocating ? 'Capturing GPS Location...' : 'Use My Current Location (Recommended)'}
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-500 uppercase tracking-wide">Or set manually</span>
            </div>
          </div>

          <LocationPicker 
            latitude={latitude}
            longitude={longitude}
            onChange={(lat, lng) => {
              setLatitude(lat)
              setLongitude(lng)
            }}
          />
          {locationError && (
            <p className="mt-2 text-sm text-red-600 font-medium">{locationError}</p>
          )}
        </div>

        {/* Photo Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photo (Optional)</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {existingPhotoUrl || photo ? 'Change Image' : 'Choose Image'}
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handlePhotoChange}
            />
            {photo ? (
              <span className="text-sm text-gray-600 truncate max-w-[200px] sm:max-w-sm">
                {photo.name}
              </span>
            ) : existingPhotoUrl ? (
              <a href={existingPhotoUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline truncate max-w-[200px] sm:max-w-sm">
                View current photo
              </a>
            ) : null}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex justify-center items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loading ? (editId ? 'Updating...' : 'Submitting...') : (editId ? 'Update Report' : 'Submit Report')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function ReportPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
        <Suspense fallback={
          <div className="flex justify-center items-center py-20">
            <svg className="h-8 w-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        }>
          <ReportForm />
        </Suspense>
      </div>
    </main>
  )
}
