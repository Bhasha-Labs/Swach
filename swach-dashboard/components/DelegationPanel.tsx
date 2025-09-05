'use client'

import { useState } from 'react'
import { 
  UserGroupIcon, 
  CalendarDaysIcon, 
  BellIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'

interface Task {
  id: string
  title: string
  description: string
  assignedTo: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in-progress' | 'completed'
  dueDate: Date
  location: string
  createdAt: Date
  estimatedDuration: number // in hours
}

interface TeamMember {
  id: string
  name: string
  role: string
  availability: 'available' | 'busy' | 'offline'
  skills: string[]
  currentTasks: number
  rating: number
}

interface DelegationPanelProps {
  areas: any[]
}

export default function DelegationPanel({ areas }: DelegationPanelProps) {
  const [activeView, setActiveView] = useState<'tasks' | 'team' | 'schedule'>('tasks')
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Clean Up Mumbai Slum Area',
      description: 'High priority cleaning required based on detection results',
      assignedTo: 'Raj Patel',
      priority: 'high',
      status: 'pending',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      location: 'mumbai_slum',
      createdAt: new Date(),
      estimatedDuration: 4
    },
    {
      id: '2',
      title: 'Routine Inspection - Indore',
      description: 'Weekly inspection and maintenance',
      assignedTo: 'Priya Singh',
      priority: 'medium',
      status: 'in-progress',
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      location: 'indore',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      estimatedDuration: 2
    }
  ])

  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Raj Patel',
      role: 'Senior Cleaner',
      availability: 'available',
      skills: ['waste_collection', 'heavy_cleaning', 'equipment_operation'],
      currentTasks: 2,
      rating: 4.8
    },
    {
      id: '2',
      name: 'Priya Singh',
      role: 'Inspection Specialist',
      availability: 'busy',
      skills: ['inspection', 'reporting', 'quality_control'],
      currentTasks: 3,
      rating: 4.9
    },
    {
      id: '3',
      name: 'Mohammad Ali',
      role: 'Team Lead',
      availability: 'available',
      skills: ['leadership', 'coordination', 'emergency_response'],
      currentTasks: 1,
      rating: 4.7
    }
  ])

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium' as const,
    location: '',
    estimatedDuration: 2
  })

  // Auto-suggest tasks based on area performance
  const generateAutoTasks = () => {
    const problematicAreas = areas.filter(area => area.averageSwachtaIndex < 60)
    return problematicAreas.map(area => ({
      title: `Urgent Cleanup - ${area.name}`,
      description: `Area score: ${area.averageSwachtaIndex}. Immediate attention required.`,
      location: area.name,
      priority: area.averageSwachtaIndex < 40 ? 'high' : 'medium',
      estimatedDuration: area.averageSwachtaIndex < 40 ? 6 : 3
    }))
  }

  const createTask = () => {
    if (!newTask.title || !newTask.assignedTo) return

    const task: Task = {
      id: Date.now().toString(),
      ...newTask,
      status: 'pending',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date()
    }

    setTasks(prev => [...prev, task])
    setNewTask({
      title: '',
      description: '',
      assignedTo: '',
      priority: 'medium',
      location: '',
      estimatedDuration: 2
    })
    setShowCreateTask(false)
  }

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status } : task
    ))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600'
      case 'busy': return 'text-yellow-600'
      case 'offline': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <UserGroupIcon className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Team Management</h3>
              <p className="text-sm text-gray-600">Manage tasks, team, and schedules</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateTask(true)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Task
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-2 bg-white rounded-lg p-1 mt-4">
          {[
            { key: 'tasks', label: 'Tasks', icon: ClipboardDocumentListIcon },
            { key: 'team', label: 'Team', icon: UserGroupIcon },
            { key: 'schedule', label: 'Schedule', icon: CalendarDaysIcon }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveView(key as any)}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === key
                  ? 'bg-purple-100 text-purple-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Tasks View */}
        {activeView === 'tasks' && (
          <div className="space-y-4">
            {/* Auto-suggestions */}
            {generateAutoTasks().length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📋 Suggested Tasks</h4>
                <div className="space-y-2">
                  {generateAutoTasks().slice(0, 2).map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{suggestion.title}</div>
                        <div className="text-xs text-gray-500">{suggestion.description}</div>
                      </div>
                      <button
                        onClick={() => {
                          setNewTask(prev => ({
                            ...prev,
                            ...suggestion,
                            priority: 'medium' as const
                          }))
                          setShowCreateTask(true)
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Create
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Task List */}
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(task.status)}`}>
                          {task.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>👤 {task.assignedTo}</span>
                        <span>📍 {task.location}</span>
                        <span>⏱️ {task.estimatedDuration}h</span>
                        <span>📅 {task.dueDate.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'in-progress')}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          Start
                        </button>
                      )}
                      {task.status === 'in-progress' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team View */}
        {activeView === 'team' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Team Members</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamMembers.map(member => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900">{member.name}</h5>
                      <p className="text-sm text-gray-600">{member.role}</p>
                    </div>
                    <span className={`text-sm font-medium ${getAvailabilityColor(member.availability)}`}>
                      ● {member.availability}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Rating:</span>
                      <span className="font-medium">⭐ {member.rating}/5</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Current Tasks:</span>
                      <span className="font-medium">{member.currentTasks}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {member.skills.slice(0, 3).map(skill => (
                          <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {skill.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule View */}
        {activeView === 'schedule' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Today's Schedule</h4>
            <div className="space-y-3">
              {tasks.filter(task => task.status !== 'completed').map(task => {
                const startTime = new Date(task.dueDate.getTime() - task.estimatedDuration * 60 * 60 * 1000)
                return (
                  <div key={task.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 min-w-[80px]">
                      {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-600">{task.assignedTo} • {task.location}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <select
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select member</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={createTask}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
              >
                Create Task
              </button>
              <button
                onClick={() => setShowCreateTask(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 