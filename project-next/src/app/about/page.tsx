'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AboutPage() {
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const stats = [
    { number: "50K+", label: "Active Workers", icon: "👥" },
    { number: "15K+", label: "Happy Customers", icon: "😊" },
    { number: "25+", label: "Service Categories", icon: "🛠️" },
    { number: "100+", label: "Cities Covered", icon: "🏙️" }
  ];

  const features = [
    {
      title: "Verified Professionals",
      description: "All workers undergo thorough background checks and skill verification",
      icon: "✅"
    },
    {
      title: "Secure Platform",
      description: "End-to-end encryption and secure payment processing",
      icon: "🔒"
    },
    {
      title: "24/7 Support",
      description: "Round-the-clock customer support for all your needs",
      icon: "📞"
    },
    {
      title: "Fair Pricing",
      description: "Transparent pricing with no hidden charges",
      icon: "💰"
    }
  ];

  return (
    <div className="min-h-screen">
      <Navbar activePage="about" />

      <div className="max-w-6xl mx-auto pt-32 px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg animate-fade-in-up">
            About RozgaarSetu
          </h1>
          <p className="text-xl text-white/90 drop-shadow-md max-w-3xl mx-auto animate-fade-in-up delay-200">
            Bridging the gap between skilled professionals and those who need their services. 
            We're transforming how home services work in India.
          </p>
        </div>

        {/* Stats Section */}
        <div className="glass rounded-3xl shadow-xl p-8 mb-12 animate-fade-in-up delay-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredStat(index)}
                onMouseLeave={() => setHoveredStat(null)}
                className={`text-center transform transition-all duration-300 cursor-pointer ${
                  hoveredStat === index ? 'scale-110' : 'hover:scale-105'
                }`}
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Section */}
        <div className="glass rounded-3xl shadow-xl p-8 mb-12 animate-fade-in-up delay-400">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">Our Mission</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-white/90 text-lg mb-6 leading-relaxed">
                At RozgaarSetu, we believe every skilled professional deserves meaningful work opportunities, 
                and every household deserves access to reliable, quality services.
              </p>
              <p className="text-white/90 text-lg leading-relaxed">
                We're not just a platform - we're a community that empowers workers, serves customers, 
                and builds stronger neighborhoods across India.
              </p>
            </div>
            <div className="text-center">
              <div className="text-8xl mb-4">🌟</div>
              <p className="text-white/80 italic">"Empowering skills, enriching lives"</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="glass rounded-3xl shadow-xl p-8 mb-12 animate-fade-in-up delay-500">
          <h2 className="text-3xl font-bold text-white mb-8 text-center drop-shadow-lg">Why Choose Us</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass hover:bg-white/10 rounded-2xl p-6 transition-all duration-300 hover:scale-105 card-hover"
              >
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">{feature.icon}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-white/80">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="glass rounded-3xl shadow-xl p-8 mb-12 text-center animate-fade-in-up delay-500">
          <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">Ready to Get Started?</h2>
          <p className="text-white/90 text-lg mb-6">
            Join thousands of satisfied customers and skilled professionals on our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book-service"
              className="btn-gradient text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 transform"
            >
              Book a Service
            </Link>
            <Link
              href="/contact"
              className="glass hover:bg-white/10 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 transform"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}