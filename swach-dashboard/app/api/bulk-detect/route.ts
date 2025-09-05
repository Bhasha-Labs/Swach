import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const confidence = body.confidence || 0.25
    const filterLowConfidence = body.filterLowConfidence !== false
    const minObjectSize = body.minObjectSize || 0.1
    
    // Run Python bulk detection script
    const pythonScriptPath = path.join(process.cwd(), '..', 'garbage_detection_colab', 'detect_bulk.py')
    const modelPath = path.join(process.cwd(), '..', 'garbage_detection_colab', 'bestyolov8s.pt')
    const testDirectory = path.join(process.cwd(), '..', 'garbage_detection_colab', 'v2_test_img')

    // Check if test directory exists
    if (!fs.existsSync(testDirectory)) {
      return NextResponse.json({ 
        error: 'Test directory not found',
        details: `Directory ${testDirectory} does not exist`
      }, { status: 404 })
    }

    return new Promise((resolve) => {
      const pythonProcess = spawn('/bin/bash', [
        '-c',
        `source ~/mambaforge/etc/profile.d/conda.sh && conda activate swach && python "${pythonScriptPath}" --model "${modelPath}" --directory "${testDirectory}" --confidence ${confidence} --filter-low-confidence ${filterLowConfidence} --min-object-size ${minObjectSize}`
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
        if (code !== 0) {
          console.error('Python bulk script error:', errorOutput)
          resolve(NextResponse.json({ 
            error: 'Bulk processing failed', 
            details: errorOutput 
          }, { status: 500 }))
          return
        }

        try {
          // Parse Python script output
          const result = JSON.parse(output)

          resolve(NextResponse.json({
            success: true,
            ...result
          }))
        } catch (parseError) {
          console.error('Error parsing bulk results:', parseError)
          resolve(NextResponse.json({ 
            error: 'Failed to parse bulk processing results',
            rawOutput: output
          }, { status: 500 }))
        }
      })
    })

  } catch (error) {
    console.error('Bulk API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 