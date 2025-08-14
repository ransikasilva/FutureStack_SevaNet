import { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { Logo } from '@/components/ui/Logo'

export const metadata: Metadata = {
  title: 'Register - SevaNet',
  description: 'Create your SevaNet account to start booking government service appointments.',
}

export default function RegisterPage() {
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
                Create Your Account
              </h1>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed text-center">
                Join thousands of Sri Lankan citizens who have simplified their 
                government service experience.
              </p>
              <div className="space-y-5 flex flex-col items-center">
                <div className="flex items-center space-x-3 text-gray-700 text-lg">
                  <div className="w-2.5 h-2.5 bg-government-gold rounded-full flex-shrink-0"></div>
                  <span className="font-medium">Free Account Registration</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 text-lg">
                  <div className="w-2.5 h-2.5 bg-government-gold rounded-full flex-shrink-0"></div>
                  <span className="font-medium">Access All Government Services</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 text-lg">
                  <div className="w-2.5 h-2.5 bg-government-gold rounded-full flex-shrink-0"></div>
                  <span className="font-medium">Secure Document Management</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Registration form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-government-dark-blue">
          <div className="mx-auto w-full max-w-2xl">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8 text-center">
              <Logo size="lg" showText={false} />
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-blue-100">
                Start your digital government services journey
              </p>
            </div>

            <div>
              <div className="bg-white py-8 px-8 shadow-xl rounded-xl border border-gray-200">
                <RegisterForm />
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-blue-100">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="font-medium text-government-gold hover:text-yellow-300 underline"
                >
                  Sign in here
                </Link>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-blue-700">
              <p className="text-xs text-blue-200 text-center">
                🛡️ Your data is protected by Government of Sri Lanka security standards
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}