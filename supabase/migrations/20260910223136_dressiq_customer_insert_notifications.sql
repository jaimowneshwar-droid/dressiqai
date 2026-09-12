
-- Allow authenticated customers to insert notifications for themselves
-- (needed for order confirmation notifications at checkout)
DROP POLICY IF EXISTS "customer_insert_own_notifications" ON notifications;
CREATE POLICY "customer_insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
