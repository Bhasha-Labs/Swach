'use client'

import { getSwachataGrade, getStatusColor, getTrendIcon } from '@/utils/swachataUtils'

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

interface AreaLeaderboardProps {
  areas: AreaData[]
  type: 'best' | 'worst'
}

export default function AreaLeaderboard({ areas, type }: AreaLeaderboardProps) {
  const sortedAreas = areas
    .sort((a, b) => type === 'best' 
      ? b.averageSwachtaIndex - a.averageSwachtaIndex 
      : a.averageSwachtaIndex - b.averageSwachtaIndex
    )
    .slice(0, 5)

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': case 'A': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'F': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-400'
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  if (sortedAreas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-sm">No areas available</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedAreas.map((area, index) => (
        <div key={area.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center space-x-4">
            {/* Rank Badge */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              index === 0 && type === 'best' ? 'bg-yellow-100 text-yellow-800' :
              index === 1 && type === 'best' ? 'bg-gray-100 text-gray-700' :
              index === 2 && type === 'best' ? 'bg-orange-100 text-orange-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {index + 1}
            </div>

            {/* Area Info */}
            <div>
              <div className="font-medium text-gray-900">{area.name}</div>
              <div className="text-sm text-gray-500">
                {area.totalDetections} detection{area.totalDetections !== 1 ? 's' : ''} • {formatDate(area.lastUpdated)}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Trend Icon */}
            <div className={`${getTrendColor(area.improvementTrend)}`}>
              {area.improvementTrend === 'up' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              )}
              {area.improvementTrend === 'down' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                </svg>
              )}
              {area.improvementTrend === 'stable' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" />
                </svg>
              )}
            </div>

            {/* Score */}
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">{area.averageSwachtaIndex}</div>
              <div className={`text-xs px-2 py-1 rounded-full border ${getGradeColor(area.grade)}`}>
                Grade {area.grade}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 