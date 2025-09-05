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

export const exportToCSV = (areas: AreaData[], filename = 'swach-dashboard-data') => {
  const headers = [
    'Rank',
    'Area Name',
    'Swachta Index',
    'Grade',
    'Total Detections',
    'Improvement Trend',
    'Latitude',
    'Longitude',
    'Last Updated'
  ]

  const csvData = areas.map(area => [
    area.rank,
    area.name,
    area.averageSwachtaIndex,
    area.grade,
    area.totalDetections,
    area.improvementTrend,
    area.location.lat,
    area.location.lng,
    area.lastUpdated.toLocaleDateString()
  ])

  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const generatePDFReport = async (areas: AreaData[], mapElement?: HTMLElement) => {
  // Dynamic import for better bundle size
  const jsPDF = (await import('jspdf')).default
  const html2canvas = (await import('html2canvas')).default

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPosition = 20

  // Title
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('SWACH Dashboard Report', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 10

  // Subtitle
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15

  // Summary Statistics
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary Statistics', 20, yPosition)
  yPosition += 10

  const totalAreas = areas.length
  const totalDetections = areas.reduce((sum, area) => sum + area.totalDetections, 0)
  const averageScore = areas.length > 0 ? 
    Math.round((areas.reduce((sum, area) => sum + area.averageSwachtaIndex, 0) / areas.length) * 10) / 10 : 0
  const cleanAreas = areas.filter(area => area.averageSwachtaIndex >= 80).length

  const stats = [
    `Total Areas Monitored: ${totalAreas}`,
    `Total Detections: ${totalDetections}`,
    `Average Swachta Index: ${averageScore}`,
    `Clean Areas (80+): ${cleanAreas}`,
    `Improvement Rate: ${Math.round((areas.filter(a => a.improvementTrend === 'up').length / totalAreas) * 100)}%`
  ]

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  stats.forEach(stat => {
    doc.text(stat, 25, yPosition)
    yPosition += 5
  })
  yPosition += 10

  // Areas Table
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Areas Performance', 20, yPosition)
  yPosition += 10

  // Table headers
  const tableHeaders = ['Rank', 'Area Name', 'Score', 'Grade', 'Detections', 'Trend']
  const colWidths = [15, 50, 20, 15, 25, 20]
  let xPosition = 20

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  tableHeaders.forEach((header, index) => {
    doc.text(header, xPosition, yPosition)
    xPosition += colWidths[index]
  })
  yPosition += 5

  // Table rows
  doc.setFont('helvetica', 'normal')
  areas.forEach(area => {
    if (yPosition > pageHeight - 30) {
      doc.addPage()
      yPosition = 20
    }

    xPosition = 20
    const rowData = [
      area.rank.toString(),
      area.name.length > 20 ? area.name.substring(0, 20) + '...' : area.name,
      area.averageSwachtaIndex.toString(),
      area.grade,
      area.totalDetections.toString(),
      area.improvementTrend === 'up' ? '↑' : area.improvementTrend === 'down' ? '↓' : '→'
    ]

    rowData.forEach((data, index) => {
      doc.text(data, xPosition, yPosition)
      xPosition += colWidths[index]
    })
    yPosition += 5
  })

  // Map capture (if provided)
  if (mapElement) {
    try {
      doc.addPage()
      yPosition = 20

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Hotspot Map', 20, yPosition)
      yPosition += 15

      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        scale: 2
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = pageWidth - 40
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      if (imgHeight < pageHeight - yPosition - 20) {
        doc.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight)
      }
    } catch (error) {
      console.error('Failed to capture map:', error)
    }
  }

  // Performance Chart
  doc.addPage()
  yPosition = 20

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Performance Chart', 20, yPosition)
  yPosition += 15

  // Simple bar chart
  const maxScore = Math.max(...areas.map(a => a.averageSwachtaIndex))
  const chartHeight = 100
  const barWidth = Math.min(150 / areas.length, 15)

  areas.slice(0, 10).forEach((area, index) => {
    const barHeight = (area.averageSwachtaIndex / maxScore) * chartHeight
    const x = 20 + (index * (barWidth + 5))
    const y = yPosition + chartHeight - barHeight

    // Draw bar
    doc.setFillColor(
      area.averageSwachtaIndex >= 80 ? '#22c55e' :
      area.averageSwachtaIndex >= 60 ? '#3b82f6' :
      area.averageSwachtaIndex >= 40 ? '#f59e0b' : '#ef4444'
    )
    doc.rect(x, y, barWidth, barHeight, 'F')

    // Area label
    doc.setFontSize(7)
    doc.text(area.name.substring(0, 8), x, yPosition + chartHeight + 8, { angle: 45 })

    // Score label
    doc.setFontSize(6)
    doc.text(area.averageSwachtaIndex.toString(), x + 2, y - 2)
  })

  // Footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text('Generated by SWACH Dashboard - Smart Waste & Cleanliness Hygiene', 
    pageWidth / 2, pageHeight - 10, { align: 'center' })

  // Save the PDF
  doc.save(`swach-dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`)
}

export const generateDetailedReport = (areas: AreaData[]) => {
  const bestPerforming = areas.filter(a => a.averageSwachtaIndex >= 80)
  const needsAttention = areas.filter(a => a.averageSwachtaIndex < 60)
  const improving = areas.filter(a => a.improvementTrend === 'up')
  
  return {
    summary: {
      totalAreas: areas.length,
      averageScore: areas.reduce((sum, area) => sum + area.averageSwachtaIndex, 0) / areas.length,
      bestPerforming: bestPerforming.length,
      needsAttention: needsAttention.length,
      improving: improving.length
    },
    recommendations: [
      ...(needsAttention.length > 0 ? [`Focus attention on ${needsAttention.length} areas with scores below 60`] : []),
      ...(improving.length > 0 ? [`Monitor ${improving.length} improving areas to maintain positive trend`] : []),
      ...(bestPerforming.length > 0 ? [`Replicate best practices from ${bestPerforming.length} top-performing areas`] : [])
    ],
    topPerformers: areas.slice(0, 3),
    bottomPerformers: areas.slice(-3).reverse()
  }
} 