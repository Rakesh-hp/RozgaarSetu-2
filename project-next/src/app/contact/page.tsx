'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ContactPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    userType: 'customer'
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        userType: 'customer'
      });
    }, 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const contactMethods = [
    {
      icon: "📞",
      title: "Phone Support",
      details: "+91 98765 43210",
      description: "Mon-Sat, 9:00 AM - 7:00 PM",
      action: "tel:+919876543210"
    },
    {
      icon: "📧",
      title: "Email Support",
      details: "support@rozgaarsetu.com",
      description: "We'll respond within 24 hours",
      action: "mailto:support@rozgaarsetu.com"
    },
    {
      icon: "💬",
      title: "Live Chat",
      details: "Available Now",
      description: "Instant assistance online",
      action: "#"
    },
    {
      icon: "📍",
      title: "Office Address",
      details: "Tech Hub, Bangalore",
      description: "Visit us during business hours",
      action: "#"
    }
  ];

  const faqs = [
    {
      question: "How do I book a service?",
      answer: "Simply browse our service categories, select your needed service, choose a professional, and book instantly through our platform."
    },
    {
      question: "Are all workers verified?",
      answer: "Yes, all our professionals undergo thorough background checks, skill verification, and document validation before joining our platform."
    },
    {
      question: "What if I'm not satisfied with the service?",
      answer: "We offer a satisfaction guarantee. Contact our support team within 24 hours of service completion for resolution."
    },
    {
      question: "How do I become a service provider?",
      answer: "Visit our worker registration page, complete the verification process, and start receiving job requests in your area."
    }
  ];

  return (
    <div className="min-h-screen">
      <Navbar activePage="contact" />

      <div className="max-w-6xl mx-auto pt-32 px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg animate-fade-in-up">
            Get in Touch
          </h1>
          <p className="text-xl text-white/90 drop-shadow-md max-w-3xl mx-auto animate-fade-in-up delay-200">
            Have questions? Need support? We're here to help you every step of the way.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="glass rounded-3xl shadow-xl p-8 mb-12 animate-fade-in-up delay-300">
          <h2 className="text-3xl font-bold text-white mb-8 text-center drop-shadow-lg">Contact Methods</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.action}
                className="glass hover:bg-white/10 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 card-hover block"
              >
                <div className="text-4xl mb-3">{method.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{method.title}</h3>
                <p className="text-blue-300 font-medium mb-1">{method.details}</p>
                <p className="text-white/70 text-sm">{method.description}</p>
              </a>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Form */}
          <div className="glass rounded-3xl shadow-xl p-8 animate-fade-in-up delay-400">
            <h2 className="text-3xl font-bold text-white mb-6 drop-shadow-lg">Send us a Message</h2>
            
            {isSubmitted ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-green-300 mb-2">Message Sent!</h3>
                <p className="text-white/80">Thank you for contacting us. We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 glass text-white placeholder-white/60 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 glass text-white placeholder-white/60 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300"
                      placeholder="Your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 glass text-white placeholder-white/60 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      You are a *
                    </label>
                    <select
                      name="userType"
                      value={formData.userType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 glass text-white rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300"
                    >
                      <option value="customer">Customer</option>
                      <option value="worker">Service Provider</option>
                      <option value="business">Business Partner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 glass text-white placeholder-white/60 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300"
                      placeholder="Subject of your message"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full px-4 py-3 glass text-white placeholder-white/60 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full btn-gradient text-white py-4 px-6 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 transform active:scale-95"
                >
                  <span className="flex items-center justify-center">
                    <span className="text-2xl mr-2">📤</span>
                    Send Message
                  </span>
                </button>
              </form>
            )}
          </div>

          {/* FAQ Section */}
          <div className="glass rounded-3xl shadow-xl p-8 animate-fade-in-up delay-500">
            <h2 className="text-3xl font-bold text-white mb-6 drop-shadow-lg">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="glass-dark rounded-2xl p-4">
                  <h3 className="font-semibold text-white mb-2 flex items-center">
                    <span className="text-blue-300 mr-2">Q:</span>
                    {faq.question}
                  </h3>
                  <p className="text-white/80 text-sm pl-6">{faq.answer}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-white/80 mb-4">Can't find what you're looking for?</p>
              <button className="glass hover:bg-white/10 text-white px-6 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 transform">
                View All FAQs
              </button>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="glass rounded-3xl shadow-xl p-8 mb-12 animate-fade-in-up delay-600">
          <h2 className="text-3xl font-bold text-white mb-6 text-center drop-shadow-lg">Business Hours</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-4">Customer Support</h3>
              <div className="space-y-2 text-white/90">
                <p>Monday - Friday: 9:00 AM - 8:00 PM</p>
                <p>Saturday: 9:00 AM - 6:00 PM</p>
                <p>Sunday: 10:00 AM - 4:00 PM</p>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-4">Service Booking</h3>
              <div className="space-y-2 text-white/90">
                <p>Available 24/7</p>
                <p>Instant booking confirmation</p>
                <p>Emergency services available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="glass rounded-3xl shadow-xl p-8 mb-12 text-center animate-fade-in-up delay-700">
          <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">Ready to Experience Quality Service?</h2>
          <p className="text-white/90 text-lg mb-6">
            Join thousands of satisfied customers and book your service today
          </p>
          <Link
            href="/book-service"
            className="btn-gradient text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 transform inline-block"
          >
            Book Service Now
          </Link>
        </div>
      </div>
    </div>
  );
}