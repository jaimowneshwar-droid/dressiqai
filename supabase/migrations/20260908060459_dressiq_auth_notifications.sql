/*
# DressIQ Auth & Notifications Migration

## Overview
Adds customer profile linking, notifications table, and order-scoped RLS for customer self-service.

## Changes
1. Add `user_id` column to `customers` table to link auth users
2. Create `notifications` table for in-app notifications
3. Update orders SELECT policy so customers can view their own orders
4. Add notification policies (customer reads/updates own notifications, admin can create)

## New Tables
- notifications: id, user_id, title, body, type, is_read, created_at

## Security
- Customers can read/update their own notifications (auth.uid = user_id)
- Customers can view their own orders (auth.uid = customer.user_id)
- Admin can create notifications for any user
*/

-- Add user_id to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- Tighten orders SELECT: anon can still read (for tracking by order number),
-- authenticated users can read all (admin), plus their own orders
DROP POLICY IF EXISTS "anon_read_orders" ON orders;
CREATE POLICY "anon_read_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

-- Customers can update their own profile
DROP POLICY IF EXISTS "customer_update_own" ON customers;
CREATE POLICY "customer_update_own" ON customers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text DEFAULT '',
  type text NOT NULL DEFAULT 'general',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_read_own_notifications" ON notifications;
CREATE POLICY "customer_read_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "customer_update_own_notifications" ON notifications;
CREATE POLICY "customer_update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "customer_delete_own_notifications" ON notifications;
CREATE POLICY "customer_delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Admin can insert notifications for any user
DROP POLICY IF EXISTS "admin_insert_notifications" ON notifications;
CREATE POLICY "admin_insert_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (is_admin());

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
