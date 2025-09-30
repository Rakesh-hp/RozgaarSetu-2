'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const { t } = useLanguage();

  const features = [
    {
      title: t('landing.features.trusted.title'),
      description: t('landing.features.trusted.desc'),
      icon: "🏆",
      benefits: ["Verified professionals", "Local workers", "Skill-based matching"],
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: t('landing.features.easy.title'),
      description: t('landing.features.easy.desc'),
      icon: "⚡",
      benefits: ["Quick job posting", "Application management", "Direct communication"],
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: t('landing.features.local.title'),
      description: t('landing.features.local.desc'),
      icon: "🔒",
      benefits: ["User verification", "Secure messaging", "Payment protection"],
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  const workerTypes = [
    "Maid", "Driver", "Carpenter", "Cook", "Gardener", 
    "Electrician", "Plumber", "Painter", "Mechanic"
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      <Navbar activePage="home" />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="space-y-8 relative z-10">
              <div className="animate-fade-in-up">
                <h1 className="text-5xl md:text-7xl font-light text-white tracking-tight leading-tight">
                  Connect. Work.{" "}
                  <span className="text-blue-400 text-shimmer">Grow.</span>
                </h1>
              </div>
              
              <div className="animate-fade-in-up delay-300">
                <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  The modern platform connecting blue-collar workers with opportunities.
                  <br className="hidden md:block" />
                  <span className="text-blue-400 font-medium">
                    Simple, secure, and location-smart.
                  </span>
                </p>
              </div>

              <div className="animate-fade-in-up delay-500">
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                  <Link
                    href="/auth"
                    className="group bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-10 py-4 rounded-full text-lg font-medium transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 text-white"
                  >
                    <span className="relative z-10">{t('landing.hero.cta')}</span>
                  </Link>
                  <button className="group border-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 px-10 py-4 rounded-full text-lg font-medium transform hover:scale-105 transition-all duration-300">
                    <span>Learn More</span>
                  </button>
                </div>
              </div>

              {/* Stats Section */}
              <div className="animate-fade-in-up delay-700 pt-16">
                <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-blue-400 animate-count-up">
                      10K+
                    </div>
                    <div className="text-gray-400">Active Workers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-blue-400 animate-count-up delay-100">
                      5K+
                    </div>
                    <div className="text-gray-400">Jobs Posted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-blue-400 animate-count-up delay-200">
                      50+
                    </div>
                    <div className="text-gray-400">Cities</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose RozgaarSetu Section */}
        <section className="relative mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              Why Choose RozgaarSetu?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Empowering connections between skilled workers and opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group animate-slide-in-left delay-100">
                <div className="card-hover glass p-8 rounded-xl border border-white/10 hover:border-white/20 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-full flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500`}>
                      <span className="text-2xl">{feature.icon}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="relative mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-400">
              Three simple steps to get started
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center animate-fade-in-up delay-100">
              <div className="glass p-8 rounded-xl border border-white/10 h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Create Profile</h3>
                <p className="text-gray-400">Set up your profile with skills, experience, and availability</p>
              </div>
            </div>
            
            <div className="text-center animate-fade-in-up delay-200">
              <div className="glass p-8 rounded-xl border border-white/10 h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Find Opportunities</h3>
                <p className="text-gray-400">Browse and apply for jobs that match your skills and location</p>
              </div>
            </div>
            
            <div className="text-center animate-fade-in-up delay-300">
              <div className="glass p-8 rounded-xl border border-white/10 h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Get Paid</h3>
                <p className="text-gray-400">Complete work and receive secure, instant payments</p>
              </div>
            </div>
          </div>
        </section>

        {/* Service Categories */}
        <section className="relative mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              Popular Services
            </h2>
            <p className="text-xl text-gray-400">
              Find skilled professionals for every need
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {workerTypes.map((type, index) => (
              <div key={type} className={`animate-fade-in-up delay-${(index + 1) * 100}`}>
                <div className="glass card-hover p-6 rounded-xl border border-white/10 hover:border-white/20 text-center">
                  <div className="text-3xl mb-3">
                    {type === 'Maid' && '🧹'}
                    {type === 'Driver' && '🚗'}
                    {type === 'Carpenter' && '�'}
                    {type === 'Cook' && '👨‍🍳'}
                    {type === 'Gardener' && '🌱'}
                    {type === 'Electrician' && '⚡'}
                    {type === 'Plumber' && '🔧'}
                    {type === 'Painter' && '🎨'}
                    {type === 'Mechanic' && '⚙️'}
                  </div>
                  <h3 className="text-white font-medium">{type}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative z-10 space-y-8 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-light text-white">
              Ready to transform your career?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of workers already using RozgaarSetu to find better opportunities and secure their future.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/auth"
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-12 py-4 rounded-full text-lg font-medium transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 text-white"
              >
                Start Today
              </Link>
              <button className="border-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 px-12 py-4 rounded-full text-lg font-medium transform hover:scale-105 transition-all duration-300">
                Learn More
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">RozgaarSetu</h3>
              <p className="text-gray-400 text-sm">
                Connecting blue-collar workers with opportunities across India.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-white font-medium">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Find Jobs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Post Jobs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    How it Works
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-white font-medium">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Safety
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-white font-medium">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 mt-8">
            <p className="text-center text-gray-400 text-sm">
              © 2024 RozgaarSetu. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}