export interface SwachataGrade {
  label: string
  colorClass: string
  description: string
  score: number
}

export function getSwachataGrade(index: number): SwachataGrade {
  if (index >= 95) {
    return { 
      label: 'A+', 
      colorClass: 'status-excellent', 
      description: 'Excellent - Pristine',
      score: index 
    }
  } else if (index >= 85) {
    return { 
      label: 'A', 
      colorClass: 'status-excellent', 
      description: 'Very Good - Clean',
      score: index 
    }
  } else if (index >= 75) {
    return { 
      label: 'B+', 
      colorClass: 'status-good', 
      description: 'Good - Mostly Clean',
      score: index 
    }
  } else if (index >= 65) {
    return { 
      label: 'B', 
      colorClass: 'status-good', 
      description: 'Fair - Some Issues',
      score: index 
    }
  } else if (index >= 55) {
    return { 
      label: 'C+', 
      colorClass: 'status-poor', 
      description: 'Moderate - Noticeable Litter',
      score: index 
    }
  } else if (index >= 45) {
    return { 
      label: 'C', 
      colorClass: 'status-poor', 
      description: 'Poor - Significant Garbage',
      score: index 
    }
  } else if (index >= 35) {
    return { 
      label: 'D+', 
      colorClass: 'status-critical', 
      description: 'Bad - Heavy Pollution',
      score: index 
    }
  } else if (index >= 25) {
    return { 
      label: 'D', 
      colorClass: 'status-critical', 
      description: 'Very Bad - Severe Issues',
      score: index 
    }
  } else if (index >= 15) {
    return { 
      label: 'F+', 
      colorClass: 'status-critical', 
      description: 'Critical - Environmental Hazard',
      score: index 
    }
  } else {
    return { 
      label: 'F', 
      colorClass: 'status-critical', 
      description: 'Catastrophic - Immediate Action Required',
      score: index 
    }
  }
}

export function getStatusColor(index: number): string {
  if (index >= 80) return 'text-swach-600'
  if (index >= 60) return 'text-blue-600'
  if (index >= 40) return 'text-yellow-600'
  return 'text-danger-600'
}

export function getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up': return '↗️'
    case 'down': return '↘️'
    case 'stable': return '➡️'
    default: return '➡️'
  }
}

export function formatLastUpdated(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 60) {
    return `${diffMins}m ago`
  } else if (diffMins < 1440) {
    return `${Math.floor(diffMins / 60)}h ago`
  } else {
    return `${Math.floor(diffMins / 1440)}d ago`
  }
} 