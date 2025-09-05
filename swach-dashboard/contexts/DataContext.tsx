'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface DetectionData {
  id: string
  timestamp: Date
  location: string
  swachtaIndex: number
  grade: string
  detections: Array<{
    class: string
    confidence: number
    bbox: number[]
    area: number
  }>
  summary: {
    totalObjects: number
    averageConfidence: number
    totalArea: number
  }
  type: 'image' | 'video' | 'camera'
  metadata?: {
    processedFrames?: number
    videoLength?: number
    imageCount?: number
  }
}

interface AreaData {
  id: string
  name: string
  location: {
    lat: number
    lng: number
  }
  detections: DetectionData[]
  averageSwachtaIndex: number
  grade: string
  lastUpdated: Date
  rank: number
  totalDetections: number
  improvementTrend: 'up' | 'down' | 'stable'
}

interface DataContextType {
  areas: AreaData[]
  currentSession: DetectionData[]
  addDetection: (detection: Omit<DetectionData, 'id' | 'timestamp'>) => void
  saveSessionToArea: (areaName: string, coordinates?: { lat: number; lng: number }) => void
  clearSession: () => void
  getTopAreas: (limit?: number) => AreaData[]
  getWorstAreas: (limit?: number) => AreaData[]
  getTotalStats: () => {
    totalAreas: number
    totalDetections: number
    averageScore: number
    cleanAreas: number
  }
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [areas, setAreas] = useState<AreaData[]>([])
  const [currentSession, setCurrentSession] = useState<DetectionData[]>([])

  const addDetection = useCallback((detection: Omit<DetectionData, 'id' | 'timestamp'>) => {
    const newDetection: DetectionData = {
      ...detection,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }
    setCurrentSession(prev => [...prev, newDetection])
  }, [])

  const calculateGrade = (score: number): string => {
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    if (score >= 50) return 'D'
    return 'F'
  }

  const saveSessionToArea = useCallback((areaName: string, coordinates = { lat: 28.6139, lng: 77.2090 }) => {
    if (currentSession.length === 0) return

    // Calculate average from all detections in the session
    const validDetections = currentSession.filter(d => !isNaN(d.swachtaIndex) && d.swachtaIndex > 0)
    if (validDetections.length === 0) return

    const avgSwachta = Math.round((validDetections.reduce((sum, d) => sum + d.swachtaIndex, 0) / validDetections.length) * 10) / 10
    const grade = calculateGrade(avgSwachta)

    setAreas(prev => {
      const existingIndex = prev.findIndex(area => area.name === areaName)
      
      if (existingIndex >= 0) {
        // Update existing area
        const existing = prev[existingIndex]
        const allDetections = [...existing.detections, ...validDetections]
        const newAvg = Math.round((allDetections.reduce((sum, d) => sum + d.swachtaIndex, 0) / allDetections.length) * 10) / 10
        
        const updatedArea: AreaData = {
          ...existing,
          detections: allDetections,
          averageSwachtaIndex: newAvg,
          grade: calculateGrade(newAvg),
          lastUpdated: new Date(),
          totalDetections: allDetections.length,
          improvementTrend: newAvg > existing.averageSwachtaIndex ? 'up' : 
                           newAvg < existing.averageSwachtaIndex ? 'down' : 'stable'
        }

        const newAreas = [...prev]
        newAreas[existingIndex] = updatedArea
        return rankAreas(newAreas)
      } else {
        // Create new area
        const newArea: AreaData = {
          id: Date.now().toString(),
          name: areaName,
          location: coordinates,
          detections: [...validDetections],
          averageSwachtaIndex: avgSwachta,
          grade,
          lastUpdated: new Date(),
          rank: 0,
          totalDetections: validDetections.length,
          improvementTrend: 'stable'
        }

        return rankAreas([...prev, newArea])
      }
    })

    setCurrentSession([])
  }, [currentSession])

  const rankAreas = (areas: AreaData[]): AreaData[] => {
    return areas
      .sort((a, b) => b.averageSwachtaIndex - a.averageSwachtaIndex)
      .map((area, index) => ({ ...area, rank: index + 1 }))
  }

  const clearSession = useCallback(() => {
    setCurrentSession([])
  }, [])

  const getTopAreas = useCallback((limit = 5) => {
    return areas
      .sort((a, b) => b.averageSwachtaIndex - a.averageSwachtaIndex)
      .slice(0, limit)
  }, [areas])

  const getWorstAreas = useCallback((limit = 5) => {
    return areas
      .sort((a, b) => a.averageSwachtaIndex - b.averageSwachtaIndex)
      .slice(0, limit)
  }, [areas])

  const getTotalStats = useCallback(() => {
    const totalAreas = areas.length
    const totalDetections = areas.reduce((sum, area) => sum + area.totalDetections, 0)
    const averageScore = areas.length > 0 
      ? Math.round((areas.reduce((sum, area) => sum + area.averageSwachtaIndex, 0) / areas.length) * 10) / 10
      : 0
    const cleanAreas = areas.filter(area => area.averageSwachtaIndex >= 80).length

    return { totalAreas, totalDetections, averageScore, cleanAreas }
  }, [areas])

  return (
    <DataContext.Provider value={{
      areas,
      currentSession,
      addDetection,
      saveSessionToArea,
      clearSession,
      getTopAreas,
      getWorstAreas,
      getTotalStats
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
} 