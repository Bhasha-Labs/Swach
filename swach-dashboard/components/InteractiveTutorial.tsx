'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'

interface TutorialStep {
  id: string
  title: string
  description: string
  target: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  highlight: boolean
  action?: string
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to SWACH Dashboard',
    description: 'Your AI-powered waste detection and management platform. Let\'s take a quick tour of all the amazing features!',
    target: '.main-container',
    position: 'center',
    highlight: false
  },
  {
    id: 'tabs',
    title: 'Navigation Tabs',
    description: 'Switch between Analytics Dashboard and Live Detection. The badge shows how many areas you\'ve analyzed.',
    target: '.tab-navigation',
    position: 'bottom',
    highlight: true
  },
  {
    id: 'stats',
    title: 'Key Metrics',
    description: 'Monitor your key performance indicators: areas monitored, total detections, average cleanliness score, and clean areas count.',
    target: '.stats-grid',
    position: 'bottom',
    highlight: true
  },
  {
    id: 'hotspot-map',
    title: 'Hotspot Map',
    description: 'Visualize all your monitored areas on an interactive map. Color-coded markers show cleanliness levels at a glance.',
    target: '.hotspot-map-section',
    position: 'right',
    highlight: true
  },
  {
    id: 'comparison',
    title: 'Smart Comparison',
    description: 'Compare multiple areas with chart view, table view, and AI-powered insights. Perfect for identifying patterns and trends.',
    target: '.comparison-section',
    position: 'top',
    highlight: true
  },
  {
    id: 'top-performers',
    title: 'Top Performers',
    description: 'See your cleanest areas ranked by Swachta Index. Learn from the best performing locations.',
    target: '.top-performers-section',
    position: 'left',
    highlight: true
  },
  {
    id: 'needs-attention',
    title: 'Areas Needing Attention',
    description: 'Quickly identify problem areas that require immediate action. Prioritize your cleanup efforts effectively.',
    target: '.needs-attention-section',
    position: 'left',
    highlight: true
  },
  {
    id: 'export-features',
    title: 'Export & Reports',
    description: 'Export your data as CSV or generate beautiful PDF reports with maps, charts, and insights for stakeholders.',
    target: '.export-buttons',
    position: 'bottom',
    highlight: true
  },
  {
    id: 'live-detection',
    title: 'Live Detection Tab',
    description: 'Click here to switch to Live Detection where you can analyze images, videos, camera feeds, or process bulk images.',
    target: '.detection-tab',
    position: 'bottom',
    highlight: true,
    action: 'Click to switch tabs'
  },
  {
    id: 'detection-methods',
    title: 'Detection Methods',
    description: 'Choose from 4 detection methods: Live Camera for real-time analysis, Upload Image for single photos, Video Analysis for footage, or Bulk Process for multiple images.',
    target: '.detection-methods',
    position: 'bottom',
    highlight: true
  },
  {
    id: 'detection-settings',
    title: 'Detection Settings',
    description: 'Fine-tune your analysis with confidence threshold, low-confidence filtering, minimum object size, and video speed options.',
    target: '.detection-settings',
    position: 'left',
    highlight: true
  },
  {
    id: 'results-display',
    title: 'Results & Swachta Index',
    description: 'View detailed detection results with Swachta Index scoring, grade assignment, and comprehensive analysis summaries.',
    target: '.results-section',
    position: 'top',
    highlight: true
  },
  {
    id: 'session-management',
    title: 'Session Management',
    description: 'Save your detection sessions to specific locations with GPS coordinates or map selection. Build your analytics database.',
    target: '.session-controls',
    position: 'top',
    highlight: true
  },
  {
    id: 'delegation-button',
    title: 'Team Management',
    description: 'Click this floating button to access the powerful team management system. Assign tasks, manage team members, and schedule work.',
    target: '.delegation-button',
    position: 'left',
    highlight: true,
    action: 'Click to open'
  },
  {
    id: 'delegation-overview',
    title: 'Delegation Dashboard',
    description: 'Get an overview of total tasks, pending work, available team members, and AI suggestions for new tasks based on area performance.',
    target: '.delegation-stats',
    position: 'bottom',
    highlight: true
  },
  {
    id: 'delegation-features',
    title: 'Delegation Features',
    description: 'Navigate between Overview (quick access), Tasks (full task management), Team (member profiles), and Create Task (new assignments).',
    target: '.delegation-tabs',
    position: 'bottom',
    highlight: true
  },
  {
    id: 'ai-suggestions',
    title: 'AI Task Suggestions',
    description: 'Our AI automatically suggests cleanup tasks for areas with low Swachta Index scores. One-click task creation from suggestions.',
    target: '.ai-suggestions',
    position: 'bottom',
    highlight: true
  },
  {
    id: 'task-management',
    title: 'Task Management',
    description: 'View all tasks with priority levels, status tracking, assignee information, and quick action buttons to update progress.',
    target: '.task-list',
    position: 'top',
    highlight: true
  },
  {
    id: 'team-management',
    title: 'Team Management',
    description: 'Monitor team member availability, skills, current workload, and performance ratings. Optimize task assignments based on capabilities.',
    target: '.team-grid',
    position: 'top',
    highlight: true
  },
  {
    id: 'tutorial-complete',
    title: 'Tutorial Complete!',
    description: 'You\'re now ready to use SWACH Dashboard like a pro! Start by uploading some images or videos for detection, then use the delegation system to manage cleanup tasks.',
    target: '.main-container',
    position: 'center',
    highlight: false
  }
]

interface InteractiveTutorialProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export default function InteractiveTutorial({ isOpen, onClose, onComplete }: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (isPlaying && isOpen) {
      const timer = setTimeout(() => {
        if (currentStep < tutorialSteps.length - 1) {
          setCurrentStep(prev => prev + 1)
        } else {
          setIsPlaying(false)
          onComplete()
        }
      }, 4000) // 4 seconds per step

      return () => clearTimeout(timer)
    }
  }, [currentStep, isPlaying, isOpen, onComplete])

  useEffect(() => {
    if (isOpen) {
      // Add tutorial classes to target elements
      const step = tutorialSteps[currentStep]
      
      // Remove previous highlights
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight')
      })
      
      // Add current highlight
      if (step.highlight) {
        const target = document.querySelector(step.target)
        if (target) {
          target.classList.add('tutorial-highlight')
        }
      }
    }

    return () => {
      // Cleanup highlights when tutorial closes
      if (!isOpen) {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
          el.classList.remove('tutorial-highlight')
        })
      }
    }
  }, [isOpen, currentStep])

  if (!isOpen) return null

  const currentStepData = tutorialSteps[currentStep]
  
  const getArrowPosition = () => {
    const target = document.querySelector(currentStepData.target)
    if (!target) return { top: '50%', left: '50%' }

    const rect = target.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

    switch (currentStepData.position) {
      case 'top':
        return {
          top: `${rect.top + scrollTop - 20}px`,
          left: `${rect.left + scrollLeft + rect.width / 2}px`,
          transform: 'translate(-50%, -100%)'
        }
      case 'bottom':
        return {
          top: `${rect.bottom + scrollTop + 20}px`,
          left: `${rect.left + scrollLeft + rect.width / 2}px`,
          transform: 'translate(-50%, 0)'
        }
      case 'left':
        return {
          top: `${rect.top + scrollTop + rect.height / 2}px`,
          left: `${rect.left + scrollLeft - 20}px`,
          transform: 'translate(-100%, -50%)'
        }
      case 'right':
        return {
          top: `${rect.top + scrollTop + rect.height / 2}px`,
          left: `${rect.right + scrollLeft + 20}px`,
          transform: 'translate(0, -50%)'
        }
      case 'center':
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }
    }
  }

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const toggleAutoPlay = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <>
      {/* Tutorial Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" style={{ backdropFilter: 'blur(2px)' }}>
        {/* Tutorial Tooltip */}
        <div
          className="absolute bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-sm w-full mx-4 transition-all duration-500 ease-in-out"
          style={getArrowPosition()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm mr-3">
                {currentStep + 1}
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{currentStepData.title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <p className="text-gray-600 mb-6 leading-relaxed">{currentStepData.description}</p>

          {/* Action Hint */}
          {currentStepData.action && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 text-sm font-medium">{currentStepData.action}</p>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Progress</span>
              <span>{currentStep + 1} of {tutorialSteps.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Previous
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleAutoPlay}
                className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                {isPlaying ? (
                  <>
                    <PauseIcon className="h-4 w-4 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4 mr-1" />
                    Auto
                  </>
                )}
              </button>

              <button
                onClick={nextStep}
                className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
                {currentStep !== tutorialSteps.length - 1 && (
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Arrow Pointer */}
        {currentStepData.position !== 'center' && (
          <div
            className="absolute pointer-events-none"
            style={(() => {
              const target = document.querySelector(currentStepData.target)
              if (!target) return { display: 'none' }

              const rect = target.getBoundingClientRect()
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop
              const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

              return {
                top: `${rect.top + scrollTop + rect.height / 2}px`,
                left: `${rect.left + scrollLeft + rect.width / 2}px`,
                transform: 'translate(-50%, -50%)'
              }
            })()}
          >
            <div className="relative">
              <div className="w-4 h-4 bg-blue-600 rotate-45 animate-pulse"></div>
              <div className="absolute inset-0 w-8 h-8 border-2 border-blue-600 rounded-full animate-ping opacity-75 -top-2 -left-2"></div>
            </div>
          </div>
        )}
      </div>

      {/* Tutorial Styles */}
      <style jsx global>{`
        .tutorial-highlight {
          position: relative;
          z-index: 51 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2) !important;
          border-radius: 8px !important;
          animation: tutorialPulse 2s infinite;
        }

        @keyframes tutorialPulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.7), 0 0 0 12px rgba(59, 130, 246, 0.3);
          }
        }
      `}</style>
    </>
  )
} 