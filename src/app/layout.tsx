import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/auth/AuthProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'SevaNet - Government Services Portal',
    template: '%s | SevaNet'
  },
  description: 'Streamlined government service appointments for Sri Lankan citizens. Book appointments, upload documents, and track your applications online.',
  keywords: ['government services', 'Sri Lanka', 'appointments', 'online booking', 'digital services'],
  authors: [{ name: 'SevaNet Team' }],
  creator: 'SevaNet',
  publisher: 'Government of Sri Lanka',
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sevanet.lk',
    title: 'SevaNet - Government Services Portal',
    description: 'Streamlined government service appointments for Sri Lankan citizens',
    siteName: 'SevaNet',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SevaNet - Government Services Portal',
    description: 'Streamlined government service appointments for Sri Lankan citizens',
    images: ['/logo.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}