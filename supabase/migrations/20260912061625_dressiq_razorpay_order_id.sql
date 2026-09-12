/*
# Add Razorpay order ID column to orders table

1. Changes
- Added `razorpay_order_id` (text, nullable) to the `orders` table.
  Stores the Razorpay order ID returned by Razorpay when an order is created
  server-side for UPI/Online payments. NULL for Cash on Delivery orders.

2. Security
- No new RLS policies needed. The column is written by the edge function
  using the service role key (bypasses RLS), and read by the existing
  anon_read_orders SELECT policy.
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id text;
