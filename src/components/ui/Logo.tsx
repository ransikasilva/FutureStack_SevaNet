'use client'

import Image from 'next/image'
import { Building2 } from 'lucide-react'
import { useState } from 'react'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  textClassName?: string
}

export function Logo({ 
  className = '', 
  size = 'md', 
  showText = true, 
  textClassName = '' 
}: LogoProps) {
  const [imageError, setImageError] = useState(false)
  
  const sizeClasses = {
    sm: 'h-10 w-auto',
    md: 'h-12 w-auto', 
    lg: 'h-16 w-auto'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        {!imageError ? (
          <Image
            src="/logo.png"
            alt="SevaNet Logo"
            width={size === 'sm' ? 120 : size === 'md' ? 150 : 200}
            height={size === 'sm' ? 40 : size === 'md' ? 48 : 64}
            className="object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <Building2 className="h-full w-full text-primary-600" />
        )}
      </div>
      
      {showText && (
        <span className={`ml-2 font-bold ${textSizeClasses[size]} ${textClassName || 'text-gray-900'}`}>
          SevaNet
        </span>
      )}
    </div>
  )
}

// Simple icon-only logo for fallback
export function LogoIcon({ className = '', size = 'md' }: { className?: string, size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <Building2 className={`text-primary-600 ${sizeClasses[size]} ${className}`} />
  )
}