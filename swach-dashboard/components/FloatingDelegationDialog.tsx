'use client'

import { useState } from 'react'
import { 
  UserGroupIcon, 
  CalendarDaysIcon, 
  ClipboardDocumentListIcon,
  XMarkIcon,
  PlusIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
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
  estimatedDuration: number
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

interface FloatingDelegationDialogProps {
  isOpen: boolean
  onClose: () => void
  areas: any[]
}

export default function FloatingDelegationDialog({ isOpen, onClose, areas }: FloatingDelegationDialogProps) {
  const [activeView, setActiveView] = useState<'overview' | 'tasks' | 'team' | 'create'>('overview')
  const [showTaskDropdown, setShowTaskDropdown] = useState(false)
  const [showTeamDropdown, setShowTeamDropdown] = useState(false)
  
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Clean Up Mumbai Slum Area',
      description: 'High priority cleaning required',
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
      skills: ['waste_collection', 'heavy_cleaning'],
      currentTasks: 2,
      rating: 4.8
    },
    {
      id: '2',
      name: 'Priya Singh',
      role: 'Inspector',
      availability: 'busy',
      skills: ['inspection', 'reporting'],
      currentTasks: 3,
      rating: 4.9
    },
    {
      id: '3',
      name: 'Mohammad Ali',
      role: 'Team Lead',
      availability: 'available',
      skills: ['leadership', 'coordination'],
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

  if (!isOpen) return null

  const generateAutoTasks = () => {
    const problematicAreas = areas.filter(area => area.averageSwachtaIndex < 60)
    return problematicAreas.slice(0, 3).map(area => ({
      title: `Urgent Cleanup - ${area.name}`,
      description: `Score: ${area.averageSwachtaIndex}. Needs attention.`,
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
    setActiveView('overview')
  }

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status } : task
    ))
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
      case 'medium': return <ClockIcon className="h-4 w-4 text-yellow-600" />
      case 'low': return <CheckCircleIcon className="h-4 w-4 text-green-600" />
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4 text-green-600" />
      case 'in-progress': return <ClockIcon className="h-4 w-4 text-blue-600" />
      case 'pending': return <div className="h-4 w-4 bg-gray-400 rounded-full" />
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />
    }
  }

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'available': return <div className="h-3 w-3 bg-green-500 rounded-full" />
      case 'busy': return <div className="h-3 w-3 bg-yellow-500 rounded-full" />
      case 'offline': return <div className="h-3 w-3 bg-red-500 rounded-full" />
      default: return <div className="h-3 w-3 bg-gray-400 rounded-full" />
    }
  }

  return (
    <div className="floating-dialog">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="gradient-bg-primary p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                <UserGroupIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Team Management</h2>
                <p className="text-blue-100 text-lg">Manage tasks and team efficiently</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-7 w-7" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-6 mt-8 delegation-stats">
            <div className="glass-effect p-4 rounded-lg text-center">
              <div className="text-3xl font-bold">{tasks.length}</div>
              <div className="text-sm text-blue-100">Total Tasks</div>
            </div>
            <div className="glass-effect p-4 rounded-lg text-center">
              <div className="text-3xl font-bold">{tasks.filter(t => t.status === 'pending').length}</div>
              <div className="text-sm text-blue-100">Pending</div>
            </div>
            <div className="glass-effect p-4 rounded-lg text-center">
              <div className="text-3xl font-bold">{teamMembers.filter(m => m.availability === 'available').length}</div>
              <div className="text-sm text-blue-100">Available</div>
            </div>
            <div className="glass-effect p-4 rounded-lg text-center">
              <div className="text-3xl font-bold">{generateAutoTasks().length}</div>
              <div className="text-sm text-blue-100">Suggestions</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-b border-gray-200 px-8">
          <nav className="flex space-x-12 delegation-tabs">
            {[
              { key: 'overview', label: 'Overview', icon: ChartBarIcon },
              { key: 'tasks', label: 'Tasks', icon: ClipboardDocumentListIcon },
              { key: 'team', label: 'Team', icon: UserGroupIcon },
              { key: 'create', label: 'Create Task', icon: PlusIcon }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key as any)}
                className={`py-6 px-2 border-b-2 font-medium text-base transition-colors flex items-center space-x-2 ${
                  activeView === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-8 h-[calc(85vh-280px)] overflow-y-auto">
          {/* Overview */}
          {activeView === 'overview' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <button
                    onClick={() => setShowTaskDropdown(!showTaskDropdown)}
                    className="w-full p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600 mr-3" />
                      <div className="text-left">
                        <div className="font-medium text-blue-900">Quick Tasks</div>
                        <div className="text-sm text-blue-600">{tasks.filter(t => t.status === 'pending').length} pending</div>
                      </div>
                    </div>
                    <ChevronDownIcon className="h-5 w-5 text-blue-600" />
                  </button>
                  
                  {showTaskDropdown && (
                    <div className="dropdown-content">
                      <div className="p-2">
                        {tasks.slice(0, 3).map(task => (
                          <div key={task.id} className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium truncate">{task.title}</div>
                                <div className="text-xs text-gray-500">{task.assignedTo}</div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>{getPriorityIcon(task.priority)}</span>
                                <span>{getStatusIcon(task.status)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => setActiveView('tasks')}
                          className="w-full p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          View All Tasks
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                    className="w-full p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <UserGroupIcon className="h-6 w-6 text-green-600 mr-3" />
                      <div className="text-left">
                        <div className="font-medium text-green-900">Team Status</div>
                        <div className="text-sm text-green-600">{teamMembers.filter(m => m.availability === 'available').length} available</div>
                      </div>
                    </div>
                    <ChevronDownIcon className="h-5 w-5 text-green-600" />
                  </button>
                  
                  {showTeamDropdown && (
                    <div className="dropdown-content">
                      <div className="p-2">
                        {teamMembers.map(member => (
                          <div key={member.id} className="p-3 hover:bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">{member.name}</div>
                                <div className="text-xs text-gray-500">{member.role}</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span>{getAvailabilityIcon(member.availability)}</span>
                                <span className="text-xs">⭐{member.rating}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => setActiveView('team')}
                          className="w-full p-2 text-sm text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          View Team Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Auto Suggestions */}
              {generateAutoTasks().length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                    <h3 className="font-medium text-yellow-900">AI Suggestions</h3>
                  </div>
                  <div className="space-y-2">
                    {generateAutoTasks().map((suggestion, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{suggestion.title}</div>
                          <div className="text-xs text-gray-500">{suggestion.description}</div>
                        </div>
                        <button
                          onClick={() => {
                            setNewTask(prev => ({ ...prev, ...suggestion, priority: 'medium' as const }))
                            setActiveView('create')
                          }}
                          className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-lg hover:bg-yellow-700"
                        >
                          Create
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tasks View */}
          {activeView === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">All Tasks</h3>
                <button
                  onClick={() => setActiveView('create')}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  New Task
                </button>
              </div>
              {tasks.map(task => (
                <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span>{getPriorityIcon(task.priority)}</span>
                        <span className="font-medium">{task.title}</span>
                        <span>{getStatusIcon(task.status)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Assigned: {task.assignedTo}</span>
                        <span>Location: {task.location}</span>
                        <span>Duration: {task.estimatedDuration}h</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'in-progress')}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
                        >
                          Start
                        </button>
                      )}
                      {task.status === 'in-progress' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Team View */}
          {activeView === 'team' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamMembers.map(member => (
                <div key={member.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.role}</div>
                    </div>
                    <span>{getAvailabilityIcon(member.availability)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Rating: {member.rating}/5</div>
                    <div>Tasks: {member.currentTasks}</div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Skills:</div>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.slice(0, 2).map(skill => (
                        <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {skill.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Task */}
          {activeView === 'create' && (
            <div className="space-y-4">
              <h3 className="font-medium">Create New Task</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Assign To</label>
                  <select
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select member</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={newTask.location}
                    onChange={(e) => setNewTask(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={createTask}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Task
                </button>
                <button
                  onClick={() => setActiveView('overview')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 