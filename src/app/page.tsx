'use client'

import Link from 'next/link'
import React from 'react'
import { Calendar, FileText, Clock, Shield, Star, Building2, Users, CheckCircle, Phone, Mail, ArrowRight, Globe, Zap, Lock } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ScrollReveal, ScaleReveal } from '@/components/ui/ScrollReveal'

export default function HomePage() {
  // Ensure page scrolls to top on load
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      icon: Calendar,
      title: 'Easy Appointment Booking',
      description: 'Book appointments for government services online, 24/7. No more waiting in long queues.',
    },
    {
      icon: FileText,
      title: 'Document Pre-submission',
      description: 'Upload required documents before your appointment to speed up the process.',
    },
    {
      icon: Clock,
      title: 'Time Saving',
      description: 'Reduce your visit time by up to 90% with our streamlined digital process.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your personal information is protected with bank-level security measures.',
    },
  ]

  const departments = [
    'Department of Motor Traffic',
    'Immigration & Emigration',
    'Registrar General Department',
    'Divisional Secretariat',
    'Department of Inland Revenue',
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Integrated Header */}
      <section className="relative bg-government-dark-blue overflow-hidden min-h-screen flex flex-col">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-government-dark-blue to-blue-900 opacity-90"></div>
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-government-gold rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          </div>
        </div>
        
        {/* Integrated Header */}
        <header className="relative z-10 w-full">
          <div className="w-full px-8 lg:px-12 xl:px-16">
            <div className="flex justify-between items-center py-8 min-h-16">
              {/* Left side - Logo */}
              <div className="flex-shrink-0 animate-fade-in-up">
                <div className="bg-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform">
                  <div className="-mt-8">
                    <Logo size="lg" showText={false} />
                  </div>
                </div>
              </div>
              
              {/* Right side - Navigation and Buttons */}
              <div className="flex items-center space-x-6 flex-shrink-0 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                <nav className="hidden lg:flex items-center space-x-8">
                  <a href="#services" className="text-white/90 hover:text-white font-semibold text-base transition-colors whitespace-nowrap hover:scale-105 transform duration-200">Services</a>
                  <a href="#about" className="text-white/90 hover:text-white font-semibold text-base transition-colors whitespace-nowrap hover:scale-105 transform duration-200">About</a>
                  <a href="#contact" className="text-white/90 hover:text-white font-semibold text-base transition-colors whitespace-nowrap hover:scale-105 transform duration-200">Contact</a>
                </nav>
                <div className="flex items-center space-x-4">
                  <Link
                    href="/auth/login"
                    className="text-white/90 hover:text-white px-6 py-3 rounded-xl text-base font-semibold transition-all duration-200 hover:bg-white/10 backdrop-blur-sm whitespace-nowrap"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center px-6 py-3 border-2 border-white/30 text-base font-semibold rounded-xl shadow-lg text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-government-dark-blue transition-all duration-300 whitespace-nowrap hover:scale-105 transform"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Hero Content */}
        <div className="relative flex-1 flex items-center justify-center w-full px-8 lg:px-12 xl:px-16 py-16">
          <div className="text-center w-full">
            <div className="mb-12 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <span className="inline-flex items-center px-6 py-3 rounded-full text-base font-semibold bg-blue-100 text-blue-800 shadow-lg animate-pulse">
                <Globe className="h-5 w-5 mr-3 animate-spin-slow" />
                Trusted by 50,000+ Sri Lankan Citizens
              </span>
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white mb-12 leading-tight animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              Government Services
              <br />
              <span className="text-government-gold animate-text-shimmer bg-gradient-to-r from-government-gold via-yellow-300 to-government-gold bg-clip-text text-transparent bg-300% animate-shimmer">
                Reimagined
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl lg:text-4xl text-blue-100 mb-16 max-w-5xl mx-auto leading-relaxed font-medium animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              Experience the future of government services with our secure, efficient, and citizen-first digital platform. 
              Book appointments, manage documents, and access services—all from one trusted portal.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-20 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
              <Link
                href="/auth/register"
                className="group inline-flex items-center px-10 py-5 border border-transparent text-xl font-bold rounded-xl text-government-dark-blue bg-white hover:bg-gray-50 hover:scale-105 transition-all duration-300 shadow-2xl animate-bounce-subtle"
              >
                <Calendar className="h-7 w-7 mr-4 group-hover:animate-pulse" />
                Book Your First Appointment
                <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
              
              <Link
                href="#services"
                className="group inline-flex items-center px-10 py-5 border-3 border-white text-white hover:bg-white hover:text-government-dark-blue rounded-xl font-bold text-xl hover:scale-105 transition-all duration-300 shadow-xl"
              >
                <Building2 className="h-7 w-7 mr-4 group-hover:animate-pulse" />
                Explore Services
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 max-w-6xl mx-auto animate-fade-in-up" style={{animationDelay: '1.0s'}}>
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-5xl md:text-6xl font-black text-white mb-3 animate-count-up">90%</div>
                <div className="text-xl text-blue-200 font-semibold">Time Saved</div>
              </div>
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-5xl md:text-6xl font-black text-white mb-3 animate-count-up" style={{animationDelay: '0.2s'}}>24/7</div>
                <div className="text-xl text-blue-200 font-semibold">Online Access</div>
              </div>
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-5xl md:text-6xl font-black text-white mb-3 animate-count-up" style={{animationDelay: '0.4s'}}>15+</div>
                <div className="text-xl text-blue-200 font-semibold">Departments</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-24 bg-gray-50">
        <div className="w-full px-8 lg:px-12 xl:px-16">
          <ScrollReveal direction="up" delay={0.1}>
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-6">
                <Star className="h-4 w-4 mr-2" />
                Trusted Government Platform
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Why Choose SevaNet?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                We're revolutionizing government service delivery with cutting-edge technology, 
                robust security, and citizen-centric design principles.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <ScaleReveal key={index} delay={index * 0.1} initialScale={0.9}>
                <div className="group relative">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-xl hover:border-government-dark-blue transition-all duration-300 h-full">
                    <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-government-dark-blue group-hover:scale-110 transition-all duration-300">
                      <feature.icon className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </ScaleReveal>
            ))}
          </div>
          
          {/* Additional Enhanced Features */}
          <ScrollReveal direction="up" delay={0.2}>
            <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description: "Advanced infrastructure ensures rapid page loads and seamless user experience across all devices and connection speeds.",
                  color: "green"
                },
                {
                  icon: Users,
                  title: "Citizen-Centric", 
                  description: "Designed with extensive user research and feedback from Sri Lankan citizens to ensure intuitive and accessible experience.",
                  color: "purple"
                },
                {
                  icon: Lock,
                  title: "Bank-Level Security",
                  description: "Multi-layered security architecture with end-to-end encryption, ensuring your personal information remains protected.",
                  color: "red"
                }
              ].map((feature, index) => (
                <ScrollReveal key={index} direction="up" delay={0.3 + index * 0.1}>
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300">
                    <div className={`bg-${feature.color}-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6`}>
                      <feature.icon className={`h-8 w-8 text-${feature.color}-600`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Available Departments */}
      <section id="services" className="py-24 bg-white">
        <div className="w-full px-8 lg:px-12 xl:px-16">
          <ScrollReveal direction="up" delay={0.1}>
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-6">
                <Building2 className="h-4 w-4 mr-2" />
                Government Services Available
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Comprehensive Service Coverage
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Access services from major government departments through a single, unified platform designed for efficiency and convenience.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {departments.map((dept, index) => (
              <ScrollReveal key={index} direction="up" delay={0.1 + index * 0.1}>
                <div className="group relative">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-xl hover:border-government-dark-blue transition-all duration-300 h-full">
                    <div className="flex items-center mb-6">
                      <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mr-4 group-hover:bg-government-dark-blue transition-colors">
                        <Building2 className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-government-dark-blue transition-colors">
                          {dept}
                        </h3>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 leading-relaxed mb-6">
                      Access comprehensive services and schedule appointments for all procedures offered by this department.
                    </p>
                    
                    <div className="flex items-center text-government-dark-blue font-medium group-hover:text-blue-800 transition-colors">
                      <span>Explore Services</span>
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal direction="up" delay={0.2}>
            <div className="text-center mt-16">
              <Link
                href="/auth/register"
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl text-white bg-government-dark-blue hover:bg-blue-800 transition-colors shadow-lg"
              >
                <Calendar className="h-6 w-6 mr-3" />
                Start Booking Appointments
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Statistics and Trust Section */}
      <section className="py-24 bg-gradient-to-r from-government-dark-blue to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-government-gold rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        
        <div className="relative w-full px-8 lg:px-12 xl:px-16">
          <ScrollReveal direction="up" delay={0.1}>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Trusted by Sri Lankan Citizens</h2>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Join thousands who have already transformed their government service experience
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { value: "50,000+", label: "Appointments Successfully Booked" },
              { value: "90%", label: "Average Time Saved per Visit" },
              { value: "15+", label: "Government Departments Connected" },
              { value: "99.9%", label: "System Uptime & Reliability" }
            ].map((stat, index) => (
              <ScaleReveal key={index} delay={0.2 + index * 0.1} initialScale={0.8}>
                <div className="text-center">
                  <div className="bg-white bg-opacity-10 rounded-2xl p-6 backdrop-blur-sm hover:bg-opacity-20 transition-all duration-300">
                    <div className="text-4xl md:text-5xl font-bold mb-2 text-government-gold">{stat.value}</div>
                    <div className="text-blue-100 font-medium">{stat.label}</div>
                  </div>
                </div>
              </ScaleReveal>
            ))}
          </div>
          
          <ScrollReveal direction="up" delay={0.6}>
            <div className="mt-16 text-center">
              <div className="flex items-center justify-center space-x-2 text-blue-100">
                <CheckCircle className="h-5 w-5 text-government-gold" />
                <span className="font-medium">Officially endorsed by the Government of Sri Lanka</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-50">
        <div className="w-full px-8 lg:px-12 xl:px-16 max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-government-gold opacity-10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500 opacity-10 rounded-full -ml-20 -mb-20"></div>
            
            <div className="relative">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-government-gold bg-opacity-10 text-government-dark-blue mb-6">
                <Star className="h-4 w-4 mr-2" />
                Start Your Digital Government Journey
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Ready to Experience the Future?
              </h2>
              
              <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                Join thousands of Sri Lankan citizens who have already transformed their government service experience. 
                Create your free account and start booking appointments today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link
                  href="/auth/register"
                  className="group inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl text-white bg-government-dark-blue hover:bg-blue-800 transition-all duration-300 shadow-lg"
                >
                  <Calendar className="h-6 w-6 mr-3" />
                  Create Your Account Today
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link
                  href="/auth/login"
                  className="inline-flex items-center px-8 py-4 border-2 border-government-dark-blue text-government-dark-blue hover:bg-government-dark-blue hover:text-white rounded-xl font-semibold text-lg transition-all duration-300"
                >
                  Sign In to Existing Account
                </Link>
              </div>
              
              <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Free to use</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Secure & private</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>24/7 availability</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white">
        <div className="w-full px-8 lg:px-12 xl:px-16 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center mb-6">
                <Logo size="lg" showText={false} />
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-white">SevaNet</h3>
                  <p className="text-gray-400 text-sm">Government Services Portal</p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">
                Empowering Sri Lankan citizens with seamless access to government services through innovative digital solutions.
              </p>
              <div className="flex items-center space-x-2 text-gray-400">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Secured by Government of Sri Lanka</span>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-bold text-white mb-6">Services</h4>
              <ul className="space-y-3">
                <li><a href="/auth/register" className="text-gray-300 hover:text-white transition-colors flex items-center"><ArrowRight className="h-4 w-4 mr-2" />Book Appointment</a></li>
                <li><a href="#services" className="text-gray-300 hover:text-white transition-colors flex items-center"><ArrowRight className="h-4 w-4 mr-2" />All Departments</a></li>
                <li><a href="/auth/login" className="text-gray-300 hover:text-white transition-colors flex items-center"><ArrowRight className="h-4 w-4 mr-2" />Manage Documents</a></li>
                <li><a href="/auth/login" className="text-gray-300 hover:text-white transition-colors flex items-center"><ArrowRight className="h-4 w-4 mr-2" />Track Appointments</a></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h4 className="text-lg font-bold text-white mb-6">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center"><ArrowRight className="h-4 w-4 mr-2" />Help Center</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center"><ArrowRight className="h-4 w-4 mr-2" />User Guide</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center"><ArrowRight className="h-4 w-4 mr-2" />FAQ</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center"><ArrowRight className="h-4 w-4 mr-2" />System Status</a></li>
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h4 className="text-lg font-bold text-white mb-6">Get in Touch</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-government-dark-blue p-2 rounded-lg mr-4">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-white font-medium">1919</p>
                    <p className="text-gray-400 text-sm">24/7 Helpline (Toll-free)</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-government-dark-blue p-2 rounded-lg mr-4">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-white font-medium">support@sevanet.lk</p>
                    <p className="text-gray-400 text-sm">Email Support</p>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4 mt-6">
                  <p className="text-white font-medium mb-2">Office Hours</p>
                  <p className="text-gray-300 text-sm">Monday - Friday: 8:00 AM - 6:00 PM</p>
                  <p className="text-gray-300 text-sm">Saturday: 9:00 AM - 4:00 PM</p>
                  <p className="text-gray-300 text-sm">Emergency services: 24/7</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-gray-400 text-sm">
                  &copy; 2024 SevaNet - Government Services Portal. All rights reserved.
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Proudly developed for the Government of Sri Lanka
                </p>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Accessibility</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}