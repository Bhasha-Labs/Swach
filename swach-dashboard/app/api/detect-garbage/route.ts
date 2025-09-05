import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

// Swachta Index calculation (same as Streamlit)
function calculateSwachtaIndex(detections: any[]): { index: number, grade: string, details: any } {
  if (detections.length === 0) {
    return { index: 100, grade: 'A+', details: { detections: 0, coverage: 0 } }
  }

  // Base penalty system
  let totalPenalty = 0
  let totalArea = 0
  const frameArea = 640 * 640 // Standard YOLO input size

  // Penalty weights by garbage type
  const severityWeights: { [key: string]: number } = {
    'garbage': 15,
    'trash': 12,
    'waste': 10,
    'litter': 8,
    'debris': 6,
    'default': 10
  }

  for (const detection of detections) {
    const { bbox, confidence, class: className } = detection
    
    // Calculate bounding box area
    const width = Math.abs(bbox[2] - bbox[0])
    const height = Math.abs(bbox[3] - bbox[1])
    const area = width * height
    totalArea += area

    // Get severity weight
    const severity = severityWeights[className?.toLowerCase()] || severityWeights.default

    // Size-weighted penalty (larger objects = more penalty)
    const sizeMultiplier = Math.sqrt(area / frameArea) * 2

    // Confidence-based penalty (higher confidence = more penalty)
    const confidencePenalty = confidence * 0.8

    // Individual object penalty
    const objectPenalty = severity * sizeMultiplier * confidencePenalty
    totalPenalty += objectPenalty
  }

  // Coverage penalty (exponential scaling)
  const coverageRatio = Math.min(totalArea / frameArea, 1.0)
  const coveragePenalty = Math.pow(coverageRatio * 100, 1.3)

  // Density penalty (many objects close together)
  const densityPenalty = Math.pow(detections.length, 1.2) * 3

  // Variety penalty (different types of garbage)
  const uniqueClasses = new Set(detections.map(d => d.class)).size
  const varietyPenalty = Math.pow(uniqueClasses, 1.1) * 2

  // Final calculation
  const basePenalty = totalPenalty + coveragePenalty + densityPenalty + varietyPenalty
  const exponentialPenalty = Math.pow(basePenalty / 10, 1.1)
  
  let swachtaIndex = Math.max(0, 100 - exponentialPenalty)
  swachtaIndex = Math.round(swachtaIndex * 10) / 10 // Round to 1 decimal

  // Determine grade
  let grade = 'F'
  if (swachtaIndex >= 95) grade = 'A+'
  else if (swachtaIndex >= 85) grade = 'A'
  else if (swachtaIndex >= 75) grade = 'B+'
  else if (swachtaIndex >= 65) grade = 'B'
  else if (swachtaIndex >= 55) grade = 'C+'
  else if (swachtaIndex >= 45) grade = 'C'
  else if (swachtaIndex >= 35) grade = 'D+'
  else if (swachtaIndex >= 25) grade = 'D'
  else if (swachtaIndex >= 15) grade = 'F+'

  return {
    index: swachtaIndex,
    grade,
    details: {
      detections: detections.length,
      coverage: Math.round(coverageRatio * 100),
      totalPenalty: Math.round(basePenalty),
      uniqueTypes: uniqueClasses
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    const confidence = parseFloat(formData.get('confidence') as string) || 0.25
    const filterLowConfidence = formData.get('filterLowConfidence') === 'true'
    const minObjectSize = parseFloat(formData.get('minObjectSize') as string) || 0.1
    
    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Save uploaded file temporarily
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempPath = path.join(process.cwd(), 'temp', `upload_${Date.now()}.jpg`)
    
    // Ensure temp directory exists
    const tempDir = path.dirname(tempPath)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    fs.writeFileSync(tempPath, buffer)

    // Run Python garbage detection script using conda swach environment
    const pythonScriptPath = path.join(process.cwd(), '..', 'garbage_detection_colab', 'detect_single.py')
    const modelPath = path.join(process.cwd(), '..', 'garbage_detection_colab', 'bestyolov8s.pt')

    return new Promise((resolve) => {
      // Use conda to activate swach environment and run Python script
      const pythonProcess = spawn('/bin/bash', [
        '-c',
        `source ~/mambaforge/etc/profile.d/conda.sh && conda activate swach && python "${pythonScriptPath}" --model "${modelPath}" --image "${tempPath}" --confidence ${confidence} ${filterLowConfidence ? '--filter-low-confidence' : ''} --min-object-size ${minObjectSize}`
      ])

      let output = ''
      let errorOutput = ''

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      pythonProcess.on('close', (code) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempPath)
        } catch (e) {
          console.error('Error cleaning up temp file:', e)
        }

        if (code !== 0) {
          console.error('Python script error:', errorOutput)
          resolve(NextResponse.json({ 
            error: 'Detection failed', 
            details: errorOutput 
          }, { status: 500 }))
          return
        }

        try {
          // Parse Python script output (expecting JSON)
          const result = JSON.parse(output)
          const detections = result.detections || []

          // Calculate Swachta Index
          const swachtaResult = calculateSwachtaIndex(detections)

          resolve(NextResponse.json({
            success: true,
            detections,
            swachtaIndex: swachtaResult.index,
            grade: swachtaResult.grade,
            details: swachtaResult.details,
            summary: {
              totalObjects: detections.length,
              types: [...new Set(detections.map((d: any) => d.class))],
              averageConfidence: detections.length > 0 
                ? Math.round((detections.reduce((sum: number, d: any) => sum + d.confidence, 0) / detections.length) * 100)
                : 0
            }
          }))
        } catch (parseError) {
          console.error('Error parsing detection results:', parseError)
          resolve(NextResponse.json({ 
            error: 'Failed to parse detection results',
            rawOutput: output
          }, { status: 500 }))
        }
      })
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 