# Service Booking System - RozgaarSetu

## Overview

A comprehensive service booking system similar to Urban Company/UrbanClap that allows customers to book blue-collar workers for various services.

## Features Implemented

### 1. Service Categories & Services

- **10 service categories** with emojis and descriptions
- Hierarchical structure: Categories → Services → Workers
- Sample services like plumbing, electrical, cleaning, carpentry, etc.

### 2. Multi-Step Booking Flow

1. **Select Service Category** (e.g., Plumbing, Electrical, Cleaning)
2. **Choose Specific Service** (e.g., Pipe Repair, Switch Installation)
3. **Select Worker** from available professionals
4. **Fill Booking Details** (description, location, time, price)
5. **Submit Booking Request**

### 3. Worker Service Management

- Workers can specify which services they provide
- Set minimum pricing and travel distance preferences
- Real-time availability management

### 4. Booking Workflow (Like Ola/Uber/Zomato)

- **Customer places booking** with preferred time and offered price
- **Worker receives notification** and can:
  - Accept the booking
  - Negotiate price
  - Suggest different time
  - Send messages
  - Decline the booking
- **Real-time status updates** through booking lifecycle

### 5. Negotiation System

- Price negotiation between customer and worker
- Time/date rescheduling
- Built-in messaging system
- Structured negotiation history

### 6. Booking Status Management

```
pending → accepted → confirmed → in_progress → completed
         ↘ negotiating ↗
         ↘ cancelled
```

## Database Schema

### Core Tables Created:

1. **service_categories** - Main service categories (Plumbing, Electrical, etc.)
2. **services** - Specific services under each category
3. **service_bookings** - Main booking entity with all details
4. **booking_negotiations** - Price/time negotiations and messages
5. **worker_services** - Which services each worker provides

### Key Features:

- Proper foreign key relationships
- Status constraints and validation
- Support for price negotiation
- Comprehensive booking lifecycle tracking

## File Structure

### Backend/Database

- `database-schema-service-booking.sql` - Complete database schema

### Frontend Components

- `src/app/book-service/page.tsx` - Main booking interface
- `src/components/worker-bookings.tsx` - Worker booking management
- `src/components/worker-dashboard.tsx` - Updated with booking tabs
- `src/components/navigation.tsx` - Site navigation with booking link

## How to Use

### For Customers:

1. Visit `/book-service`
2. Select service category (plumbing, electrical, etc.)
3. Choose specific service
4. Browse and select from available workers
5. Fill booking details and submit

### For Workers:

1. Set up worker profile with skills
2. Configure service preferences in `worker_services` table
3. View booking requests in Worker Dashboard → Service Bookings tab
4. Accept, negotiate, or decline bookings
5. Manage booking lifecycle through completion

## Key Technical Features

### 1. Smart Worker Filtering

- Shows only workers who provide the selected service
- Filters by availability and travel distance
- Displays worker skills, experience, and pricing

### 2. Real-time Updates

- Booking status changes reflect immediately
- Negotiation messages update booking status
- Clean state management with React hooks

### 3. Comprehensive Validation

- Required fields validation
- Minimum price enforcement
- Date/time constraints
- Status transition validation

### 4. User Experience

- Progressive disclosure of information
- Clear visual indicators for booking steps
- Responsive design for mobile booking
- Loading states and error handling

## Integration with Existing System

The service booking system works alongside the existing job posting system:

- **Job Postings**: Employer posts → Worker applies → Employer approves
- **Service Bookings**: Customer selects worker → Worker accepts → Direct booking

Both systems share the same user authentication and profile management.

## Sample Data Included

- 10 service categories with icons and descriptions
- Sample services for each category
- Proper base pricing and duration estimates

This creates a complete Urban Company-style service booking platform integrated with your existing RozgaarSetu job board!
