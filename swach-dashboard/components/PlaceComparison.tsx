'use client'

import { useState } from 'react'
import { ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'

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

interface PlaceComparisonProps {
  areas: AreaData[]
}

export default function PlaceComparison({ areas }: PlaceComparisonProps) {
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [comparisonView, setComparisonView] = useState<'chart' | 'table' | 'insights'>('chart')

  const toggleArea = (areaId: string) => {
    setSelectedAreas(prev => 
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : prev.length < 4 ? [...prev, areaId] : prev
    )
  }

  const selectedAreaData = areas.filter(area => selectedAreas.includes(area.id))

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': case 'A': return 'bg-emerald-500'
      case 'B': return 'bg-blue-500'
      case 'C': return 'bg-yellow-500'
      case 'D': return 'bg-orange-500'
      case 'F': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getBarWidth = (score: number, maxScore: number) => {
    return Math.max((score / maxScore) * 100, 5)
  }

  const generateInsights = () => {
    if (selectedAreaData.length < 2) return []

    const insights = []
    const sorted = [...selectedAreaData].sort((a, b) => b.averageSwachtaIndex - a.averageSwachtaIndex)
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]
    const scoreDiff = best.averageSwachtaIndex - worst.averageSwachtaIndex

    insights.push({
      type: 'performance',
      title: 'Performance Gap',
      description: `${best.name} outperforms ${worst.name} by ${scoreDiff.toFixed(1)} points`,
      icon: '📊'
    })

    const improvingAreas = selectedAreaData.filter(a => a.improvementTrend === 'up')
    if (improvingAreas.length > 0) {
      insights.push({
        type: 'trend',
        title: 'Improving Areas',
        description: `${improvingAreas.map(a => a.name).join(', ')} ${improvingAreas.length === 1 ? 'is' : 'are'} showing improvement`,
        icon: '📈'
      })
    }

    const totalDetections = selectedAreaData.reduce((sum, a) => sum + a.totalDetections, 0)
    const avgDetections = totalDetections / selectedAreaData.length
    insights.push({
      type: 'activity',
      title: 'Monitoring Activity',
      description: `Average ${avgDetections.toFixed(1)} detections per area (${totalDetections} total)`,
      icon: '🔍'
    })

    return insights
  }

  if (areas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ChartBarIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <div className="text-sm">No areas available for comparison</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Area Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">
            Select areas to compare (up to 4):
          </h4>
          <span className="text-xs text-gray-500">
            {selectedAreas.length}/4 selected
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
          {areas.map((area) => (
            <label
              key={area.id}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border ${
                selectedAreas.includes(area.id)
                  ? 'bg-blue-50 border-blue-200'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedAreas.includes(area.id)}
                onChange={() => toggleArea(area.id)}
                disabled={!selectedAreas.includes(area.id) && selectedAreas.length >= 4}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {area.name}
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    {area.improvementTrend === 'up' && (
                      <ArrowTrendingUpIcon className="h-3 w-3 text-green-600" />
                    )}
                    {area.improvementTrend === 'down' && (
                      <ArrowTrendingDownIcon className="h-3 w-3 text-red-600" />
                    )}
                    <span className="text-sm font-bold text-gray-900">
                      {area.averageSwachtaIndex}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Grade {area.grade} • Rank #{area.rank}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Comparison Content */}
      {selectedAreaData.length > 0 ? (
        <div className="space-y-4">
          {/* View Toggle */}
          <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'chart', label: 'Chart View', icon: '📊' },
              { key: 'table', label: 'Table View', icon: '📋' },
              { key: 'insights', label: 'Insights', icon: '💡' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setComparisonView(key as any)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  comparisonView === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Chart View */}
          {comparisonView === 'chart' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Score Comparison:</h4>
              
              {selectedAreaData.map((area) => {
                const maxScore = Math.max(...selectedAreaData.map(a => a.averageSwachtaIndex))
                return (
                  <div key={area.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium text-gray-900">{area.name}</div>
                        <span className={`text-xs px-2 py-1 rounded-full text-white ${getGradeColor(area.grade)}`}>
                          {area.grade}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        {area.averageSwachtaIndex}
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-4 relative">
                      <div
                        className={`h-4 rounded-full transition-all duration-500 ${getGradeColor(area.grade)}`}
                        style={{ width: `${getBarWidth(area.averageSwachtaIndex, maxScore)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {area.totalDetections} detections
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Table View */}
          {comparisonView === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-900">Area</th>
                    <th className="text-center py-2 font-medium text-gray-900">Score</th>
                    <th className="text-center py-2 font-medium text-gray-900">Grade</th>
                    <th className="text-center py-2 font-medium text-gray-900">Rank</th>
                    <th className="text-center py-2 font-medium text-gray-900">Detections</th>
                    <th className="text-center py-2 font-medium text-gray-900">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAreaData
                    .sort((a, b) => b.averageSwachtaIndex - a.averageSwachtaIndex)
                    .map((area) => (
                    <tr key={area.id} className="border-b border-gray-100">
                      <td className="py-3 font-medium text-gray-900">{area.name}</td>
                      <td className="text-center py-3 font-bold">{area.averageSwachtaIndex}</td>
                      <td className="text-center py-3">
                        <span className={`px-2 py-1 rounded text-xs text-white ${getGradeColor(area.grade)}`}>
                          {area.grade}
                        </span>
                      </td>
                      <td className="text-center py-3">#{area.rank}</td>
                      <td className="text-center py-3">{area.totalDetections}</td>
                      <td className="text-center py-3">
                        {area.improvementTrend === 'up' && <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mx-auto" />}
                        {area.improvementTrend === 'down' && <ArrowTrendingDownIcon className="h-4 w-4 text-red-600 mx-auto" />}
                        {area.improvementTrend === 'stable' && <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Insights View */}
          {comparisonView === 'insights' && selectedAreaData.length >= 2 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Comparison Insights:</h4>
              
              {generateInsights().map((insight, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <div className="text-xl">{insight.icon}</div>
                    <div>
                      <h5 className="font-medium text-blue-900">{insight.title}</h5>
                      <p className="text-blue-700 text-sm mt-1">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-600">
                    {Math.max(...selectedAreaData.map(a => a.averageSwachtaIndex))}
                  </div>
                  <div className="text-xs text-gray-600">Highest Score</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-red-600">
                    {Math.min(...selectedAreaData.map(a => a.averageSwachtaIndex))}
                  </div>
                  <div className="text-xs text-gray-600">Lowest Score</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {(selectedAreaData.reduce((sum, a) => sum + a.averageSwachtaIndex, 0) / selectedAreaData.length).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-600">Average Score</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {selectedAreaData.reduce((sum, a) => sum + a.totalDetections, 0)}
                  </div>
                  <div className="text-xs text-gray-600">Total Detections</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">Select areas above to see comparison</div>
        </div>
      )}
    </div>
  )
} 