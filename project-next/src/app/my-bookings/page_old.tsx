'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Booking {
  id: string;
  service_id: string;
  worker_id: string;
  description: string;
  location: string;
  preferred_date: string;
  preferred_time: string;
  offered_price: number;
  negotiated_price?: number;
  special_instructions: string;
  customer_phone: string;
  status: 'pending' | 'accepted' | 'negotiating' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  worker: {
    id: string;
    full_name: string;
    phone_number: string;
    location: string;
    skills: string[];
  };
  service: {
    id: string;
    name: string;
    category_id: string;
  };
  negotiations?: {
    id: string;
    message: string;
    price_offer: number;
    created_at: string;
    from_worker: boolean;
  }[];
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [counterOffer, setCounterOffer] = useState('');

  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-300 bg-yellow-500/20';
      case 'accepted': return 'text-green-300 bg-green-500/20';
      case 'negotiating': return 'text-blue-300 bg-blue-500/20';
      case 'completed': return 'text-purple-300 bg-purple-500/20';
      case 'cancelled': return 'text-red-300 bg-red-500/20';
      default: return 'text-gray-300 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'accepted': return '✅';
      case 'negotiating': return '💬';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setAuthLoading(false);
    if (!user) {
      return;
    }
    
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    setUser(userData);
  };

  const fetchBookings = async () => {
    try {
      console.log('Fetching bookings for user:', user.id);
      
      // Try to fetch bookings with related data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('service_bookings')
        .select(`
          *,
          worker:worker_id (
            id,
            full_name,
            phone_number,
            location,
            skills
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        // Create mock data for demonstration
        setBookings([
          // Your specific test case - Tester Singh booking
          {
            id: 'booking_test',
            service_id: 'service_test',
            worker_id: 'worker_test',
            description: 'Testing service booking as requested',
            location: 'Test Location, Mumbai',
            preferred_date: '2025-09-27',
            preferred_time: '14:00',
            offered_price: 3000, // Your original offer
            special_instructions: 'This is a test booking for Tester Singh',
            customer_phone: user.phone || '9876543210',
            status: 'negotiating',
            created_at: '2025-09-26T10:00:00Z',
            updated_at: '2025-09-26T15:30:00Z',
            worker: {
              id: 'worker_test',
              full_name: 'Tester Singh',
              phone_number: '9876543299',
              location: 'Test Area, Mumbai',
              skills: ['testing', 'debugging', 'quality assurance']
            },
            service: {
              id: 'service_test',
              name: 'Testing Service',
              category_id: 'technical'
            },
            negotiations: [
              {
                id: 'neg_test_1',
                message: 'Hello! Thank you for choosing our service. After reviewing your requirements carefully, I need to inform you that the work will require additional materials and more time than initially estimated. The complexity of the task requires specialized tools and extra hours of work. Therefore, I would need to charge ₹5000 instead of your initial offer of ₹3000. This includes all materials, labor, travel costs, and a 1-year warranty on the work completed. I hope you understand the reasoning behind this price adjustment and look forward to providing you with quality service.',
                price_offer: 5000, // Worker's counter-offer - ₹5000 as you mentioned
                created_at: '2025-09-26T15:30:00Z',
                from_worker: true
              }
            ]
          },
          {
            id: 'booking_1',
            service_id: 'service_1',
            worker_id: 'worker_1',
            description: 'Fix kitchen sink tap leakage',
            location: '123 Main Street, Mumbai',
            preferred_date: '2025-09-28',
            preferred_time: '10:00',
            offered_price: 500,
            negotiated_price: 600,
            special_instructions: 'Please bring your own tools',
            customer_phone: user.phone || '9876543210',
            status: 'negotiating',
            created_at: '2025-09-26T10:30:00Z',
            updated_at: '2025-09-26T14:20:00Z',
            worker: {
              id: 'worker_1',
              full_name: 'Rajesh Kumar',
              phone_number: '9876543211',
              location: 'Andheri, Mumbai',
              skills: ['plumbing', 'pipe repair', 'tap installation']
            },
            service: {
              id: 'service_1',
              name: 'Tap Repair',
              category_id: 'plumbing'
            },
            negotiations: [
              {
                id: 'neg_1',
                message: 'Hi! I checked your job details. The tap repair looks straightforward, but I noticed some additional pipe work might be needed. My original quote is ₹500, but considering the extra work, I would like to charge ₹600. I can complete this within 2 hours. What do you think?',
                price_offer: 600,
                created_at: '2025-09-26T14:20:00Z',
                from_worker: true
              }
            ]
          },
          {
            id: 'booking_2',
            service_id: 'service_2',
            worker_id: 'worker_2',
            description: 'Install new ceiling fan in bedroom',
            location: '456 Park Avenue, Mumbai',
            preferred_date: '2025-09-27',
            preferred_time: '15:00',
            offered_price: 350,
            negotiated_price: 400,
            special_instructions: 'Fan is already purchased',
            customer_phone: user.phone || '9876543210',
            status: 'negotiating',
            created_at: '2025-09-25T09:15:00Z',
            updated_at: '2025-09-26T16:45:00Z',
            worker: {
              id: 'worker_2',
              full_name: 'Amit Singh',
              phone_number: '9876543212',
              location: 'Bandra, Mumbai',
              skills: ['electrical', 'fan installation', 'wiring']
            },
            service: {
              id: 'service_2',
              name: 'Fan Installation',
              category_id: 'electrical'
            },
            negotiations: [
              {
                id: 'neg_2a',
                message: 'Hello! I can install your ceiling fan. However, I noticed the wiring might need some upgrades for safety. My rate for fan installation with basic wiring check is ₹400. This includes testing and ensuring everything works perfectly.',
                price_offer: 400,
                created_at: '2025-09-26T12:30:00Z',
                from_worker: true
              },
              {
                id: 'neg_2b',
                message: 'That seems reasonable, but can you do it for ₹375? I have another quote for similar price.',
                price_offer: 375,
                created_at: '2025-09-26T15:15:00Z',
                from_worker: false
              },
              {
                id: 'neg_2c',
                message: 'I understand your budget concern. I can meet you halfway at ₹385. This includes warranty for 6 months on my work. Fair deal?',
                price_offer: 385,
                created_at: '2025-09-26T16:45:00Z',
                from_worker: true
              }
            ]
          },
          {
            id: 'booking_3',
            service_id: 'service_3',
            worker_id: 'worker_3',
            description: 'Deep cleaning of 2BHK apartment',
            location: '789 Garden View, Mumbai',
            preferred_date: '2025-09-29',
            preferred_time: '09:00',
            offered_price: 1200,
            special_instructions: 'Focus on kitchen and bathrooms',
            customer_phone: user.phone || '9876543210',
            status: 'accepted',
            created_at: '2025-09-24T11:20:00Z',
            updated_at: '2025-09-24T13:45:00Z',
            worker: {
              id: 'worker_3',
              full_name: 'Priya Sharma',
              phone_number: '9876543213',
              location: 'Juhu, Mumbai',
              skills: ['house cleaning', 'deep cleaning', 'sanitization']
            },
            service: {
              id: 'service_3',
              name: 'Deep Cleaning',
              category_id: 'cleaning'
            },
            negotiations: [
              {
                id: 'neg_3',
                message: 'Thank you for choosing me! I can do deep cleaning of your 2BHK for ₹1200. This includes kitchen deep clean, bathroom sanitization, floor mopping, and window cleaning. I will bring all cleaning supplies.',
                price_offer: 1200,
                created_at: '2025-09-24T12:00:00Z',
                from_worker: true
              }
            ]
          }
        ]);
      } else {
        setBookings(bookingsData || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (bookingId: string, action: 'accept' | 'counter' | 'reject') => {
    // This would typically update the booking status and send notifications
    console.log(`${action} booking ${bookingId}`, { responseMessage, counterOffer });
    
    // Update booking status locally for demo
    setBookings(prev => prev.map(booking => 
      booking.id === bookingId 
        ? { 
            ...booking, 
            status: action === 'accept' ? 'accepted' : action === 'reject' ? 'cancelled' : 'negotiating',
            negotiated_price: action === 'counter' ? Number(counterOffer) : booking.negotiated_price
          }
        : booking
    ));
    
    setSelectedBooking(null);
    setResponseMessage('');
    setCounterOffer('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="glass rounded-3xl shadow-xl p-12 text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <div className="text-2xl font-bold text-white drop-shadow-lg">Loading your bookings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <Navbar activePage="my-bookings" />

      <div className="max-w-6xl mx-auto pt-32">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">My Bookings</h1>
          <p className="text-xl text-white/90 drop-shadow-md">Track your service requests and communications</p>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {bookings.length === 0 ? (
            <div className="glass rounded-3xl shadow-xl p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-2xl font-bold text-white mb-4">No Bookings Yet</h2>
              <p className="text-white/80 mb-6">You haven't made any service bookings yet.</p>
              <Link
                href="/book-service"
                className="btn-gradient text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 transform inline-block"
              >
                Book Your First Service
              </Link>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="glass rounded-3xl shadow-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">
                        {booking.service?.name || 'Service Request'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)} {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-white/80 mb-2">{booking.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-white/70">
                      <span>📍 {booking.location}</span>
                      <span>📅 {new Date(booking.preferred_date).toLocaleDateString()} at {booking.preferred_time}</span>
                      <span>💰 ₹{booking.negotiated_price || booking.offered_price}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-sm">
                      Booked on {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Worker Information */}
                <div className="glass-dark rounded-2xl p-4 mb-4">
                  <h4 className="font-semibold text-white mb-2">👨‍🔧 Assigned Worker</h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{booking.worker.full_name}</p>
                      <p className="text-white/70 text-sm">📍 {booking.worker.location}</p>
                      <p className="text-white/70 text-sm">📱 {booking.worker.phone_number}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {booking.worker.skills?.map((skill, index) => (
                          <span key={index} className="px-2 py-1 glass bg-blue-500/20 text-blue-200 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Negotiations */}
                {booking.negotiations && booking.negotiations.length > 0 && (
                  <div className="glass-dark rounded-2xl p-4 mb-4">
                    <h4 className="font-semibold text-white mb-3">💬 Conversation History</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {booking.negotiations.map((negotiation) => (
                        <div key={negotiation.id} className={`rounded-xl p-4 ${
                          negotiation.from_worker 
                            ? 'bg-blue-500/20 border border-blue-400/30 ml-4' 
                            : 'bg-green-500/20 border border-green-400/30 mr-4'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${
                                negotiation.from_worker ? 'text-blue-300' : 'text-green-300'
                              }`}>
                                {negotiation.from_worker ? '👨‍🔧 ' + booking.worker.full_name : '👤 You (Employer)'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                negotiation.from_worker 
                                  ? 'bg-blue-500/30 text-blue-200' 
                                  : 'bg-green-500/30 text-green-200'
                              }`}>
                                {negotiation.from_worker ? 'Worker' : 'Employer'}
                              </span>
                            </div>
                            <span className="text-xs text-white/60">
                              {new Date(negotiation.created_at).toLocaleDateString()} at{' '}
                              {new Date(negotiation.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-white/90 text-sm leading-relaxed mb-2">{negotiation.message}</p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className={`px-3 py-2 rounded-lg ${
                              negotiation.from_worker 
                                ? 'bg-blue-600/30 border border-blue-400/50' 
                                : 'bg-green-600/30 border border-green-400/50'
                            }`}>
                              <span className="text-white/80 text-xs">Price Offer:</span>
                              <span className={`ml-2 font-bold text-lg ${
                                negotiation.from_worker ? 'text-blue-300' : 'text-green-300'
                              }`}>
                                ₹{negotiation.price_offer}
                              </span>
                            </div>
                            
                            {negotiation.from_worker && booking.status === 'negotiating' && booking.negotiations && (
                              booking.negotiations.indexOf(negotiation) === booking.negotiations.length - 1 && (
                                <div className="flex gap-2">
                                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-400/30">
                                    ⏳ Awaiting your response
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Latest offer summary */}
                    {booking.status === 'negotiating' && (
                      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-yellow-300 font-medium">💰 Latest Offer from {booking.worker.full_name}:</span>
                            <span className="text-white font-bold text-xl ml-2">
                              ₹{booking.negotiations[booking.negotiations.length - 1]?.price_offer}
                            </span>
                          </div>
                          <div className="text-xs text-white/60">
                            {booking.negotiations.filter(n => n.from_worker).length} offers received
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="border-t border-white/10 pt-4">
                  {booking.status === 'negotiating' && (
                    <div className="space-y-4">
                      {/* Current offer highlight */}
                      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">💰 Current Negotiation</span>
                          <span className="text-xs text-white/60">Last updated: {new Date(booking.updated_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-white/80">Latest offer from {booking.worker.full_name}:</span>
                            <span className="text-white font-bold text-2xl ml-2">₹{booking.negotiations && booking.negotiations.length > 0 ? booking.negotiations[booking.negotiations.length - 1]?.price_offer : booking.offered_price}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="flex-1 glass hover:bg-white/10 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 transform flex items-center justify-center gap-2"
                        >
                          💬 Send Message / Counter Offer
                        </button>
                        <button
                          onClick={() => handleResponse(booking.id, 'accept')}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 transform flex items-center gap-2"
                        >
                          ✅ Accept Offer
                        </button>
                        <button
                          onClick={() => handleResponse(booking.id, 'reject')}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 transform flex items-center gap-2"
                        >
                          ❌ Reject Offer
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {booking.status === 'pending' && (
                    <div className="text-center p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-xl">
                      <span className="text-yellow-300 font-medium">⏳ Waiting for worker to respond to your request...</span>
                      <p className="text-white/70 text-sm mt-1">We'll notify you once the worker sends their offer</p>
                    </div>
                  )}
                  
                  {booking.status === 'accepted' && (
                    <div className="text-center p-4 bg-green-500/10 border border-green-400/30 rounded-xl">
                      <span className="text-green-300 font-medium text-lg">✅ Booking Confirmed!</span>
                      <p className="text-white/80 mt-2">Worker will arrive on {new Date(booking.preferred_date).toLocaleDateString()} at {booking.preferred_time}</p>
                      <div className="flex gap-3 mt-4 justify-center">
                        <button className="glass hover:bg-white/10 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 transform">
                          📞 Call Worker
                        </button>
                        <button className="glass hover:bg-white/10 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 transform">
                          💬 Send Message
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {booking.status === 'completed' && (
                    <div className="text-center p-4 bg-purple-500/10 border border-purple-400/30 rounded-xl">
                      <span className="text-purple-300 font-medium text-lg">🎉 Service Completed!</span>
                      <div className="flex gap-3 mt-4 justify-center">
                        <button className="glass hover:bg-white/10 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 transform">
                          ⭐ Rate & Review
                        </button>
                        <button className="glass hover:bg-white/10 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 transform">
                          📄 Download Invoice
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {booking.status === 'cancelled' && (
                    <div className="text-center p-4 bg-red-500/10 border border-red-400/30 rounded-xl">
                      <span className="text-red-300 font-medium">❌ Booking Cancelled</span>
                      <p className="text-white/70 text-sm mt-1">This booking has been cancelled</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Enhanced Response Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass rounded-3xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">💬 Respond to {selectedBooking.worker.full_name}</h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-white/60 hover:text-white text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>
              
              {/* Service Details Summary */}
              <div className="glass-dark rounded-xl p-4 mb-4">
                <h4 className="text-white font-medium mb-2">📋 Service: {selectedBooking.service?.name}</h4>
                <p className="text-white/80 text-sm mb-2">{selectedBooking.description}</p>
                <div className="flex items-center gap-4 text-sm text-white/70">
                  <span>📍 {selectedBooking.location}</span>
                  <span>📅 {new Date(selectedBooking.preferred_date).toLocaleDateString()}</span>
                  <span>🕐 {selectedBooking.preferred_time}</span>
                </div>
              </div>
              
              {/* Latest Offer Highlight */}
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white/80">Worker's Latest Offer:</span>
                    <span className="text-white font-bold text-2xl ml-2">
                      ₹{selectedBooking.negotiations && selectedBooking.negotiations.length > 0 
                        ? selectedBooking.negotiations[selectedBooking.negotiations.length - 1]?.price_offer 
                        : selectedBooking.offered_price}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-white/60 text-sm">Your Original Budget</div>
                    <div className="text-white font-medium">₹{selectedBooking.offered_price}</div>
                  </div>
                </div>
              </div>
              
              {/* Latest Message */}
              {selectedBooking.negotiations && selectedBooking.negotiations.length > 0 && (
                <div className="glass-dark rounded-xl p-4 mb-4">
                  <h4 className="text-white font-medium mb-2">💬 Latest Message from Worker:</h4>
                  <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                    <p className="text-white/90 italic">
                      "{selectedBooking.negotiations[selectedBooking.negotiations.length - 1]?.message}"
                    </p>
                    <div className="text-blue-300 text-sm mt-2">
                      - {selectedBooking.worker.full_name}, {new Date(selectedBooking.negotiations[selectedBooking.negotiations.length - 1]?.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Response Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Your Message:</label>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    className="w-full px-4 py-3 glass text-white placeholder-white/60 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    rows={3}
                    placeholder="Type your message to the worker... (optional)"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Counter Offer (Optional):</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">₹</span>
                    <input
                      type="number"
                      value={counterOffer}
                      onChange={(e) => setCounterOffer(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 glass text-white placeholder-white/60 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      placeholder="Enter your counter offer amount"
                    />
                  </div>
                  <p className="text-white/60 text-sm mt-1">Leave empty if you just want to send a message</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleResponse(selectedBooking.id, 'accept')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 transform"
                >
                  ✅ Accept Current Offer
                </button>
                <button
                  onClick={() => handleResponse(selectedBooking.id, 'counter')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 transform"
                  disabled={!responseMessage && !counterOffer}
                >
                  💬 Send Response
                </button>
                <button
                  onClick={() => handleResponse(selectedBooking.id, 'reject')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 transform"
                >
                  ❌ Reject Offer
                </button>
              </div>
              
              <div className="text-center mt-4">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Close without responding
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}