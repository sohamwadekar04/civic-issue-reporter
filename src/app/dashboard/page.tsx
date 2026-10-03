'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface Issue {
  id: string
  title: string
  category: string
  status: string
  photo_url: string | null
  upvotes: number
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [issues, setIssues] = useState<Issue[]>([])
  const [upvotedIssueIds, setUpvotedIssueIds] = useState<Set<string>>(new Set())
  const [isUpvoting, setIsUpvoting] = useState<Record<string, boolean>>({})
  const [isAdmin, setIsAdmin] = useState(false)
  
  const [stats, setStats] = useState({
    reported: 0,
    inProgress: 0,
    resolved: 0,
  })

  useEffect(() => {
    const supabase = createClient()

    async function fetchDashboardData(userId: string) {
      // Fetch profile role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
        
      if (profile && profile.role === 'admin') {
        setIsAdmin(true)
      }

      // Fetch user's issues
      const { data: userIssues } = await supabase
        .from('issues')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (userIssues) {
        setIssues(userIssues)
        setStats({
          reported: userIssues.length,
          inProgress: userIssues.filter((i) => i.status === 'in_progress').length,
          resolved: userIssues.filter((i) => i.status === 'resolved').length,
        })
        
        // Fetch upvotes to check if user has upvoted their own issues
        const issueIds = userIssues.map(i => i.id)
        if (issueIds.length > 0) {
          const { data: upvotes } = await supabase
            .from('issue_upvotes')
            .select('issue_id')
            .eq('user_id', userId)
            .in('issue_id', issueIds)
            
          if (upvotes) {
            setUpvotedIssueIds(new Set(upvotes.map(u => u.issue_id)))
          }
        }
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
        return
      }
      setUser(session.user)
      fetchDashboardData(session.user.id)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/login')
        return
      }
      setUser(session.user)
      fetchDashboardData(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  const toggleUpvote = async (issueId: string) => {
    if (!user) return
    if (isUpvoting[issueId]) return

    setIsUpvoting(prev => ({ ...prev, [issueId]: true }))
    const supabase = createClient()
    const hasUpvoted = upvotedIssueIds.has(issueId)

    try {
      if (hasUpvoted) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg
          className="h-8 w-8 animate-spin text-indigo-600"
          fill="none"
          viewBox="0 0 24 24"
          aria-label="Loading"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="h-6 w-6 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="text-base font-semibold text-gray-900">
              CivicReport
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
              >
                Admin
              </Link>
            )}
            <Link
              href="/map"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
            >
              Public Map
            </Link>
            <button
              id="logout-btn"
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <Link
            href="/report"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Report New Issue
          </Link>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-lg font-bold select-none">
              {user?.email?.[0].toUpperCase() ?? '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Welcome back!</h2>
              <p className="text-sm text-gray-500 mt-0.5 break-all">
                {user?.email}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            You&apos;re signed in and ready to report civic issues in your
            community. Your submitted reports and their status will appear here.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-10">
          {[
            { label: 'Issues Reported', value: stats.reported, icon: '📋' },
            { label: 'In Progress', value: stats.inProgress, icon: '🔧' },
            { label: 'Resolved', value: stats.resolved, icon: '✅' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 text-center"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* My Reports Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Reports</h2>
          
          {issues.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
                <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900">No issues reported</h3>
              <p className="mt-1 text-sm text-gray-500 mb-6">
                You haven&apos;t reported any civic issues yet. Be the change in your community!
              </p>
              <Link
                href="/report"
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
              >
                Report your first issue
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {issues.map((issue) => {
                const hasUpvoted = upvotedIssueIds.has(issue.id)
                
                return (
                  <div key={issue.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col transition hover:shadow-md">
                    {issue.photo_url ? (
                      <div className="aspect-video w-full bg-gray-100 relative">
                        <Image
                          src={issue.photo_url}
                          alt={issue.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-2" title={issue.title}>
                          {issue.title}
                        </h3>
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(issue.status)}`}>
                          {formatStatus(issue.status)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 capitalize">
                          {issue.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(issue.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-end text-sm text-gray-500">
                        <button 
                          onClick={() => toggleUpvote(issue.id)}
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
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
