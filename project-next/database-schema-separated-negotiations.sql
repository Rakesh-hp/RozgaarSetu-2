-- ========================================
-- SEPARATED NEGOTIATION SYSTEM
-- Clean separation of price, time, and messaging
-- ========================================

-- 1. Price Negotiations Table (Only for price offers/counters)
CREATE TABLE IF NOT EXISTS public.price_negotiations (
  id uuid not null default gen_random_uuid(),
  booking_id uuid not null,
  sender_id uuid not null, -- who made the price offer
  
  -- Price details
  offered_price numeric not null,
  status text not null default 'pending', -- 'pending', 'accepted', 'rejected', 'countered'
  
  -- Metadata
  notes text null, -- optional note with the price offer
  expires_at timestamp with time zone null, -- when this offer expires
  created_at timestamp with time zone default now(),
  responded_at timestamp with time zone null,
  
  constraint price_negotiations_pkey primary key (id),
  constraint price_negotiations_booking_id_fkey foreign key (booking_id) references service_bookings (id) on delete cascade,
  constraint price_negotiations_sender_id_fkey foreign key (sender_id) references users (id) on delete cascade,
  constraint price_negotiations_status_check check (
    status in ('pending', 'accepted', 'rejected', 'countered', 'expired')
  )
);

-- 2. Time Negotiations Table (Only for schedule changes)
CREATE TABLE IF NOT EXISTS public.time_negotiations (
  id uuid not null default gen_random_uuid(),
  booking_id uuid not null,
  sender_id uuid not null, -- who requested the time change
  
  -- Time details
  proposed_date date not null,
  proposed_time time not null,
  status text not null default 'pending', -- 'pending', 'accepted', 'rejected'
  
  -- Metadata
  reason text null, -- why the time change is needed
  created_at timestamp with time zone default now(),
  responded_at timestamp with time zone null,
  
  constraint time_negotiations_pkey primary key (id),
  constraint time_negotiations_booking_id_fkey foreign key (booking_id) references service_bookings (id) on delete cascade,
  constraint time_negotiations_sender_id_fkey foreign key (sender_id) references users (id) on delete cascade,
  constraint time_negotiations_status_check check (
    status in ('pending', 'accepted', 'rejected')
  )
);

-- 3. Messages Table (Only for communication)
CREATE TABLE IF NOT EXISTS public.booking_messages (
  id uuid not null default gen_random_uuid(),
  booking_id uuid not null,
  sender_id uuid not null,
  
  -- Message content
  message text not null,
  message_type text default 'general', -- 'general', 'question', 'clarification', 'update'
  
  -- Metadata
  is_read boolean default false,
  created_at timestamp with time zone default now(),
  
  constraint booking_messages_pkey primary key (id),
  constraint booking_messages_booking_id_fkey foreign key (booking_id) references service_bookings (id) on delete cascade,
  constraint booking_messages_sender_id_fkey foreign key (sender_id) references users (id) on delete cascade,
  constraint booking_messages_message_type_check check (
    message_type in ('general', 'question', 'clarification', 'update', 'system')
  )
);

-- 4. Booking Status History (Track all status changes)
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id uuid not null default gen_random_uuid(),
  booking_id uuid not null,
  changed_by uuid not null,
  
  -- Status change details
  old_status text not null,
  new_status text not null,
  reason text null, -- why the status was changed
  
  created_at timestamp with time zone default now(),
  
  constraint booking_status_history_pkey primary key (id),
  constraint booking_status_history_booking_id_fkey foreign key (booking_id) references service_bookings (id) on delete cascade,
  constraint booking_status_history_changed_by_fkey foreign key (changed_by) references users (id) on delete cascade
);

-- 5. Enhanced service_bookings table for separated system
ALTER TABLE public.service_bookings 
ADD COLUMN IF NOT EXISTS current_price_offer_id uuid null,
ADD COLUMN IF NOT EXISTS current_time_offer_id uuid null,
ADD COLUMN IF NOT EXISTS last_message_at timestamp with time zone null,
ADD COLUMN IF NOT EXISTS unread_messages_count integer default 0;

-- Add foreign keys for current offers
DO $$ 
BEGIN
  -- Add current_price_offer_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_bookings_current_price_offer_fkey' 
    AND table_name = 'service_bookings'
  ) THEN
    ALTER TABLE public.service_bookings 
    ADD CONSTRAINT service_bookings_current_price_offer_fkey 
    FOREIGN KEY (current_price_offer_id) REFERENCES price_negotiations (id) ON DELETE SET NULL;
  END IF;

  -- Add current_time_offer_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_bookings_current_time_offer_fkey' 
    AND table_name = 'service_bookings'
  ) THEN
    ALTER TABLE public.service_bookings 
    ADD CONSTRAINT service_bookings_current_time_offer_fkey 
    FOREIGN KEY (current_time_offer_id) REFERENCES time_negotiations (id) ON DELETE SET NULL;
  END IF;
END $$;

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_negotiations_booking_id ON price_negotiations(booking_id);
CREATE INDEX IF NOT EXISTS idx_price_negotiations_status ON price_negotiations(status);
CREATE INDEX IF NOT EXISTS idx_price_negotiations_created_at ON price_negotiations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_time_negotiations_booking_id ON time_negotiations(booking_id);
CREATE INDEX IF NOT EXISTS idx_time_negotiations_status ON time_negotiations(status);

CREATE INDEX IF NOT EXISTS idx_booking_messages_booking_id ON booking_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_messages_created_at ON booking_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_messages_is_read ON booking_messages(is_read);

CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking_id ON booking_status_history(booking_id);

-- 7. Enable RLS on new tables
ALTER TABLE public.price_negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies
-- Price negotiations policies
CREATE POLICY "Users can view price negotiations for their bookings" ON public.price_negotiations
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM service_bookings 
      WHERE customer_id = auth.uid() OR worker_id = auth.uid()
    )
  );

CREATE POLICY "Users can create price negotiations for their bookings" ON public.price_negotiations
  FOR INSERT WITH CHECK (
    booking_id IN (
      SELECT id FROM service_bookings 
      WHERE customer_id = auth.uid() OR worker_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

CREATE POLICY "Users can update their own price negotiations" ON public.price_negotiations
  FOR UPDATE USING (sender_id = auth.uid());

-- Time negotiations policies (same pattern)
CREATE POLICY "Users can view time negotiations for their bookings" ON public.time_negotiations
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM service_bookings 
      WHERE customer_id = auth.uid() OR worker_id = auth.uid()
    )
  );

CREATE POLICY "Users can create time negotiations for their bookings" ON public.time_negotiations
  FOR INSERT WITH CHECK (
    booking_id IN (
      SELECT id FROM service_bookings 
      WHERE customer_id = auth.uid() OR worker_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

CREATE POLICY "Users can update their own time negotiations" ON public.time_negotiations
  FOR UPDATE USING (sender_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages for their bookings" ON public.booking_messages
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM service_bookings 
      WHERE customer_id = auth.uid() OR worker_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages for their bookings" ON public.booking_messages
  FOR INSERT WITH CHECK (
    booking_id IN (
      SELECT id FROM service_bookings 
      WHERE customer_id = auth.uid() OR worker_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

-- Status history policies
CREATE POLICY "Users can view status history for their bookings" ON public.booking_status_history
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM service_bookings 
      WHERE customer_id = auth.uid() OR worker_id = auth.uid()
    )
  );

-- 9. Functions for automatic updates

-- Function to update current price offer when new price negotiation is created
CREATE OR REPLACE FUNCTION update_current_price_offer()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the booking's current price offer reference
  UPDATE service_bookings 
  SET current_price_offer_id = NEW.id,
      negotiation_status = 'price_negotiating',
      status = CASE 
        WHEN status = 'pending' THEN 'negotiating'
        ELSE status 
      END
  WHERE id = NEW.booking_id;
  
  -- Mark previous price offers as countered (except the new one)
  UPDATE price_negotiations 
  SET status = 'countered'
  WHERE booking_id = NEW.booking_id 
    AND id != NEW.id 
    AND status = 'pending';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update current time offer when new time negotiation is created
CREATE OR REPLACE FUNCTION update_current_time_offer()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE service_bookings 
  SET current_time_offer_id = NEW.id
  WHERE id = NEW.booking_id;
  
  -- Mark previous time offers as superseded
  UPDATE time_negotiations 
  SET status = 'rejected'
  WHERE booking_id = NEW.booking_id 
    AND id != NEW.id 
    AND status = 'pending';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update message counters
CREATE OR REPLACE FUNCTION update_message_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last message time and unread count
  UPDATE service_bookings 
  SET last_message_at = NEW.created_at,
      unread_messages_count = unread_messages_count + 1
  WHERE id = NEW.booking_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log status changes
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO booking_status_history (
      booking_id, 
      changed_by, 
      old_status, 
      new_status,
      reason
    ) VALUES (
      NEW.id,
      auth.uid(),
      OLD.status,
      NEW.status,
      'System update'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers
DROP TRIGGER IF EXISTS trigger_update_current_price_offer ON price_negotiations;
CREATE TRIGGER trigger_update_current_price_offer
  AFTER INSERT ON price_negotiations
  FOR EACH ROW EXECUTE FUNCTION update_current_price_offer();

DROP TRIGGER IF EXISTS trigger_update_current_time_offer ON time_negotiations;
CREATE TRIGGER trigger_update_current_time_offer
  AFTER INSERT ON time_negotiations
  FOR EACH ROW EXECUTE FUNCTION update_current_time_offer();

DROP TRIGGER IF EXISTS trigger_update_message_counters ON booking_messages;
CREATE TRIGGER trigger_update_message_counters
  AFTER INSERT ON booking_messages
  FOR EACH ROW EXECUTE FUNCTION update_message_counters();

DROP TRIGGER IF EXISTS trigger_log_status_change ON service_bookings;
CREATE TRIGGER trigger_log_status_change
  AFTER UPDATE ON service_bookings
  FOR EACH ROW EXECUTE FUNCTION log_status_change();

-- 11. Helper views for easy querying

-- Current negotiation state view
CREATE OR REPLACE VIEW current_negotiations AS
SELECT 
  sb.id as booking_id,
  sb.status as booking_status,
  sb.offered_price as original_price,
  sb.final_price,
  
  -- Current price offer
  pn.id as current_price_offer_id,
  pn.offered_price as current_price_offer,
  pn.status as price_offer_status,
  pn.sender_id as price_offer_by,
  pn.created_at as price_offer_at,
  
  -- Current time offer  
  tn.id as current_time_offer_id,
  tn.proposed_date as proposed_date,
  tn.proposed_time as proposed_time,
  tn.status as time_offer_status,
  tn.sender_id as time_offer_by,
  tn.created_at as time_offer_at,
  
  -- Message info
  sb.last_message_at,
  sb.unread_messages_count
  
FROM service_bookings sb
LEFT JOIN price_negotiations pn ON sb.current_price_offer_id = pn.id
LEFT JOIN time_negotiations tn ON sb.current_time_offer_id = tn.id;

-- Complete booking communication view
CREATE OR REPLACE VIEW booking_communications AS
SELECT 
  booking_id,
  'price' as type,
  id,
  sender_id,
  'Price offer: ₹' || offered_price as content,
  status,
  created_at,
  notes as additional_info
FROM price_negotiations

UNION ALL

SELECT 
  booking_id,
  'time' as type,
  id,
  sender_id,
  'Time change: ' || proposed_date || ' at ' || proposed_time as content,
  status,
  created_at,
  reason as additional_info
FROM time_negotiations

UNION ALL

SELECT 
  booking_id,
  'message' as type,
  id,
  sender_id,
  message as content,
  CASE WHEN is_read THEN 'read' ELSE 'unread' END as status,
  created_at,
  message_type as additional_info
FROM booking_messages

ORDER BY created_at ASC;

COMMENT ON VIEW current_negotiations IS 'Current state of all negotiations for each booking';
COMMENT ON VIEW booking_communications IS 'All communications (price, time, messages) for bookings in chronological order';