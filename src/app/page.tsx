import Link from 'next/link'

export default function Home() {
  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-900 flex flex-col">
      {/* Navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="h-7 w-7 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="text-xl font-bold text-gray-900 tracking-tight">CivicReport</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/map"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition px-2"
            >
              Public Map
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition px-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center">
        <div className="relative isolate px-6 lg:px-8">
          <div className="mx-auto max-w-3xl py-24 sm:py-32 lg:py-40 text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative rounded-full px-4 py-1.5 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 shadow-sm bg-white cursor-default">
                CivicReport is now live in your community.{' '}
                <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Join today <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
              Improve your city, <br className="hidden sm:block" />
              <span className="text-indigo-600">one report at a time.</span>
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Spotted a pothole? Broken streetlight? Garbage pile? CivicReport makes it easy to report local issues directly to city officials with photos and exact locations.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/report"
                className="w-full sm:w-auto rounded-xl bg-white border border-gray-300 px-8 py-3.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2 transition"
              >
                Report an Issue
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-gray-200 py-8 bg-white text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} CivicReport. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
