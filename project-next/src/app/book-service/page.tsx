'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

interface ServiceCategory {
  id: string
  name: string
  description: string
  icon: string
}

interface Service {
  id: string
  category_id: string
  name: string
  description: string
  base_price: number
  duration_minutes: number
}

interface Worker {
  id: string
  full_name: string
  bio: string
  experience_years: number
  location: string
  skills: string[]
  phone_number: string
}

interface WorkerService {
  worker_id: string
  service_id: string
  min_price: number
  max_distance_km: number
  worker: Worker
}

export default function BookService() {
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [availableWorkers, setAvailableWorkers] = useState<WorkerService[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedWorker, setSelectedWorker] = useState<WorkerService | null>(null)
  const [clickedCategory, setClickedCategory] = useState<string | null>(null)
  const [clickedService, setClickedService] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  
  // Booking form states
  const [bookingForm, setBookingForm] = useState({
    description: '',
    location: '',
    preferredDate: '',
    preferredTime: '',
    offeredPrice: '',
    specialInstructions: '',
    customerPhone: ''
  })

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    let mounted = true;

    const initBookService = async () => {
      try {
        // Set timeout to prevent infinite loading
        setTimeout(() => {
          if (mounted) {
            setLoading(false);
          }
        }, 8000);

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (user) {
          // Try to get user profile (optional)
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (mounted) {
            setUser(userData || { id: user.id, email: user.email });
          }
        }
        
        if (mounted) {
          setAuthLoading(false);
        }

        // Fetch service categories with fallback
        await fetchServiceCategories();
        
      } catch (error) {
        console.error('Book service init error:', error);
        if (mounted) {
          setAuthLoading(false);
          setLoading(false);
        }
      }
    };

    initBookService();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const fetchServiceCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Database error:', error)
        // Fallback to hardcoded data if table doesn't exist
        setServiceCategories([
          { id: '1', name: 'Plumbing', description: 'Water pipe repairs and maintenance', icon: '🔧' },
          { id: '2', name: 'Electrical', description: 'Electrical repairs and installations', icon: '⚡' },
          { id: '3', name: 'Cleaning', description: 'House cleaning and maintenance', icon: '🧹' },
          { id: '4', name: 'Carpentry', description: 'Wood work and furniture repair', icon: '🔨' },
          { id: '5', name: 'Painting', description: 'Interior and exterior painting', icon: '🎨' },
          { id: '6', name: 'AC Repair', description: 'Air conditioner repair and maintenance', icon: '❄️' },
          { id: '7', name: 'Gardening', description: 'Garden maintenance and landscaping', icon: '🌱' },
          { id: '8', name: 'Moving', description: 'Packing and moving services', icon: '📦' },
          { id: '9', name: 'Beauty', description: 'Home beauty and grooming services', icon: '💄' },
          { id: '10', name: 'Appliance Repair', description: 'Home appliance repair services', icon: '🔧' }
        ])
      } else {
        setServiceCategories(data || [])
      }
    } catch (error) {
      console.error('Error fetching service categories:', error)
      // Use fallback data
      setServiceCategories([
        { id: '1', name: 'Plumbing', description: 'Water pipe repairs and maintenance', icon: '🔧' },
        { id: '2', name: 'Electrical', description: 'Electrical repairs and installations', icon: '⚡' },
        { id: '3', name: 'Cleaning', description: 'House cleaning and maintenance', icon: '🧹' },
        { id: '4', name: 'Carpentry', description: 'Wood work and furniture repair', icon: '🔨' },
        { id: '5', name: 'Painting', description: 'Interior and exterior painting', icon: '🎨' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchServicesForCategory = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('category_id', categoryId)
        .order('name')

      if (error) {
        console.error('Database error, using fallback services:', error)
        // Fallback services data
        const fallbackServices = {
          '1': [
            { id: '1-1', category_id: '1', name: 'Pipe Repair', description: 'Fix leaking or broken pipes', base_price: 500, duration_minutes: 60 },
            { id: '1-2', category_id: '1', name: 'Tap Installation', description: 'Install or replace taps and faucets', base_price: 300, duration_minutes: 45 },
            { id: '1-3', category_id: '1', name: 'Toilet Repair', description: 'Fix toilet issues and blockages', base_price: 400, duration_minutes: 90 }
          ],
          '2': [
            { id: '2-1', category_id: '2', name: 'Wiring Repair', description: 'Fix electrical wiring issues', base_price: 800, duration_minutes: 120 },
            { id: '2-2', category_id: '2', name: 'Switch Installation', description: 'Install electrical switches and outlets', base_price: 200, duration_minutes: 30 },
            { id: '2-3', category_id: '2', name: 'Fan Installation', description: 'Install ceiling or wall fans', base_price: 350, duration_minutes: 60 }
          ],
          '3': [
            { id: '3-1', category_id: '3', name: 'House Cleaning', description: 'Complete house cleaning service', base_price: 1000, duration_minutes: 180 },
            { id: '3-2', category_id: '3', name: 'Deep Cleaning', description: 'Thorough deep cleaning service', base_price: 1500, duration_minutes: 240 },
            { id: '3-3', category_id: '3', name: 'Kitchen Cleaning', description: 'Specialized kitchen cleaning', base_price: 600, duration_minutes: 90 }
          ],
          '4': [
            { id: '4-1', category_id: '4', name: 'Furniture Repair', description: 'Repair wooden furniture', base_price: 700, duration_minutes: 120 },
            { id: '4-2', category_id: '4', name: 'Cabinet Installation', description: 'Install kitchen or room cabinets', base_price: 1200, duration_minutes: 180 },
            { id: '4-3', category_id: '4', name: 'Door Repair', description: 'Fix or adjust doors and handles', base_price: 400, duration_minutes: 60 }
          ],
          '5': [
            { id: '5-1', category_id: '5', name: 'Wall Painting', description: 'Interior wall painting service', base_price: 2000, duration_minutes: 480 },
            { id: '5-2', category_id: '5', name: 'Touch-up Painting', description: 'Small area touch-up painting', base_price: 500, duration_minutes: 120 },
            { id: '5-3', category_id: '5', name: 'Exterior Painting', description: 'Exterior wall painting', base_price: 3000, duration_minutes: 600 }
          ]
        };
        setServices(fallbackServices[categoryId as keyof typeof fallbackServices] || []);
      } else {
        setServices(data || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      // Use fallback data for the selected category
      const fallbackServices = {
        '1': [
          { id: '1-1', category_id: '1', name: 'Pipe Repair', description: 'Fix leaking or broken pipes', base_price: 500, duration_minutes: 60 },
          { id: '1-2', category_id: '1', name: 'Tap Installation', description: 'Install or replace taps and faucets', base_price: 300, duration_minutes: 45 }
        ],
        '2': [
          { id: '2-1', category_id: '2', name: 'Wiring Repair', description: 'Fix electrical wiring issues', base_price: 800, duration_minutes: 120 },
          { id: '2-2', category_id: '2', name: 'Switch Installation', description: 'Install electrical switches and outlets', base_price: 200, duration_minutes: 30 }
        ]
      };
      setServices(fallbackServices[categoryId as keyof typeof fallbackServices] || []);
    }
  }

  const fetchAvailableWorkers = async (serviceId: string) => {
    try {
      console.log('Fetching workers for service:', serviceId, 'Category:', selectedCategory?.name, 'Service:', selectedService?.name);
      
      // First, let's try to get the service name to match with worker skills
      const selectedServiceName = selectedService?.name?.toLowerCase();
      const categoryName = selectedCategory?.name?.toLowerCase();
      
      // Try multiple possible table names for workers
      let workersData = null;
      let workersError = null;

      // Try 'workers' table first
      const { data: workersData1, error: workersError1 } = await supabase
        .from('workers')
        .select('*')

      if (workersError1) {
        console.log('No workers table, trying users table with role filter...')
        // Try 'users' table with worker role
        const { data: workersData2, error: workersError2 } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'worker')

        if (workersError2) {
          console.log('No users with worker role, trying all users...')
          // Try all users
          const { data: workersData3, error: workersError3 } = await supabase
            .from('users')
            .select('*')

          workersData = workersData3;
          workersError = workersError3;
        } else {
          workersData = workersData2;
          workersError = workersError2;
        }
      } else {
        workersData = workersData1;
        workersError = workersError1;
      }

      if (workersError) {
        console.error('Database error fetching workers:', workersError)
        setAvailableWorkers([])
        return
      }

      console.log('Found workers:', workersData?.length || 0);

      if (workersData && workersData.length > 0) {
        // Filter workers based on skills that match the selected category/service
        const matchingWorkers = workersData.filter(worker => {
          if (!worker.skills) return false;
          
          let workerSkills = [];
          // Handle skills as string or array
          if (typeof worker.skills === 'string') {
            try {
              workerSkills = JSON.parse(worker.skills).map((skill: string) => skill.toLowerCase());
            } catch {
              workerSkills = [worker.skills.toLowerCase()];
            }
          } else if (Array.isArray(worker.skills)) {
            workerSkills = worker.skills.map((skill: string) => skill.toLowerCase());
          }
          
          console.log('Worker:', worker.full_name || worker.name, 'Skills:', workerSkills);
          
          // Check if worker skills include the category name or service name
          const matchesCategory = workerSkills.some(skill => 
            skill.includes(categoryName || '') || 
            skill.includes(selectedServiceName || '') ||
            (categoryName === 'plumbing' && (skill.includes('plumber') || skill.includes('plumbing'))) ||
            (categoryName === 'electrical' && (skill.includes('electrician') || skill.includes('electrical'))) ||
            (categoryName === 'carpentry' && (skill.includes('carpenter') || skill.includes('carpentry'))) ||
            (categoryName === 'cleaning' && (skill.includes('cleaner') || skill.includes('cleaning') || skill.includes('maid'))) ||
            (categoryName === 'painting' && (skill.includes('painter') || skill.includes('painting')))
          );
          
          console.log('Worker matches:', matchesCategory);
          return matchesCategory;
        })

        console.log('Matching workers found:', matchingWorkers.length);

        // Convert to the expected format for display
        const formattedWorkers = matchingWorkers.map(worker => ({
          worker_id: worker.id,
          service_id: serviceId,
          min_price: worker.min_price || 0,
          max_distance_km: worker.max_distance_km || 10,
          worker: {
            id: worker.id,
            full_name: worker.full_name || worker.name || 'Professional Worker',
            bio: worker.bio || `Experienced ${categoryName} professional with quality service`,
            experience_years: worker.experience_years || 2,
            location: worker.location || 'Your Area',
            skills: Array.isArray(worker.skills) ? worker.skills : (typeof worker.skills === 'string' ? JSON.parse(worker.skills) : []),
            phone_number: worker.phone_number || worker.phone || '9876543210'
          }
        }))

        setAvailableWorkers(formattedWorkers)
      } else {
        console.log('No workers found in database');
        setAvailableWorkers([])
      }
    } catch (error) {
      console.error('Error fetching workers:', error)
      setAvailableWorkers([])
    }
  }

  const handleCategorySelect = async (category: ServiceCategory) => {
    setClickedCategory(category.id)
    setTimeout(() => setClickedCategory(null), 200) // Reset click state after animation
    setSelectedCategory(category)
    setSelectedService(null)
    setSelectedWorker(null)
    setAvailableWorkers([])
    await fetchServicesForCategory(category.id)
  }

  const handleServiceSelect = async (service: Service) => {
    setClickedService(service.id)
    setTimeout(() => setClickedService(null), 200) // Reset click state after animation
    setSelectedService(service)
    setSelectedWorker(null)
    setBookingForm(prev => ({ ...prev, offeredPrice: service.base_price.toString() }))
    await fetchAvailableWorkers(service.id)
  }

  const handleWorkerSelect = (workerService: WorkerService) => {
    setSelectedWorker(workerService)
    // Set minimum price if worker has specified it
    if (workerService.min_price > 0) {
      setBookingForm(prev => ({ 
        ...prev, 
        offeredPrice: Math.max(Number(prev.offeredPrice) || 0, workerService.min_price).toString()
      }))
    }
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService || !selectedWorker || !user) return

    try {
      const { error } = await supabase.from('service_bookings').insert([
        {
          customer_id: user.id,
          service_id: selectedService.id,
          worker_id: selectedWorker.worker_id,
          description: bookingForm.description,
          location: bookingForm.location,
          preferred_date: bookingForm.preferredDate,
          preferred_time: bookingForm.preferredTime,
          offered_price: Number(bookingForm.offeredPrice),
          special_instructions: bookingForm.specialInstructions,
          customer_phone: bookingForm.customerPhone,
          status: 'pending'
        }
      ])

      if (error) throw error

      alert('Booking request sent successfully! The worker will be notified.')
      
      // Reset form
      setSelectedCategory(null)
      setSelectedService(null)
      setSelectedWorker(null)
      setBookingForm({
        description: '',
        location: '',
        preferredDate: '',
        preferredTime: '',
        offeredPrice: '',
        specialInstructions: '',
        customerPhone: ''
      })
      
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Failed to create booking. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar activePage="book-service" />
        
        {/* Loading Screen */}
        <div className="max-w-6xl mx-auto pt-32 px-4">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="glass rounded-3xl shadow-xl p-12 text-center max-w-md mx-auto">
              <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">Loading Services</h2>
              <p className="text-white/80 drop-shadow-md">Please wait while we prepare your booking options...</p>
              <div className="mt-6 flex justify-center space-x-1">
                <div className="h-2 w-2 bg-white/60 rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-white/60 rounded-full animate-bounce delay-100"></div>
                <div className="h-2 w-2 bg-white/60 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar activePage="book-service" />

      <div className="max-w-6xl mx-auto pt-32 px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">Book a Service</h1>
          <p className="text-xl text-white/90 drop-shadow-md">Choose from our professional home services</p>
        </div>

        {/* Step 1: Select Service Category */}
        {!selectedCategory && (
          <div className="glass rounded-3xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-8 text-center drop-shadow-lg">What service do you need?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {serviceCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className="group relative p-6 glass hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 transform text-center overflow-hidden card-hover"
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="text-4xl mb-3 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                      {category.icon}
                    </div>
                    <div className="font-semibold text-white text-lg mb-2">{category.name}</div>
                    <div className="text-sm text-white/80 group-hover:text-white transition-colors duration-300">
                      {category.description}
                    </div>
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 ring-2 ring-white/0 group-hover:ring-white/30 rounded-2xl transition-all duration-300"></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Specific Service */}
        {selectedCategory && !selectedService && (
          <div className="glass rounded-3xl shadow-xl p-8 mb-8">
            <div className="flex items-center mb-8">
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-white/80 hover:text-white mr-6 glass hover:bg-white/10 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 transform"
              >
                ← Back to categories
              </button>
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">Select {selectedCategory.name} Service</h2>
            </div>
            
            <div className="grid gap-6">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className={`group relative p-6 glass hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-102 hover:shadow-2xl text-left overflow-hidden transform card-hover ${
                    clickedService === service.id ? 'scale-95 bg-white/20' : ''
                  }`}
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-white mb-2 group-hover:text-blue-100 transition-colors duration-300">
                        {service.name}
                      </h3>
                      <p className="text-white/80 group-hover:text-white/90 mb-3 transition-colors duration-300">
                        {service.description}
                      </p>
                      <div className="flex items-center text-white/70 group-hover:text-white/80 transition-colors duration-300">
                        <span className="text-sm">⏱️ {service.duration_minutes} minutes</span>
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <div className="text-2xl font-bold text-green-300 group-hover:text-green-200 transition-colors duration-300 drop-shadow-md">
                        ₹{service.base_price}
                      </div>
                      <div className="text-sm text-white/60 group-hover:text-white/70 transition-colors duration-300">
                        Starting from
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 ring-2 ring-white/0 group-hover:ring-white/20 rounded-2xl transition-all duration-300"></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Worker */}
        {selectedService && !selectedWorker && (
          <div className="glass rounded-3xl shadow-xl p-8 mb-8">
            <div className="flex items-center mb-8">
              <button
                onClick={() => setSelectedService(null)}
                className="text-white/80 hover:text-white mr-6 glass hover:bg-white/10 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 transform"
              >
                ← Back to services
              </button>
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">Choose Your {selectedService.name} Professional</h2>
            </div>
            
            {availableWorkers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl text-white/80 mb-6">No workers available for this service at the moment.</p>
                <button
                  onClick={() => setSelectedService(null)}
                  className="px-8 py-3 glass hover:bg-white/10 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 transform"
                >
                  Try Another Service
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {availableWorkers.map((workerService) => (
                  <button
                    key={workerService.worker_id}
                    onClick={() => handleWorkerSelect(workerService)}
                    className="group relative p-6 glass hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-102 hover:shadow-2xl text-left overflow-hidden transform card-hover"
                  >
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10 flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-white mb-2 group-hover:text-blue-100 transition-colors duration-300">
                          {workerService.worker.full_name}
                        </h3>
                        <p className="text-white/80 group-hover:text-white/90 mb-3 transition-colors duration-300">
                          {workerService.worker.bio}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {workerService.worker.skills?.map((skill) => (
                            <span
                              key={skill}
                              className="px-3 py-1 glass bg-blue-500/20 text-blue-100 text-sm rounded-full group-hover:bg-blue-500/30 transition-colors duration-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center space-x-6 text-white/70 group-hover:text-white/80 transition-colors duration-300">
                          <span className="flex items-center">📍 {workerService.worker.location}</span>
                          <span className="flex items-center">🎯 {workerService.worker.experience_years} years</span>
                          <span className="flex items-center">📱 {workerService.worker.phone_number}</span>
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        {workerService.min_price > 0 && (
                          <div className="text-xl font-bold text-green-300 group-hover:text-green-200 transition-colors duration-300 drop-shadow-md">
                            ₹{workerService.min_price}+ minimum
                          </div>
                        )}
                        <div className="text-sm text-white/60 group-hover:text-white/70 transition-colors duration-300">
                          Travels up to {workerService.max_distance_km}km
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 ring-2 ring-white/0 group-hover:ring-white/20 rounded-2xl transition-all duration-300"></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Booking Form */}
        {selectedWorker && (
          <div className="glass rounded-3xl shadow-xl p-8 mb-8">
            <div className="flex items-center mb-8">
              <button
                onClick={() => setSelectedWorker(null)}
                className="text-white/80 hover:text-white mr-6 glass hover:bg-white/10 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 transform"
              >
                ← Choose different worker
              </button>
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">Book {selectedWorker.worker.full_name}</h2>
            </div>

            <div className="glass rounded-2xl shadow-xl p-6 mb-8">
              <div className="glass-dark rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-xl text-white mb-4 flex items-center">
                  <span className="text-2xl mr-2">📋</span> Booking Summary
                </h3>
                <div className="space-y-2 text-white/90">
                  <p><span className="font-semibold text-blue-200">Service:</span> {selectedService?.name}</p>
                  <p><span className="font-semibold text-blue-200">Worker:</span> {selectedWorker.worker.full_name}</p>
                  <p><span className="font-semibold text-blue-200">Worker Location:</span> {selectedWorker.worker.location}</p>
                </div>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Describe the work needed *
                  </label>
                  <textarea
                    required
                    value={bookingForm.description}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 glass text-white placeholder-white/60 transition-all duration-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    rows={3}
                    placeholder="Please describe what work needs to be done..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Work Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingForm.location}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 glass text-white placeholder-white/60 transition-all duration-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    placeholder="Full address where work will be done"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingForm.preferredDate}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, preferredDate: e.target.value }))}
                      className="w-full px-4 py-3 glass text-white transition-all duration-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Preferred Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={bookingForm.preferredTime}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, preferredTime: e.target.value }))}
                      className="w-full px-4 py-3 glass text-white transition-all duration-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Offered Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={selectedWorker.min_price || 0}
                    value={bookingForm.offeredPrice}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, offeredPrice: e.target.value }))}
                    className="w-full px-4 py-3 glass text-white placeholder-white/60 transition-all duration-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    placeholder="Enter your offered price"
                  />
                  {selectedWorker.min_price > 0 && (
                    <p className="text-sm text-white/70 mt-2">
                      💰 Minimum price: ₹{selectedWorker.min_price}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Your Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={bookingForm.customerPhone}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="w-full px-4 py-3 glass text-white placeholder-white/60 transition-all duration-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    placeholder="Phone number for coordination"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    value={bookingForm.specialInstructions}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    className="w-full px-4 py-3 glass text-white placeholder-white/60 transition-all duration-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    rows={2}
                    placeholder="Any special requirements or instructions..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full btn-gradient text-white py-4 px-6 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 transform active:scale-95"
                >
                  <span className="flex items-center justify-center">
                    <span className="text-2xl mr-2">🚀</span>
                    Send Booking Request
                  </span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}