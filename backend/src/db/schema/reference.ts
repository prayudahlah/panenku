import {
  pgSchema,
  integer,
  bigint,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const reference = pgSchema('reference');

export const units = reference.table('units', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull().unique(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
});

export const checkoutStatuses = reference.table('checkout_statuses', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  code: text('code').notNull().unique(),
});

export const orderItemStatuses = reference.table('order_item_statuses', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  code: text('code').notNull().unique(),
});

export const paymentStatuses = reference.table('payment_statuses', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  code: text('code').notNull().unique(),
});

export const shipmentStatuses = reference.table('shipment_statuses', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  code: text('code').notNull().unique(),
});

export const contractStatuses = reference.table('contract_statuses', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  code: text('code').notNull().unique(),
});

export const paymentMethods = reference.table('payment_methods', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull().unique(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
});

export const productCategories = reference.table('product_categories', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  parentId: bigint('parent_id', { mode: 'number' }),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
});

export const provinces = reference.table('provinces', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull().unique(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
});

export const cities = reference.table('cities', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  provinceId: bigint('province_id', { mode: 'number' }).notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
});
