/**
 * Billing schema additions for the subscriptions table.
 * Merge into your main schema.ts or import alongside it.
 * 
 * Adds trialEnd field to the base subscription schema.
 */

import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from './schema';

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(), // Stripe subscription ID
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // active, past_due, canceled, trialing, incomplete, unpaid
  priceId: text('price_id'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  trialEnd: timestamp('trial_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
