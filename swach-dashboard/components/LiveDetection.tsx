'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { 
  CameraIcon, 
  PhotoIcon, 
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  VideoCameraIcon,
  FolderIcon,
  Cog6ToothIcon,
  PlayIcon,
  PauseIcon,
  SparklesIcon,
  MapPinIcon,
  ClockIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import { getSwachataGrade } from '@/utils/swachataUtils'
import { useData } from '@/contexts/DataContext'
import MapLocationSelector from './MapLocationSelector'

interface DetectionResult {
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
  success: boolean
}

interface VideoAnalysisResult {
  success: boolean
  avgSwachta: number
  maxSwachta: number
  minSwachta: number
  processedFrames: number
  frameDetections?: any[]
  classCounts?: Record<string, number>
  outputVideoPath?: string
}

interface BulkResult {
  success: boolean
  totalImages: number
  overallSwachtaIndex: number
  grade: string
  classCounts: Record<string, number>
  cleanImages: number
  dirtyImages: number
  results: Array<{
    filename: string
    swachtaIndex: number
    grade: string
    detections: number
  }>
}

export default function LiveDetection() {
  // Core states
  const [activeMethod, setActiveMethod] = useState<'camera' | 'upload' | 'video' | 'bulk'>('camera')
  const [isDetecting, setIsDetecting] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [videoResult, setVideoResult] = useState<VideoAnalysisResult | null>(null)
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Session management
  const [currentLocation, setCurrentLocation] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [locationCoords, setLocationCoords] = useState({ lat: '', lng: '' })
  const [useCustomCoords, setUseCustomCoords] = useState(false)
  const [showMapSelector, setShowMapSelector] = useState(false)
  
  // Camera states
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  
  // Progress states
  const [videoProgress, setVideoProgress] = useState(0)
  const [videoProcessingStatus, setVideoProcessingStatus] = useState('')
  
  // Configuration states
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.25)
  const [filterLowConfidenceGarbage, setFilterLowConfidenceGarbage] = useState(true)
  const [minObjectSize, setMinObjectSize] = useState(1.0)
  const [videoSpeedOption, setVideoSpeedOption] = useState('balanced')
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Data context
  const { addDetection, saveSessionToArea, currentSession, clearSession } = useData()

  // Utility functions
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': case 'A': return 'border-emerald-400 bg-emerald-50 text-emerald-900'
      case 'B': return 'border-blue-400 bg-blue-50 text-blue-900'
      case 'C': return 'border-yellow-400 bg-yellow-50 text-yellow-900'
      case 'D': return 'border-orange-400 bg-orange-50 text-orange-900'
      case 'F': return 'border-red-400 bg-red-50 text-red-900'
      default: return 'border-gray-400 bg-gray-50 text-gray-900'
    }
  }

  const getScoreColorClass = (score: number) => {
    if (score >= 90) return 'text-emerald-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  // Add detection to session buffer
  const addToSession = useCallback((detectionData: any, type: 'image' | 'video' | 'camera') => {
    addDetection({
      location: currentLocation || 'Unknown Location',
      swachtaIndex: detectionData.swachtaIndex,
      grade: detectionData.grade,
      detections: detectionData.detections || [],
      summary: detectionData.summary || { totalObjects: 0, averageConfidence: 0, totalArea: 0 },
      type,
      metadata: type === 'video' ? {
        processedFrames: detectionData.processedFrames,
        videoLength: detectionData.videoLength
      } : undefined
    })
  }, [addDetection, currentLocation])

  // Save session to area
  const handleSaveSession = () => {
    if (!currentLocation.trim()) return
    
    let coordinates = { lat: 28.6139, lng: 77.2090 } // Default Delhi coordinates
    
    if (useCustomCoords && locationCoords.lat && locationCoords.lng) {
      const lat = parseFloat(locationCoords.lat)
      const lng = parseFloat(locationCoords.lng)
      
      // Validate coordinates
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        coordinates = { lat, lng }
      }
    }
    
    saveSessionToArea(currentLocation, coordinates)
    setShowSaveDialog(false)
    setCurrentLocation('')
    setLocationCoords({ lat: '', lng: '' })
    setUseCustomCoords(false)
    setResult(null)
    setVideoResult(null)
    setBulkResult(null)
  }

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      })
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.')
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setCapturedImage(null)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const dataURL = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImage(dataURL)
      stopCamera()
    }
  }

  // Detection handlers
  const handleImageUpload = async (file: File) => {
    if (!file) return

    setIsDetecting(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('confidence', confidenceThreshold.toString())
      formData.append('filterLowConfidence', filterLowConfidenceGarbage.toString())
      formData.append('minObjectSize', minObjectSize.toString())

      const response = await fetch('/api/detect-garbage', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
        // Ensure proper data structure for session
        const sessionData = {
          swachtaIndex: data.swachtaIndex || 0,
          grade: data.grade || 'F',
          detections: data.detections || [],
          summary: data.summary || { totalObjects: 0, averageConfidence: 0, totalArea: 0 }
        }
        addToSession(sessionData, activeMethod === 'camera' ? 'camera' : 'image')
      } else {
        setError(data.error || 'Detection failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Image detection error:', err)
    } finally {
      setIsDetecting(false)
    }
  }

  const handleVideoUpload = async (file: File) => {
    if (!file) return

    setIsDetecting(true)
    setError(null)
    setVideoResult(null)
    setVideoProgress(0)
    setVideoProcessingStatus('Uploading video...')

    try {
      const formData = new FormData()
      formData.append('video', file)
      formData.append('confidence', confidenceThreshold.toString())
      formData.append('filterLowConfidence', filterLowConfidenceGarbage.toString())
      formData.append('minObjectSize', minObjectSize.toString())
      formData.append('speedOption', videoSpeedOption)

      // Create XMLHttpRequest for upload progress
      const xhr = new XMLHttpRequest()
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const uploadProgress = Math.round((event.loaded / event.total) * 30) // 30% for upload
          setVideoProgress(uploadProgress)
          setVideoProcessingStatus('Uploading video...')
        }
      })

      // Handle the response
      const responsePromise = new Promise<any>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve(data)
            } catch (e) {
              reject(new Error('Invalid response format'))
            }
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'))
        })
      })

      // Start processing progress simulation after upload
      xhr.upload.addEventListener('load', () => {
        setVideoProgress(30)
        setVideoProcessingStatus('Processing video frames...')
        
        // Simulate processing progress more realistically
        const processingInterval = setInterval(() => {
          setVideoProgress(prev => {
            if (prev >= 95) {
              clearInterval(processingInterval)
              return prev
            }
            // Slower progress as it gets closer to completion
            const increment = prev < 60 ? 8 : prev < 80 ? 4 : 2
            return Math.min(prev + increment, 95)
          })
        }, 1500) // Update every 1.5 seconds for more realistic timing
      })

      // Send the request
      xhr.open('POST', '/api/detect-video')
      xhr.send(formData)

      const data = await responsePromise
      
      setVideoProgress(100)
      setVideoProcessingStatus('Analysis complete!')

      if (data.success) {
        setVideoResult(data)
        // Ensure proper data structure for session
        const sessionData = {
          swachtaIndex: data.avgSwachta || 0,
          grade: getSwachataGrade(data.avgSwachta || 0).label,
          detections: data.frameDetections || [],
          summary: {
            totalObjects: data.frameDetections?.length || 0,
            averageConfidence: 85, // Default since video doesn't provide per-frame confidence
            totalArea: 0
          },
          processedFrames: data.processedFrames,
          videoLength: data.videoLength
        }
        addToSession(sessionData, 'video')
      } else {
        setError(data.error || 'Video analysis failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Video analysis error:', err)
    } finally {
      setIsDetecting(false)
      setTimeout(() => {
        setVideoProgress(0)
        setVideoProcessingStatus('')
      }, 2000)
    }
  }

  const handleBulkProcessing = async () => {
    setIsDetecting(true)
    setError(null)
    setBulkResult(null)

    try {
      const response = await fetch('/api/bulk-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confidence: confidenceThreshold,
          filterLowConfidence: filterLowConfidenceGarbage,
          minObjectSize
        })
      })

      const data = await response.json()

      if (data.success) {
        setBulkResult(data)
        // Ensure proper data structure for session
        const sessionData = {
          swachtaIndex: data.overallSwachtaIndex || 0,
          grade: data.grade || 'F',
          detections: [],
          summary: {
            totalObjects: data.totalImages || 0,
            averageConfidence: 80, // Default for bulk processing
            totalArea: 0
          },
          totalImages: data.totalImages,
          cleanImages: data.cleanImages,
          dirtyImages: data.dirtyImages
        }
        addToSession(sessionData, 'image')
      } else {
        setError(data.error || 'Bulk processing failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Bulk processing error:', err)
    } finally {
      setIsDetecting(false)
    }
  }

  const resetAll = () => {
    setResult(null)
    setVideoResult(null)
    setBulkResult(null)
    setError(null)
    setCapturedImage(null)
    setVideoProgress(0)
    setVideoProcessingStatus('')
    stopCamera()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Current result for display
  const currentResult = result || videoResult || bulkResult

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationCoords({
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6)
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          setError('Unable to get current location. Please enter coordinates manually.')
        }
      )
    } else {
      setError('Geolocation is not supported by this browser.')
    }
  }

  // Handle map location selection
  const handleMapLocationSelect = (location: { lat: number; lng: number; name: string }) => {
    setCurrentLocation(location.name.split(',')[0] || 'Selected Location')
    setLocationCoords({
      lat: location.lat.toString(),
      lng: location.lng.toString()
    })
    setUseCustomCoords(true)
    setShowMapSelector(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* HERO RESULTS SECTION - PROMINENT TOP PLACEMENT */}
      {currentResult && (
        <div className="relative">
          {/* Background blur effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10 backdrop-blur-sm"></div>
          
          <div className="relative z-10 p-8">
            <div className="max-w-6xl mx-auto">
              {/* Result Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-white/20 mb-4">
                  <SparklesIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Latest Analysis Result</span>
                </div>
                
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  Swacchta Analysis Complete
                </h2>
                <p className="text-gray-600">Real-time cleanliness assessment powered by AI</p>
              </div>

              {/* Main Result Display */}
              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Primary Score Card */}
                <div className="lg:col-span-1">
                  <div className={`relative overflow-hidden rounded-2xl border-2 shadow-xl ${getGradeColor(
                    result?.grade || getSwachataGrade(videoResult?.avgSwachta || bulkResult?.overallSwachtaIndex || 0).label
                  )}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="relative p-8 text-center">
                      <div className={`text-6xl font-black mb-3 ${getScoreColorClass(
                        result?.swachtaIndex || videoResult?.avgSwachta || bulkResult?.overallSwachtaIndex || 0
                      )}`}>
                        {result?.swachtaIndex || videoResult?.avgSwachta || bulkResult?.overallSwachtaIndex || 0}
                      </div>
                      <div className="text-lg font-bold mb-3 text-gray-800">
                        🏛️ SWACCHTA INDEX
                      </div>
                      <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-white/50">
                        <TrophyIcon className="h-4 w-4 mr-2 text-yellow-600" />
                        <span className="font-bold">
                          Grade {result?.grade || getSwachataGrade(videoResult?.avgSwachta || bulkResult?.overallSwachtaIndex || 0).label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {result?.summary.totalObjects || videoResult?.frameDetections?.length || bulkResult?.totalImages || 0}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {result ? 'Objects Found' : videoResult ? 'Total Detections' : 'Images Processed'}
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {result?.summary.averageConfidence || videoResult?.processedFrames || bulkResult?.cleanImages || 0}%
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {result ? 'Avg Confidence' : videoResult ? 'Frames Processed' : 'Clean Images'}
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
                    <div className="text-2xl font-bold text-emerald-600">
                      {videoResult?.maxSwachta || bulkResult?.dirtyImages || (result?.detections.length === 0 ? 'Clean' : 'Dirty')}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {videoResult ? 'Best Score' : bulkResult ? 'Dirty Images' : 'Status'}
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {currentSession.length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Session Buffer</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => setShowSaveDialog(true)}
                  disabled={currentSession.length === 0}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  Save to Analytics ({currentSession.length})
                </button>
                
                <button
                  onClick={clearSession}
                  disabled={currentSession.length === 0}
                  className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-xl shadow-lg border border-white/20 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Clear Session
                </button>

                <button
                  onClick={resetAll}
                  className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-xl shadow-lg border border-white/20 hover:bg-white/90 transition-all duration-200"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  New Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN INTERFACE SECTION */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Method Selection */}
        <div className="mb-8 detection-methods">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Detection Method</h3>
          <p className="text-gray-600 mb-6">Select your preferred detection method and configure settings</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { key: 'camera', icon: CameraIcon, label: 'Live Camera', desc: 'Real-time capture' },
              { key: 'upload', icon: PhotoIcon, label: 'Upload Image', desc: 'Single image analysis' },
              { key: 'video', icon: VideoCameraIcon, label: 'Video Analysis', desc: 'Process video files' },
              { key: 'bulk', icon: FolderIcon, label: 'Bulk Process', desc: 'Multiple images' }
            ].map(({ key, icon: Icon, label, desc }) => (
              <button
                key={key}
                onClick={() => setActiveMethod(key as any)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left group ${
                  activeMethod === key
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <Icon className={`h-8 w-8 mb-3 ${
                  activeMethod === key ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                <div className={`font-semibold mb-1 ${
                  activeMethod === key ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {label}
                </div>
                <div className="text-sm text-gray-500">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Detection Interface */}
        <div className="grid lg:grid-cols-4 gap-6">

              {/* Configuration Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-6">
                  <div className="flex items-center mb-4">
                    <Cog6ToothIcon className="h-5 w-5 text-gray-600 mr-2" />
                    <h4 className="font-semibold text-gray-900">Detection Settings</h4>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confidence: {confidenceThreshold}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={confidenceThreshold}
                        onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Object Size: {minObjectSize}%
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="5.0"
                        step="0.1"
                        value={minObjectSize}
                        onChange={(e) => setMinObjectSize(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="filter-low-confidence"
                        checked={filterLowConfidenceGarbage}
                        onChange={(e) => setFilterLowConfidenceGarbage(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="filter-low-confidence" className="ml-2 text-sm text-gray-700">
                        Filter Low Confidence
                      </label>
                    </div>

                    {activeMethod === 'video' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Processing Speed
                        </label>
                        <select
                          value={videoSpeedOption}
                          onChange={(e) => setVideoSpeedOption(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="fast">Fast (Every 10th frame)</option>
                          <option value="balanced">Balanced (Every 5th frame)</option>
                          <option value="detailed">Detailed (Every 2nd frame)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detection Interface */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  {/* Interface Header */}
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                    <h4 className="text-lg font-semibold text-gray-900 capitalize">
                      {activeMethod === 'camera' ? 'Live Camera Capture' :
                       activeMethod === 'upload' ? 'Image Upload' :
                       activeMethod === 'video' ? 'Video Analysis' :
                       'Bulk Processing'}
                    </h4>
                  </div>

                  <div className="p-6">
                    {/* Camera Interface */}
                    {activeMethod === 'camera' && (
                      <div className="space-y-6">
                        {!cameraStream && !capturedImage && (
                          <div className="text-center py-12">
                            <CameraIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <button
                              onClick={startCamera}
                              className="btn-primary inline-flex items-center space-x-2"
                            >
                              <CameraIcon className="h-5 w-5" />
                              <span>Start Camera</span>
                            </button>
                          </div>
                        )}

                        {cameraStream && !capturedImage && (
                          <div className="space-y-4">
                            <div className="relative rounded-lg overflow-hidden bg-black">
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-auto max-h-96 object-cover"
                              />
                            </div>
                            <div className="flex justify-center space-x-4">
                              <button
                                onClick={capturePhoto}
                                className="btn-primary inline-flex items-center space-x-2"
                              >
                                <PhotoIcon className="h-5 w-5" />
                                <span>Capture Photo</span>
                              </button>
                              <button
                                onClick={stopCamera}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {capturedImage && (
                          <div className="space-y-4">
                            <div className="relative rounded-lg overflow-hidden">
                              <img
                                src={capturedImage}
                                alt="Captured"
                                className="w-full h-auto max-h-96 object-cover"
                              />
                            </div>
                            <div className="flex justify-center space-x-4">
                              <button
                                onClick={() => {
                                  fetch(capturedImage)
                                    .then(res => res.blob())
                                    .then(blob => {
                                      const file = new File([blob], 'captured.jpg', { type: 'image/jpeg' })
                                      handleImageUpload(file)
                                    })
                                }}
                                disabled={isDetecting}
                                className="btn-primary"
                              >
                                {isDetecting ? 'Analyzing...' : 'Analyze Image'}
                              </button>
                              <button
                                onClick={startCamera}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                              >
                                Take Another
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                    )}

                    {/* Upload Interface */}
                    {activeMethod === 'upload' && (
                      <div className="space-y-6">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors">
                          <PhotoIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">Upload an Image</h4>
                          <p className="text-gray-500 mb-4">Drop your image here or click to browse</p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(file)
                            }}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isDetecting}
                            className="btn-primary"
                          >
                            {isDetecting ? 'Analyzing...' : 'Choose Image'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Video Interface */}
                    {activeMethod === 'video' && (
                      <div className="space-y-6">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors">
                          <VideoCameraIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">Upload a Video</h4>
                          <p className="text-gray-500 mb-4">Analyze video for garbage detection</p>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleVideoUpload(file)
                            }}
                            className="hidden"
                            id="video-upload"
                          />
                          <label
                            htmlFor="video-upload"
                            className={`btn-primary cursor-pointer ${isDetecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isDetecting ? 'Processing...' : 'Choose Video'}
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Bulk Interface */}
                    {activeMethod === 'bulk' && (
                      <div className="space-y-6">
                        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                          <div className="flex items-start space-x-3">
                            <FolderIcon className="h-6 w-6 text-blue-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-900">Bulk Processing</h4>
                              <p className="text-blue-700 text-sm mt-1">
                                Process all images in the v2_test_img directory
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <button
                            onClick={handleBulkProcessing}
                            disabled={isDetecting}
                            className="btn-primary"
                          >
                            {isDetecting ? 'Processing Images...' : 'Start Bulk Processing'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Loading State */}
                    {isDetecting && (
                      <div className="mt-6">
                        {activeMethod === 'video' ? (
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">Processing Video</h4>
                                <span className="text-lg font-bold text-blue-600">{Math.round(videoProgress)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500 ease-out"
                                  style={{ width: `${videoProgress}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-700 mb-3 font-medium">{videoProcessingStatus}</div>
                              <div className="flex items-center justify-center space-x-2">
                                <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full"></div>
                                <div className="animate-pulse w-3 h-3 bg-purple-500 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                                <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full" style={{ animationDelay: '0.4s' }}></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-700 font-medium">Analyzing...</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error Display */}
                    {error && (
                      <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          {/* </div> */}
        </div>
            
      {/* Save Session Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <MapPinIcon className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Save Detection Session</h3>
            </div>
            <p className="text-gray-600 mb-4">
              You have {currentSession.length} detection(s) in your session. Enter a location name to save to analytics.
            </p>
            
            {/* Location Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Name *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  placeholder="Enter location name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowMapSelector(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m-6 3l6-3" />
                  </svg>
                  <span>Pick on Map</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tip: Use "Pick on Map" for easy location selection with search
              </p>
            </div>

            {/* Optional Coordinates Section */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="use-custom-coords"
                  checked={useCustomCoords}
                  onChange={(e) => setUseCustomCoords(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                />
                <label htmlFor="use-custom-coords" className="text-sm font-medium text-gray-700">
                  Set custom location coordinates (optional)
                </label>
              </div>
              
              {useCustomCoords && (
                <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={locationCoords.lat}
                      onChange={(e) => setLocationCoords(prev => ({ ...prev, lat: e.target.value }))}
                      placeholder="28.6139"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={locationCoords.lng}
                      onChange={(e) => setLocationCoords(prev => ({ ...prev, lng: e.target.value }))}
                      placeholder="77.2090"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors mb-2"
                    >
                      Get Current Location
                    </button>
                    <p className="text-xs text-gray-500">
                      Tip: Leave empty to use default Delhi coordinates (28.6139, 77.2090)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSaveSession}
                disabled={!currentLocation.trim()}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save to Analytics
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false)
                  setCurrentLocation('')
                  setLocationCoords({ lat: '', lng: '' })
                  setUseCustomCoords(false)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Location Selector */}
      {showMapSelector && (
        <MapLocationSelector
          onLocationSelect={handleMapLocationSelect}
          onClose={() => setShowMapSelector(false)}
          initialLocation={
            locationCoords.lat && locationCoords.lng 
              ? { lat: parseFloat(locationCoords.lat), lng: parseFloat(locationCoords.lng) }
              : undefined
          }
        />
      )}
    </div>
  )
} 