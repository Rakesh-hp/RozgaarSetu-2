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
  customer_id: string;
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
  worker?: {
    id: string;
    full_name: string;
    phone_number: string;
    location: string;
    skills: string[];
  };
  service?: {
    id: string;
    name: string;
    category_id: string;
  };
  negotiations?: {
    id: string;
    booking_id: string;
    sender_id: string;
    message_type: string;
    proposed_price: number;
    message: string;
    created_at: string;
    from_worker?: boolean; // derived field
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

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const initBookings = async () => {
      try {
        // Set timeout to prevent infinite loading
        setTimeout(() => {
          if (mounted) {
            setLoading(false);
            setAuthLoading(false);
          }
        }, 8000);

        const { data: { user } } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (!user) {
          router.push('/auth');
          return;
        }

        setUser(user);
        setAuthLoading(false);
        
        await fetchBookings(user.id);
        
      } catch (error) {
        console.error('My bookings init error:', error);
        if (mounted) {
          setAuthLoading(false);
          setLoading(false);
        }
      }
    };

    initBookings();

    return () => {
      mounted = false;
    };
  }, [supabase, router]);

  const fetchBookings = async (userId: string) => {
    try {
      setLoading(true);
      
      // Simplified booking fetch with timeout
      const bookingPromise = supabase
        .from('service_bookings')
        .select(`
          *,
          worker:worker_id (
            id,
            full_name,
            phone_number,
            location,
            skills
          ),
          service:service_id (
            id,
            name,
            category_id
          )
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Booking fetch timeout')), 5000)
      );

      const { data: bookingsData, error } = await Promise.race([
        bookingPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('Error fetching bookings:', error);
        setBookings([]);
      } else {
        // Simplified - just use the booking data without complex negotiations
        setBookings(bookingsData || []);
      }
      
    } catch (error) {
      console.error('Fetch bookings error:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (bookingId: string, action: 'accept' | 'counter' | 'reject') => {
    // Ask for confirmation before proceeding
    let confirmationMessage = '';
    if (action === 'accept') {
      confirmationMessage = `Are you sure you want to ACCEPT this booking? This action will confirm the service request and the worker will proceed with the job.`;
    } else if (action === 'reject') {
      confirmationMessage = `Are you sure you want to REJECT this booking? This action cannot be undone and will cancel the service request.`;
    }
    
    if (confirmationMessage && !window.confirm(confirmationMessage)) {
      return; // User cancelled the action
    }

    try {
      console.log(`${action} booking ${bookingId}`, { responseMessage, counterOffer });
      
      if (action === 'accept') {
        // Update booking status to accepted
        const { error } = await supabase
          .from('service_bookings')
          .update({ 
            status: 'accepted',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId);

        if (error) {
          console.error('Error updating booking status:', error.message || error);
          alert('Failed to accept booking. Please try again.');
          return;
        }

        // Add a negotiation entry to record the acceptance
        if (responseMessage) {
          const { error: negotiationError } = await supabase
            .from('booking_negotiations')
            .insert({
              booking_id: bookingId,
              sender_id: user.id,
              message_type: 'acceptance',
              message: responseMessage,
              proposed_price: selectedBooking?.negotiations?.length ? 
                selectedBooking.negotiations[selectedBooking.negotiations.length - 1].proposed_price :
                selectedBooking?.offered_price
            });

          if (negotiationError) {
            console.error('Error adding acceptance message:', negotiationError.message || negotiationError);
          }
        }

      } else if (action === 'counter' && (responseMessage || counterOffer)) {
        // Add counter negotiation
        const { error } = await supabase
          .from('booking_negotiations')
          .insert({
            booking_id: bookingId,
            sender_id: user.id,
            message_type: 'price_offer',
            message: responseMessage || 'Counter offer',
            proposed_price: counterOffer ? parseInt(counterOffer) : 
              (selectedBooking?.negotiations?.length ? 
                selectedBooking.negotiations[selectedBooking.negotiations.length - 1].proposed_price :
                selectedBooking?.offered_price)
          });

        if (error) {
          console.error('Error adding negotiation:', error.message || error);
          alert('Failed to send counter offer. Please try again.');
          return;
        }

        // Update booking status to negotiating if it isn't already
        const { error: statusError } = await supabase
          .from('service_bookings')
          .update({ 
            status: 'negotiating',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId);

        if (statusError) {
          console.error('Error updating booking status:', statusError.message || statusError);
        }

      } else if (action === 'reject') {
        // Update booking status to cancelled
        const { error } = await supabase
          .from('service_bookings')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId);

        if (error) {
          console.error('Error updating booking status:', error.message || error);
          alert('Failed to reject booking. Please try again.');
          return;
        }

        // Add rejection message if provided
        if (responseMessage) {
          const { error: negotiationError } = await supabase
            .from('booking_negotiations')
            .insert({
              booking_id: bookingId,
              sender_id: user.id,
              message_type: 'rejection',
              message: responseMessage,
              proposed_price: selectedBooking?.negotiations?.length ? 
                selectedBooking.negotiations[selectedBooking.negotiations.length - 1].proposed_price :
                selectedBooking?.offered_price
            });

          if (negotiationError) {
            console.error('Error adding rejection message:', negotiationError.message || negotiationError);
          }
        }
      }

      // Refresh bookings data
      if (user) {
        await fetchBookings(user.id);
      }
      
      // Close modal and reset form
      setSelectedBooking(null);
      setResponseMessage('');
      setCounterOffer('');
      
    } catch (error) {
      console.error('Error handling response:', error instanceof Error ? error.message : String(error));
      alert('An error occurred. Please try again.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Navbar activePage="my-bookings" />
        
        {/* Loading Screen */}
        <div className="max-w-6xl mx-auto pt-32 px-4">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="glass rounded-3xl shadow-xl p-12 text-center max-w-md mx-auto">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">Loading Your Bookings</h2>
              <p className="text-white/80 drop-shadow-md">Please wait while we fetch your service requests...</p>
              <div className="mt-6 flex justify-center space-x-1">
                <div className="h-2 w-2 bg-white/60 rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-white/60 rounded-full animate-bounce delay-100"></div>
                <div className="h-2 w-2 bg-white/60 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar activePage="my-bookings" />
        
        {/* Authentication Required Screen */}
        <div className="max-w-6xl mx-auto pt-32 px-4">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="glass rounded-3xl shadow-xl p-8 text-center max-w-md mx-auto">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">Authentication Required</h2>
              <p className="text-white/80 mb-6 drop-shadow-md">Please sign in to view your bookings.</p>
              <Link
                href="/auth"
                className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-8 py-3 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar activePage="my-bookings" />

      <div className="max-w-6xl mx-auto pt-32 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg animate-fade-in-up">
            📋 My Bookings
          </h1>
          <p className="text-xl text-white/90 drop-shadow-md animate-fade-in-up delay-200">
            Track and manage your service requests and negotiations
          </p>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="glass rounded-3xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-6">📭</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Bookings Yet</h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto">
              You haven't made any service bookings yet. Start by browsing our available services.
            </p>
            <Link
              href="/book-service"
              className="btn-gradient text-white px-8 py-3 rounded-full hover:shadow-lg font-medium transition-all duration-300 hover:scale-105 transform inline-block"
            >
              Book a Service
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking, index) => (
              <div 
                key={booking.id} 
                className={`glass rounded-3xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] animate-fade-in-up`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">
                        {booking.service?.name || 'Service'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                        booking.status === 'accepted' ? 'bg-green-500/20 text-green-300' :
                        booking.status === 'negotiating' ? 'bg-blue-500/20 text-blue-300' :
                        booking.status === 'completed' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-white/80 mb-3">{booking.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-white/70 mb-3">
                      <span>👨‍🔧 {booking.worker?.full_name || 'Worker'}</span>
                      <span>📍 {booking.location}</span>
                      <span>📅 {new Date(booking.preferred_date).toLocaleDateString()}</span>
                      <span>🕐 {booking.preferred_time}</span>
                    </div>
                  </div>
                </div>

                {/* Negotiations */}
                {booking.negotiations && booking.negotiations.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-4 mb-4">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      💬 Negotiations 
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                        {booking.negotiations.length} messages
                      </span>
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {booking.negotiations.map((negotiation) => (
                        <div 
                          key={negotiation.id} 
                          className={`p-3 rounded-lg ${
                            negotiation.from_worker 
                              ? 'bg-blue-500/20 border border-blue-400/30 ml-4' 
                              : 'bg-green-500/20 border border-green-400/30 mr-4'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs text-white/60">
                              {negotiation.from_worker ? '👨‍🔧 Worker' : '👤 You'}
                            </span>
                            <span className="text-xs text-white/60">
                              {new Date(negotiation.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-white/90 text-sm mb-2">{negotiation.message}</p>
                          <div className="text-white font-bold">₹{negotiation.proposed_price}</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Show response button only for latest worker message */}
                    {booking.negotiations.some(n => n.from_worker) && booking.status === 'negotiating' && (
                      booking.negotiations.findIndex(n => n.from_worker) === 
                      booking.negotiations.map((n, i) => n.from_worker ? i : -1).filter(i => i !== -1).pop()
                    ) && (
                      <div className="mt-4 flex justify-between items-center">
                        <div>
                          <span className="text-white/80">Latest Worker Offer:</span>
                          <span className="text-white font-bold text-xl ml-2">
                            ₹{booking.negotiations.filter(n => n.from_worker).pop()?.proposed_price}
                          </span>
                          <div className="text-white/60 text-sm mt-1">
                            {booking.negotiations.filter(n => n.from_worker).length} offers received
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 transform"
                        >
                          💬 Respond
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Price Info */}
                <div className="flex justify-between items-center">
                  <div className="text-white/80">
                    <span className="text-sm">Price:</span>
                    <span className="text-white font-bold text-2xl ml-2">
                      ₹{booking.negotiations && booking.negotiations.length > 0 
                        ? booking.negotiations[booking.negotiations.length - 1]?.proposed_price 
                        : booking.offered_price}
                    </span>
                    {booking.negotiations && booking.negotiations.length > 0 && (
                      <span className="text-white/60 text-sm ml-2">
                        (Originally ₹{booking.offered_price})
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {booking.status === 'pending' && (
                      <span className="text-yellow-300 text-sm">⏳ Waiting for worker response</span>
                    )}
                    {booking.status === 'negotiating' && !booking.negotiations?.some(n => n.from_worker) && (
                      <span className="text-blue-300 text-sm">💬 Negotiation in progress</span>
                    )}
                    {booking.status === 'accepted' && (
                      <span className="text-green-300 text-sm">✅ Booking confirmed</span>
                    )}
                    {booking.status === 'completed' && (
                      <span className="text-purple-300 text-sm">🎉 Service completed</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-3xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">💬 Respond to {selectedBooking.worker?.full_name}</h3>
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
                      ? selectedBooking.negotiations[selectedBooking.negotiations.length - 1]?.proposed_price 
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
                <h4 className="text-white font-bold mb-3 drop-shadow-lg">💬 Latest Message from Worker:</h4>
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                  <p className="text-white font-medium italic text-lg drop-shadow-md">
                    "{selectedBooking.negotiations[selectedBooking.negotiations.length - 1]?.message}"
                  </p>
                  <div className="text-blue-200 text-sm mt-3 font-medium">
                    - {selectedBooking.worker?.full_name}, {new Date(selectedBooking.negotiations[selectedBooking.negotiations.length - 1]?.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
            
            {/* Response Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-white font-bold mb-2 drop-shadow-lg">Your Message:</label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  className="w-full px-4 py-3 glass text-white placeholder-white/70 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none font-medium"
                  rows={3}
                  placeholder="Type your message to the worker... (optional)"
                />
              </div>
              
              <div>
                <label className="block text-white font-bold mb-2 drop-shadow-lg">Counter Offer (Optional):</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white font-bold text-lg">₹</span>
                  <input
                    type="number"
                    value={counterOffer}
                    onChange={(e) => setCounterOffer(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 glass text-white placeholder-white/70 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none font-medium text-lg"
                    placeholder="Enter your counter offer amount"
                  />
                </div>
                <p className="text-white/80 text-sm mt-2 drop-shadow-md font-medium">💡 Leave empty if you just want to send a message</p>
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
          </div>
        </div>
      )}
    </div>
  );
}
