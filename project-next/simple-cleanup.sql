-- ========================================
-- SIMPLE CLEANUP SCRIPT - Only remove what exists
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. First, let's see what tables you actually have
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('price_negotiations', 'time_negotiations', 'booking_messages', 'booking_status_history') 
    THEN '✅ New separated system table'
    WHEN table_name IN ('negotiation_summary', 'notification_preferences', 'negotiation_templates')
    THEN '⚠️ Old enhancement table (should be removed)'
    WHEN table_name = 'booking_negotiations'
    THEN '🔄 Mixed system table (needs cleanup)'
    WHEN table_name IN ('service_bookings', 'services', 'service_categories', 'worker_services')
    THEN '✅ Core system table'
    ELSE '❓ Other table'
  END as table_status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check what columns exist in service_bookings
SELECT 
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('current_price_offer_id', 'current_time_offer_id', 'last_message_at', 'unread_messages_count')
    THEN '✅ New separated system column'
    WHEN column_name IN ('negotiation_status', 'last_offer_by', 'last_offer_amount', 'last_offer_at', 'negotiation_rounds')
    THEN '⚠️ Old enhancement column (should be removed)'
    ELSE '✅ Core column'
  END as column_status
FROM information_schema.columns 
WHERE table_name = 'service_bookings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Clean up only what conflicts with the new separated system

-- Drop any triggers that might cause conflicts
DROP TRIGGER IF EXISTS trigger_update_negotiation_summary ON booking_negotiations;
DROP TRIGGER IF EXISTS trigger_update_current_price_offer ON price_negotiations;
DROP TRIGGER IF EXISTS trigger_update_current_time_offer ON time_negotiations;
DROP TRIGGER IF EXISTS trigger_update_message_counters ON booking_messages;
DROP TRIGGER IF EXISTS trigger_log_status_change ON service_bookings;

-- Drop functions that might cause conflicts
DROP FUNCTION IF EXISTS update_negotiation_summary();
DROP FUNCTION IF EXISTS update_current_price_offer();
DROP FUNCTION IF EXISTS update_current_time_offer();
DROP FUNCTION IF EXISTS update_message_counters();
DROP FUNCTION IF EXISTS log_status_change();

-- Drop views that might cause conflicts
DROP VIEW IF EXISTS negotiation_analytics;
DROP VIEW IF EXISTS current_negotiations;
DROP VIEW IF EXISTS booking_communications;

-- 4. Remove conflicting columns from service_bookings (if they exist from old schema)
DO $$ 
BEGIN
  -- Remove old enhancement columns that conflict with separated system
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_bookings' AND column_name = 'negotiation_status') THEN
    ALTER TABLE public.service_bookings DROP COLUMN negotiation_status;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_bookings' AND column_name = 'last_offer_by') THEN
    ALTER TABLE public.service_bookings DROP COLUMN last_offer_by;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_bookings' AND column_name = 'last_offer_amount') THEN
    ALTER TABLE public.service_bookings DROP COLUMN last_offer_amount;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_bookings' AND column_name = 'last_offer_at') THEN
    ALTER TABLE public.service_bookings DROP COLUMN last_offer_at;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_bookings' AND column_name = 'negotiation_rounds') THEN
    ALTER TABLE public.service_bookings DROP COLUMN negotiation_rounds;
  END IF;
END $$;

-- 5. Remove old enhancement tables (if they exist)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'negotiation_templates' AND table_schema = 'public') THEN
    DROP TABLE public.negotiation_templates CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences' AND table_schema = 'public') THEN
    DROP TABLE public.notification_preferences CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'negotiation_summary' AND table_schema = 'public') THEN
    DROP TABLE public.negotiation_summary CASCADE;
  END IF;
END $$;

-- 6. Reset booking_negotiations constraint to original (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_negotiations' AND table_schema = 'public') THEN
    -- Drop any enhanced constraint
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'booking_negotiations_message_type_check' 
      AND table_name = 'booking_negotiations'
    ) THEN
      ALTER TABLE public.booking_negotiations DROP CONSTRAINT booking_negotiations_message_type_check;
    END IF;
    
    -- Add back original constraint
    ALTER TABLE public.booking_negotiations 
    ADD CONSTRAINT booking_negotiations_message_type_check 
    CHECK (message_type = any (array[
      'price_offer'::text,
      'time_change'::text,
      'message'::text,
      'acceptance'::text,
      'rejection'::text
    ]));
  END IF;
END $$;

-- 7. Final verification - show what tables remain
SELECT 
  'Cleanup completed! Here are your remaining tables:' as message;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('price_negotiations', 'time_negotiations', 'booking_messages', 'booking_status_history') 
    THEN '✅ New separated system'
    WHEN table_name IN ('service_bookings', 'services', 'service_categories', 'worker_services', 'users')
    THEN '✅ Core system'
    WHEN table_name = 'booking_negotiations'
    THEN '⚠️ Old mixed table (can be kept or removed)'
    ELSE '❓ Other'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;