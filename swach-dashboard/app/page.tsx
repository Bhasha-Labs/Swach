'use client'

import { useState } from 'react'
import SimpleHotspotMap from '@/components/SimpleHotspotMap'
import AreaLeaderboard from '@/components/AreaLeaderboard'
import PlaceComparison from '@/components/PlaceComparison'
import LiveDetection from '@/components/LiveDetection'
import FloatingDelegationDialog from '@/components/FloatingDelegationDialog'
import { useData } from '@/contexts/DataContext'
import { exportToCSV, generatePDFReport } from '@/utils/exportUtils'
import { 
  DocumentArrowDownIcon, 
  ChartBarIcon, 
  UserGroupIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  PresentationChartBarIcon,
  SparklesIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  BoltIcon
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('detection')
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d'>('24h')
  const [showDelegationDialog, setShowDelegationDialog] = useState(false)
  const { areas, getTotalStats } = useData()
  const stats = getTotalStats()

  // Export functions
  const handleCSVExport = () => {
    if (areas.length === 0) {
      alert('No data available to export')
      return
    }
    exportToCSV(areas, `swach-dashboard-${new Date().toISOString().split('T')[0]}`)
  }

  const handlePDFExport = async () => {
    if (areas.length === 0) {
      alert('No data available to export')
      return
    }
    
    try {
      // Get the map element for capture
      const mapElement = document.querySelector('.leaflet-container') as HTMLElement
      await generatePDFReport(areas, mapElement)
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const EmptyStateCard = ({ title, description }: { title: string; description: string }) => (
    <div className="text-center py-6">
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8-4 4-4-4m0 0L9 7l-2 2" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-swach-500 to-swach-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SWACH Dashboard</h1>
                <p className="text-sm text-gray-600">Smart Waste & Cleanliness Hygiene</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Analytics Dashboard
                {areas.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-swach-100 text-swach-800">
                    {areas.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('detection')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'detection'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Live Detection
              </button>
            </nav>

            {/* Export Buttons - Show only on dashboard tab with data */}
            {activeTab === 'dashboard' && areas.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={handleCSVExport}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                  CSV
                </button>
                <button
                  onClick={handlePDFExport}
                  className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  <ChartBarIcon className="h-4 w-4 mr-1" />
                  PDF Report
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Enhanced Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="interactive-card gradient-bg-primary text-white p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats.totalAreas}</div>
                    <div className="text-blue-100 text-xs">Areas Monitored</div>
                  </div>
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center text-lg">
                    <MapPinIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="interactive-card gradient-bg-success text-white p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats.totalDetections}</div>
                    <div className="text-blue-100 text-xs">Total Detections</div>
                  </div>
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center text-lg">
                    <MagnifyingGlassIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="interactive-card gradient-bg-warning text-white p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats.averageScore}</div>
                    <div className="text-orange-100 text-xs">Average Score</div>
                  </div>
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center text-lg">
                    <PresentationChartBarIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="interactive-card gradient-bg-info text-white p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats.cleanAreas}</div>
                    <div className="text-blue-100 text-xs">Clean Areas</div>
                  </div>
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center text-lg">
                    <SparklesIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid - More Compact */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="xl:col-span-2 space-y-6">
                {/* Hotspot Map */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <MapPinIcon className="h-6 w-6 text-blue-600 mr-2" />
                      <span>Hotspot Map</span>
                    </h2>
                    {areas.length > 0 && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {areas.length} areas
                      </span>
                    )}
                  </div>
                  <SimpleHotspotMap areas={areas} />
                </div>

                {/* Place Comparison */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <ChartBarIcon className="h-6 w-6 text-purple-600 mr-2" />
                    <span>Smart Comparison</span>
                  </h2>
                  {areas.length >= 2 ? (
                    <PlaceComparison areas={areas} />
                  ) : (
                    <EmptyStateCard 
                      title="Need More Data" 
                      description="Add results from 2+ areas to compare performance"
                    />
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Top Performers */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <TrophyIcon className="h-6 w-6 text-yellow-600 mr-2" />
                    <span>Top Performers</span>
                  </h2>
                  {areas.length > 0 ? (
                    <AreaLeaderboard areas={areas} type="best" />
                  ) : (
                    <EmptyStateCard 
                      title="No Rankings Yet" 
                      description="Detection results will showcase top areas"
                    />
                  )}
                </div>

                {/* Red Flag Areas */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
                    <span>Needs Attention</span>
                  </h2>
                  {areas.length > 0 ? (
                    <AreaLeaderboard areas={areas} type="worst" />
                  ) : (
                    <EmptyStateCard 
                      title="All Clear" 
                      description="Problem areas will appear here for quick action"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Call to Action for Empty State */}
            {areas.length === 0 && (
              <div className="mt-8 text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BoltIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Get Started?</h3>
                  <p className="text-gray-600 mb-6">
                    Switch to Live Detection to start analyzing areas and building your cleanliness dashboard.
                  </p>
                  <button
                    onClick={() => setActiveTab('detection')}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                    Start Live Detection
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Detection Tab */}
        {activeTab === 'detection' && (
          <div className="space-y-8">
            <LiveDetection />
          </div>
        )}

        {/* Floating Team Delegation Button */}
        <div className="group fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowDelegationDialog(true)}
            className="w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
          >
            <UserGroupIcon className="h-6 w-6" />
          </button>
          
          {/* Tooltip */}
          <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Team Delegation
            <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>

        {/* Floating Delegation Dialog */}
        <FloatingDelegationDialog 
          isOpen={showDelegationDialog}
          onClose={() => setShowDelegationDialog(false)}
          areas={areas}
        />
      </main>
    </div>
  )
} 