import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ──────────────────────────────────────────────────────────
// Auth (required by NextAuth + Auth Module)
// ──────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  hashedPassword: text('hashed_password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}));

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
}, (table) => ({
  userIdx: index('acc_user_idx').on(table.userId),
  providerIdx: uniqueIndex('acc_provider_idx').on(table.provider, table.providerAccountId),
}));

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  userIdx: index('sess_user_idx').on(table.userId),
}));

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  tokenIdx: uniqueIndex('vt_token_idx').on(table.token),
  identIdx: index('vt_ident_idx').on(table.identifier),
}));

// ──────────────────────────────────────────────────────────
// Billing
// ──────────────────────────────────────────────────────────
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(), // Stripe subscription ID
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripePriceId: text('stripe_price_id').notNull(),
  status: text('status').notNull().default('incomplete'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  trialEnd: timestamp('trial_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('sub_user_idx').on(table.userId),
  customerIdx: index('sub_customer_idx').on(table.stripeCustomerId),
  statusIdx: index('sub_status_idx').on(table.status),
}));

export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(), // Stripe invoice ID
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: text('subscription_id').references(() => subscriptions.id),
  amountDue: integer('amount_due').notNull(),
  amountPaid: integer('amount_paid').default(0),
  currency: text('currency').default('usd').notNull(),
  status: text('status').notNull(), // draft, open, paid, void, uncollectible
  invoiceUrl: text('invoice_url'),
  pdfUrl: text('pdf_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('inv_user_idx').on(table.userId),
  subIdx: index('inv_sub_idx').on(table.subscriptionId),
}));

export const webhookEvents = pgTable('webhook_events', {
  id: text('id').primaryKey(), // Stripe event ID (for idempotency)
  type: text('type').notNull(),
  processedAt: timestamp('processed_at').defaultNow().notNull(),
}, (table) => ({
  typeIdx: index('wh_type_idx').on(table.type),
}));


