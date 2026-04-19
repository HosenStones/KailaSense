import type { Metadata, Viewport } from 'next'
import { Assistant } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const assistant = Assistant({ 
  subsets: ["latin", "hebrew"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-assistant"
});

export const metadata: Metadata = {
  title: 'Kaila - משוב מטופלים',
  description: 'מערכת משוב חכמה למחלקות בית החולים',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#14b8a6',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl" className="bg-background">
      <body className={`${assistant.className} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

const defaultOptions: QuestionOption[] = [
  { value: '5', label: 'מעולה', emoji: '😍' },
  { value: '4', label: 'טוב', emoji: '😊' },
  { value: '3', label: 'בסדר', emoji: '😐' },
  { value: '2', label: 'לא טוב', emoji: '😟' },
  { value: '1', label: 'גרוע מאוד', emoji: '😡' },
]
