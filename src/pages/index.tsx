import Head from 'next/head'
import { useState } from 'react'

export default function FeatureRequestPage() {
  const [request, setRequest] = useState('')
  const [requests, setRequests] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!request.trim()) return
    setRequests([...requests, request])
    setRequest('')
  }

  return (
    <>
      <Head>
        <title>Feature Requests - Kolly Dashboard</title>
        <meta name="description" content="Submit and view feature requests" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">Feature Requests</h1>
              <nav>
                <ul className="flex space-x-6">
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">
                      Requests
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">
                      Settings
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="mb-6">
              <textarea
                className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Describe your feature request..."
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                rows={4}
              />
              <button
                type="submit"
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
              >
                Submit Request
              </button>
            </form>
            <div>
              {requests.length > 0 ? (
                <ul className="space-y-4">
                  {requests.map((req, index) => (
                    <li key={index} className="border border-gray-200 p-4 rounded-md text-black">
                      {req}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No feature requests yet. Be the first to submit one!</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
