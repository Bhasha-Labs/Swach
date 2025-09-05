import './globals.css'
import type { Metadata } from 'next'
import { DataProvider } from '@/contexts/DataContext'

export const metadata: Metadata = {
  title: 'SWACH Dashboard - Smart Waste & Cleanliness Hygiene',
  description: 'AI-powered environmental monitoring and waste detection dashboard',
  keywords: 'waste detection, AI, environmental monitoring, cleanliness index',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  )
} 