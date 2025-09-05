import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoPath = searchParams.get('path')
    
    if (!videoPath) {
      return NextResponse.json({ error: 'No video path provided' }, { status: 400 })
    }

    // Validate that the path is within our temp directory for security
    const fullPath = path.resolve(videoPath)
    const tempDir = path.resolve(process.cwd(), 'temp')
    
    if (!fullPath.startsWith(tempDir)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 403 })
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'Video file not found' }, { status: 404 })
    }

    // Read the file
    const fileBuffer = fs.readFileSync(fullPath)
    const fileName = path.basename(fullPath)
    
    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Video download error:', error)
    return NextResponse.json({ 
      error: 'Failed to download video', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 