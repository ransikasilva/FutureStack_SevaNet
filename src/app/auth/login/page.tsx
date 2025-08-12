import { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { Logo } from '@/components/ui/Logo'

export const metadata: Metadata = {
  title: 'Sign In - SevaNet',
  description: 'Sign in to your SevaNet account to book government service appointments.',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto flex justify-center">
            <Logo size="lg" showText={false} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to SevaNet
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access government services with ease
          </p>
        </div>

        <div className="card">
          <LoginForm />
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            New to SevaNet?{' '}
            <Link
              href="/auth/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}