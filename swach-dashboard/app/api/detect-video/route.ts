import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const confidence = parseFloat(formData.get('confidence') as string) || 0.25
    const filterLowConfidence = formData.get('filterLowConfidence') === 'true'
    const minObjectSize = parseFloat(formData.get('minObjectSize') as string) || 0.1
    const speedOption = formData.get('speedOption') as string || 'fast'
    
    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    // Save uploaded video temporarily
    const bytes = await videoFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempVideoPath = path.join(process.cwd(), 'temp', `video_${Date.now()}.mp4`)
    const outputVideoPath = path.join(process.cwd(), 'temp', `video_result_${Date.now()}.mp4`)
    
    // Ensure temp directory exists
    const tempDir = path.dirname(tempVideoPath)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    fs.writeFileSync(tempVideoPath, buffer)

    // Determine frame skip based on speed option
    let frameSkip = 15 // fast
    if (speedOption === 'medium') frameSkip = 10
    if (speedOption === 'full') frameSkip = 1

    // Run Python video detection script
    const pythonScriptPath = path.join(process.cwd(), '..', 'garbage_detection_colab', 'detect_video.py')
    const modelPath = path.join(process.cwd(), '..', 'garbage_detection_colab', 'bestyolov8s.pt')

    return new Promise((resolve) => {
      const pythonProcess = spawn('/bin/bash', [
        '-c',
        `source ~/mambaforge/etc/profile.d/conda.sh && conda activate swach && python "${pythonScriptPath}" --model "${modelPath}" --video "${tempVideoPath}" --output "${outputVideoPath}" --confidence ${confidence} --frame-skip ${frameSkip} --filter-low-confidence ${filterLowConfidence} --min-object-size ${minObjectSize}`
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
        // Clean up temp input video
        try {
          fs.unlinkSync(tempVideoPath)
        } catch (e) {
          console.error('Error cleaning up temp video:', e)
        }

        if (code !== 0) {
          console.error('Python video script error:', errorOutput)
          resolve(NextResponse.json({ 
            error: 'Video analysis failed', 
            details: errorOutput 
          }, { status: 500 }))
          return
        }

        try {
          // Parse Python script output
          const result = JSON.parse(output)
          
          // Add video file path for download
          result.outputVideoPath = outputVideoPath

          resolve(NextResponse.json({
            success: true,
            ...result
          }))
        } catch (parseError) {
          console.error('Error parsing video results:', parseError)
          resolve(NextResponse.json({ 
            error: 'Failed to parse video analysis results',
            rawOutput: output
          }, { status: 500 }))
        }
      })
    })

  } catch (error) {
    console.error('Video API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 