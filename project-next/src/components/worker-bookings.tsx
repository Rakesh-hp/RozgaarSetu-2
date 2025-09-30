'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'

interface ServiceBooking {
  id: string
  customer_id: string
  service_id: string
  worker_id: string
  description: string
  location: string
  preferred_date: string
  preferred_time: string
  offered_price: number
  final_price: number | null
  status: string
  created_at: string
  scheduled_at: string | null
  special_instructions: string
  customer_phone: string
  
  // Joined data
  customer: {
    full_name: string
    email: string
    phone_number: string
  }
  service: {
    name: string
    category: {
      name: string
      icon: string
    }
  }
  // Add negotiations
  negotiations?: {
    id: string;
    booking_id: string;
    sender_id: string;
    message_type: string;
    proposed_price: number;
    message: string;
    created_at: string;
    from_customer?: boolean; // derived field
  }[];
}

interface NegotiationForm {
  bookingId: string
  messageType: string
  proposedPrice: string
  proposedDate: string
  proposedTime: string
  message: string
}

export default function WorkerBookings({ user }: { user: any }) {
  const [bookings, setBookings] = useState<ServiceBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null)
  const [negotiationForm, setNegotiationForm] = useState<NegotiationForm>({
    bookingId: '',
    messageType: 'message',
    proposedPrice: '',
    proposedDate: '',
    proposedTime: '',
    message: ''
  })
  const [showNegotiationModal, setShowNegotiationModal] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user])

  const fetchBookings = async () => {
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('service_bookings')
        .select(`
          *,
          customer:customer_id (
            full_name,
            email,
            phone_number
          ),
          service:service_id (
            name,
            category:category_id (
              name,
              icon
            )
          )
        `)
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false })

      if (bookingsError) throw bookingsError

      // Fetch negotiations for each booking
      const bookingIds = bookingsData?.map(booking => booking.id) || []
      
      if (bookingIds.length > 0) {
        const { data: negotiationsData, error: negotiationsError } = await supabase
          .from('booking_negotiations')
          .select('*')
          .in('booking_id', bookingIds)
          .order('created_at', { ascending: true })

        if (negotiationsError) throw negotiationsError

        // Group negotiations by booking_id and add from_customer flag
        const negotiationsByBooking = negotiationsData?.reduce((acc, negotiation) => {
          if (!acc[negotiation.booking_id]) {
            acc[negotiation.booking_id] = []
          }
          acc[negotiation.booking_id].push({
            ...negotiation,
            from_customer: negotiation.message_type === 'from_customer'
          })
          return acc
        }, {} as Record<string, any[]>) || {}

        // Attach negotiations to bookings
        const bookingsWithNegotiations = bookingsData?.map(booking => ({
          ...booking,
          negotiations: negotiationsByBooking[booking.id] || []
        })) || []

        setBookings(bookingsWithNegotiations)
        return bookingsWithNegotiations
      } else {
        setBookings(bookingsData || [])
        return bookingsData || []
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get updated bookings data without setting state
  const getUpdatedBookings = async () => {
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('service_bookings')
        .select(`
          *,
          customer:customer_id (
            full_name,
            email,
            phone_number
          ),
          service:service_id (
            name,
            category:category_id (
              name,
              icon
            )
          )
        `)
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false })

      if (bookingsError) throw bookingsError

      // Fetch negotiations for each booking
      const bookingIds = bookingsData?.map(booking => booking.id) || []
      
      if (bookingIds.length > 0) {
        const { data: negotiationsData, error: negotiationsError } = await supabase
          .from('booking_negotiations')
          .select('*')
          .in('booking_id', bookingIds)
          .order('created_at', { ascending: true })

        if (negotiationsError) throw negotiationsError

        // Group negotiations by booking_id and add from_customer flag
        const negotiationsByBooking = negotiationsData?.reduce((acc, negotiation) => {
          if (!acc[negotiation.booking_id]) {
            acc[negotiation.booking_id] = []
          }
          acc[negotiation.booking_id].push({
            ...negotiation,
            from_customer: negotiation.message_type === 'from_customer'
          })
          return acc
        }, {} as Record<string, any[]>) || {}

        // Attach negotiations to bookings
        const bookingsWithNegotiations = bookingsData?.map(booking => ({
          ...booking,
          negotiations: negotiationsByBooking[booking.id] || []
        })) || []

        return bookingsWithNegotiations
      } else {
        return bookingsData || []
      }
    } catch (error) {
      console.error('Error fetching updated bookings:', error)
      return []
    }
  }

  const handleBookingAction = async (bookingId: string, action: string, additionalData?: any) => {
    // Ask for confirmation for critical actions
    let confirmationMessage = '';
    if (action === 'accept') {
      confirmationMessage = `Are you sure you want to ACCEPT this booking? This confirms that you will provide the requested service.`;
    } else if (action === 'reject') {
      confirmationMessage = `Are you sure you want to REJECT this booking? This will cancel the service request and cannot be undone.`;
    } else if (action === 'complete') {
      confirmationMessage = `Are you sure you want to mark this job as COMPLETE? This will finalize the booking and request payment.`;
    }
    
    if (confirmationMessage && !window.confirm(confirmationMessage)) {
      return; // User cancelled the action
    }

    try {
      console.log(`Attempting to ${action} booking:`, bookingId);
      
      let updateData: any = {}
      
      switch (action) {
        case 'accept':
          updateData = { status: 'accepted' }
          break
        case 'reject':
          updateData = { status: 'cancelled' }
          break
        case 'confirm':
          updateData = { 
            status: 'confirmed',
            final_price: additionalData?.finalPrice,
            scheduled_at: additionalData?.scheduledAt
          }
          break
        case 'start':
          updateData = { status: 'in_progress' }
          break
        case 'complete':
          updateData = { 
            status: 'completed',
            completed_at: new Date().toISOString()
          }
          break
        default:
          throw new Error(`Unknown action: ${action}`)
      }

      console.log('Update data:', updateData);

      const { data, error } = await supabase
        .from('service_bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Update result:', data);
      
      await fetchBookings() // Refresh the list
      alert(`✅ Booking ${action}ed successfully!`)
      
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error)
      alert(`❌ Failed to ${action} booking. Please check console for details.`)
    }
  }

  const handleNegotiation = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Determine the correct message type based on the negotiation content
      let messageType = 'message'; // default
      if (negotiationForm.messageType === 'price_offer' && negotiationForm.proposedPrice) {
        messageType = 'price_offer';
      } else if (negotiationForm.messageType === 'time_change' && (negotiationForm.proposedDate || negotiationForm.proposedTime)) {
        messageType = 'time_change';
      }

      // Handle price storage based on message type
      let priceToStore = null;
      
      if (messageType === 'price_offer' && negotiationForm.proposedPrice) {
        // New price offer - use the entered price
        priceToStore = Number(negotiationForm.proposedPrice);
        console.log('Price offer type - using entered price:', priceToStore);
      } else if (selectedBooking) {
        // For message-only or time-change negotiations, maintain the last negotiated price
        console.log('Selected booking negotiations:', selectedBooking.negotiations);
        console.log('Selected booking original price:', selectedBooking.offered_price);
        
        if (selectedBooking.negotiations && selectedBooking.negotiations.length > 0) {
          const lastNegotiationWithPrice = selectedBooking.negotiations
            .slice()
            .reverse()
            .find(negotiation => negotiation.proposed_price && negotiation.proposed_price > 0);
          
          console.log('Last negotiation with price:', lastNegotiationWithPrice);
          
          if (lastNegotiationWithPrice) {
            priceToStore = lastNegotiationWithPrice.proposed_price;
            console.log('Using last negotiated price:', priceToStore);
          } else {
            priceToStore = selectedBooking.offered_price;
            console.log('No negotiated price found, using original price:', priceToStore);
          }
        } else {
          priceToStore = selectedBooking.offered_price;
          console.log('No negotiations found, using original price:', priceToStore);
        }
      }

      console.log('Negotiation data:', { 
        messageType, 
        priceToStore, 
        formPrice: negotiationForm.proposedPrice,
        formMessageType: negotiationForm.messageType 
      });

      const { error } = await supabase.from('booking_negotiations').insert([
        {
          booking_id: negotiationForm.bookingId,
          sender_id: user.id,
          message_type: messageType,
          proposed_price: priceToStore,
          proposed_date: negotiationForm.proposedDate || null,
          proposed_time: negotiationForm.proposedTime || null,
          message: negotiationForm.message || null
        }
      ])

      if (error) {
        console.error('Supabase negotiation insert error:', error.message || error)
        throw new Error(error.message || 'Failed to insert negotiation')
      }

      // Update booking status to negotiating if it's a price proposal
      if (negotiationForm.proposedPrice) {
        const { error: updateError } = await supabase
          .from('service_bookings')
          .update({ status: 'negotiating' })
          .eq('id', negotiationForm.bookingId)
        
        if (updateError) {
          console.error('Supabase booking update error:', updateError.message || updateError)
          // Continue even if status update fails
        }
      }

      alert('Negotiation sent successfully!')
      setShowNegotiationModal(false)
      setNegotiationForm({
        bookingId: '',
        messageType: 'message',
        proposedPrice: '',
        proposedDate: '',
        proposedTime: '',
        message: ''
      })
      
      // Fetch updated bookings first
      await fetchBookings()
      
      // Update selectedBooking with fresh data to ensure negotiations are current
      if (selectedBooking) {
        const updatedBookings = await getUpdatedBookings()
        const updatedSelectedBooking = updatedBookings.find(booking => booking.id === selectedBooking.id)
        if (updatedSelectedBooking) {
          setSelectedBooking(updatedSelectedBooking)
        }
      }
      
    } catch (error) {
      console.error('Error sending negotiation:', error instanceof Error ? error.message : String(error))
      alert('Failed to send negotiation. Please try again.')
    }
  }

  const startNegotiation = (booking: ServiceBooking, type: string) => {
    console.log('=== Starting negotiation ===');
    console.log('Booking ID:', booking.id);
    console.log('Negotiation type:', type);
    console.log('Current booking negotiations:', booking.negotiations);
    
    // Get the last negotiated price from negotiations history, or use the original offered price
    let lastNegotiatedPrice = booking.offered_price;
    
    if (booking.negotiations && booking.negotiations.length > 0) {
      // Find the most recent negotiation with a proposed price
      const lastNegotiationWithPrice = booking.negotiations
        .slice()
        .reverse()
        .find(negotiation => negotiation.proposed_price && negotiation.proposed_price > 0);
      
      console.log('Last negotiation with price found:', lastNegotiationWithPrice);
      
      if (lastNegotiationWithPrice) {
        lastNegotiatedPrice = lastNegotiationWithPrice.proposed_price;
      }
    }

    console.log('Final last negotiated price:', lastNegotiatedPrice);

    setNegotiationForm({
      bookingId: booking.id,
      messageType: type,
      // Only pre-fill price for price_offer type, leave empty for message-only
      proposedPrice: type === 'price_offer' ? lastNegotiatedPrice.toString() : '',
      proposedDate: booking.preferred_date,
      proposedTime: booking.preferred_time,
      message: ''
    })
    setSelectedBooking(booking)
    console.log('Selected booking set to:', booking);
    setShowNegotiationModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-blue-100 text-blue-800'
      case 'negotiating': return 'bg-orange-100 text-orange-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-white font-medium drop-shadow-md">Loading your bookings...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto pt-32">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg animate-fade-in-up">
          🔧 Service Bookings
        </h1>
        <p className="text-xl text-white/90 drop-shadow-md animate-fade-in-up delay-200">
          Manage your customer bookings and negotiations
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Bookings Yet</h3>
            <p className="text-white/80 mb-4">Customers will be able to book your services directly.</p>
            <p className="text-sm text-white/60">Make sure your profile is complete to attract more customers!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking, index) => (
            <div 
              key={booking.id} 
              className={`glass rounded-3xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] animate-fade-in-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">{booking.service.category.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{booking.service.name}</h3>
                    <p className="text-sm text-white/70 font-medium">{booking.service.category.name}</p>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md ${
                  booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                  booking.status === 'accepted' ? 'bg-green-500/20 text-green-300' :
                  booking.status === 'negotiating' ? 'bg-blue-500/20 text-blue-300' :
                  booking.status === 'confirmed' ? 'bg-purple-500/20 text-purple-300' :
                  booking.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <h4 className="font-semibold text-blue-200 mb-3 flex items-center gap-2">
                    <span>👤</span> Customer Details
                  </h4>
                  <p className="text-sm mb-1 text-white/90 font-medium"><strong className="text-white">Name:</strong> {booking.customer.full_name}</p>
                  <p className="text-sm mb-1 text-white/90 font-medium"><strong className="text-white">Phone:</strong> {booking.customer_phone}</p>
                  <p className="text-sm text-white/90 font-medium"><strong className="text-white">Email:</strong> {booking.customer.email}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <h4 className="font-semibold text-green-200 mb-3 flex items-center gap-2">
                    <span>📋</span> Booking Details
                  </h4>
                  <p className="text-sm mb-1 text-white/90 font-medium"><strong className="text-white">Date:</strong> {new Date(booking.preferred_date).toLocaleDateString()}</p>
                  <p className="text-sm mb-1 text-white/90 font-medium"><strong className="text-white">Time:</strong> {booking.preferred_time}</p>
                  <p className="text-sm mb-1 text-white/90 font-medium"><strong className="text-white">Offered Price:</strong> ₹{booking.offered_price}</p>
                  {booking.final_price && (
                    <p className="text-sm font-bold text-green-300"><strong className="text-green-200">Final Price:</strong> ₹{booking.final_price}</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <h4 className="font-semibold text-white/90 mb-3 flex items-center gap-2">
                    <span>📝</span> Work Description
                  </h4>
                  <p className="text-sm text-white/90 leading-relaxed font-medium">{booking.description}</p>
                  {booking.special_instructions && (
                    <div className="mt-3 p-3 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                      <strong className="text-sm text-yellow-200 block mb-1 font-semibold">⚠️ Special Instructions:</strong>
                      <p className="text-sm text-yellow-100 font-medium">{booking.special_instructions}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <h4 className="font-semibold text-purple-200 mb-3 flex items-center gap-2">
                    <span>📍</span> Location
                  </h4>
                  <p className="text-sm text-white/90 font-medium">{booking.location}</p>
                </div>
              </div>

              {/* Negotiation History */}
              {booking.negotiations && booking.negotiations.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">💬</span>
                    <h4 className="font-semibold text-white">Negotiation History</h4>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {booking.negotiations.map((negotiation) => {
                      const isFromCustomer = negotiation.sender_id === booking.customer_id;
                      return (
                        <div
                          key={negotiation.id}
                          className={`p-4 rounded-xl backdrop-blur-sm border ${
                            isFromCustomer
                              ? 'bg-blue-500/20 border-blue-400/30 ml-8'
                              : 'bg-green-500/20 border-green-400/30 mr-8'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-semibold ${
                              isFromCustomer ? 'text-blue-200' : 'text-green-200'
                            }`}>
                              {isFromCustomer ? '👤 Customer' : '🔧 You'}
                            </span>
                            <span className="text-xs text-white/70 font-medium">
                              {new Date(negotiation.created_at).toLocaleString()}
                            </span>
                          </div>
                          
                          {negotiation.proposed_price && (
                            <div className={`text-sm font-bold mb-2 ${
                              isFromCustomer ? 'text-blue-100' : 'text-green-100'
                            }`}>
                              💰 Proposed Price: ₹{negotiation.proposed_price}
                            </div>
                          )}
                          
                          {negotiation.message && (
                            <p className="text-sm text-white/90 leading-relaxed font-medium">
                              {negotiation.message}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-white/20">
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleBookingAction(booking.id, 'accept')}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      ✅ Accept
                    </button>
                    <button
                      onClick={() => startNegotiation(booking, 'price_offer')}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      💰 Negotiate Price
                    </button>
                    <button
                      onClick={() => startNegotiation(booking, 'time_change')}
                      className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:from-orange-600 hover:to-amber-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      🕒 Suggest Different Time
                    </button>
                    <button
                      onClick={() => handleBookingAction(booking.id, 'reject')}
                      className="px-6 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      ❌ Decline
                    </button>
                  </>
                )}

                {booking.status === 'negotiating' && (
                  <>
                    <button
                      onClick={() => startNegotiation(booking, 'price_offer')}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      💰 Counter Offer
                    </button>
                    <button
                      onClick={() => handleBookingAction(booking.id, 'accept')}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      ✅ Accept Offer
                    </button>
                    <button
                      onClick={() => handleBookingAction(booking.id, 'reject')}
                      className="px-6 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      ❌ Reject Offer
                    </button>
                  </>
                )}

                {booking.status === 'accepted' && (
                  <button
                    onClick={() => handleBookingAction(booking.id, 'confirm', {
                      finalPrice: booking.offered_price,
                      scheduledAt: `${booking.preferred_date}T${booking.preferred_time}`
                    })}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    ✅ Confirm Booking
                  </button>
                )}

                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleBookingAction(booking.id, 'start')}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    🚀 Start Work
                  </button>
                )}

                {booking.status === 'in_progress' && (
                  <button
                    onClick={() => handleBookingAction(booking.id, 'complete')}
                    className="px-6 py-2 bg-gradient-to-r from-gray-500 to-slate-600 text-white rounded-xl hover:from-gray-600 hover:to-slate-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    ✅ Mark Completed
                  </button>
                )}

                {['negotiating', 'accepted', 'confirmed'].includes(booking.status) && (
                  <button
                    onClick={() => startNegotiation(booking, 'message')}
                    className="px-6 py-2 bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-xl hover:from-gray-500 hover:to-gray-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    💬 Send Message
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Negotiation Modal */}
      {showNegotiationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">💬</span>
              <h3 className="text-xl font-bold text-gray-800">
                {negotiationForm.messageType === 'price_offer' && 'Counter Offer'}
                {negotiationForm.messageType === 'time_change' && 'Suggest Different Time'}
                {negotiationForm.messageType === 'message' && 'Send Message'}
              </h3>
            </div>

            <form onSubmit={handleNegotiation} className="space-y-6">
              {negotiationForm.messageType === 'price_offer' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    💰 Your Counter Offer (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={negotiationForm.proposedPrice}
                    onChange={(e) => setNegotiationForm(prev => ({ ...prev, proposedPrice: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your price offer"
                  />
                </div>
              )}

              {negotiationForm.messageType === 'time_change' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📅 Preferred Date
                    </label>
                    <input
                      type="date"
                      required
                      value={negotiationForm.proposedDate}
                      onChange={(e) => setNegotiationForm(prev => ({ ...prev, proposedDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🕒 Preferred Time
                    </label>
                    <input
                      type="time"
                      required
                      value={negotiationForm.proposedTime}
                      onChange={(e) => setNegotiationForm(prev => ({ ...prev, proposedTime: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  💭 Message {negotiationForm.messageType === 'message' ? '(Required)' : '(Optional)'}
                </label>
                <textarea
                  required={negotiationForm.messageType === 'message'}
                  value={negotiationForm.message}
                  onChange={(e) => setNegotiationForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  rows={4}
                  placeholder="Add a message for the customer..."
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Send Response
                </button>
                <button
                  type="button"
                  onClick={() => setShowNegotiationModal(false)}
                  className="flex-1 bg-gray-200/80 backdrop-blur-sm text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300/80 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}