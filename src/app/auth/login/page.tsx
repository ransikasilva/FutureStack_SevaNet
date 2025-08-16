'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'
import { Logo } from '@/components/ui/Logo'
import { Mail, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const message = searchParams?.get('message')
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen flex">
        {/* Left side - Government branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-white relative">
          <div className="relative flex flex-col justify-center items-center px-16 w-full">
            <div className="max-w-2xl w-full text-center">
              <div className="mb-10 flex justify-center">
                <Logo size="lg" showText={false} className="scale-125" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight text-center">
                Government Services Portal
              </h1>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed text-center">
                Secure access to all Sri Lankan government services. 
                Book appointments, submit documents, and track your applications online.
              </p>
              <div className="space-y-5 flex flex-col items-center">
                <div className="flex items-center space-x-3 text-gray-700 text-lg">
                  <div className="w-2.5 h-2.5 bg-government-gold rounded-full flex-shrink-0"></div>
                  <span className="font-medium">256-bit SSL Encryption</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 text-lg">
                  <div className="w-2.5 h-2.5 bg-government-gold rounded-full flex-shrink-0"></div>
                  <span className="font-medium">Government Certified Platform</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 text-lg">
                  <div className="w-2.5 h-2.5 bg-government-gold rounded-full flex-shrink-0"></div>
                  <span className="font-medium">24/7 Secure Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-government-dark-blue">
          <div className="mx-auto w-full max-w-xl">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8 text-center">
              <Logo size="lg" showText={false} />
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm text-blue-100">
                Access your government services dashboard
              </p>
            </div>

            <div>
              {message && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        Check Your Email for Verification
                      </h3>
                      <p className="text-blue-800 mb-3">
                        We've sent a verification link to your email address. Please check your email and click the verification link to activate your account.
                      </p>
                      <div className="space-y-2 text-sm text-blue-700">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Check your inbox and spam/junk folder</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Click the verification link in the email</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Return here to sign in after verification</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white py-8 px-8 shadow-xl rounded-xl border border-gray-200">
                <LoginForm />
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-blue-100">
                New to SevaNet?{' '}
                <Link
                  href="/auth/register"
                  className="font-medium text-government-gold hover:text-yellow-300 underline"
                >
                  Create an account
                </Link>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-blue-700">
              <p className="text-xs text-blue-200 text-center">
                🛡️ Secured by Government of Sri Lanka • All data encrypted and protected
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}