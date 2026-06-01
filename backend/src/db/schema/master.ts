import {
    pgSchema,
    integer,
    bigint,
    text,
    timestamp,
    numeric,
    boolean,
} from 'drizzle-orm/pg-core';

export const master = pgSchema('master');

export const users = master.table('users', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    fullName: text('full_name').notNull(),
    email: text('email').notNull().unique(),
    phone: text('phone').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').notNull(),
    status: text('status').notNull().default('active'),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const sellerProfiles = master.table('seller_profiles', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: bigint('user_id', { mode: 'number' }).notNull().unique(),
    farmName: text('farm_name').notNull(),
    landCertificate: text('land_certificate'),
    address: text('address').notNull(),
    cityId: bigint('city_id', { mode: 'number' }).notNull(),
    provinceId: bigint('province_id', { mode: 'number' }).notNull(),
    status: text('status').notNull().default('active'),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const products = master.table('products', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    sellerId: bigint('seller_id', { mode: 'number' }).notNull(),
    categoryId: bigint('category_id', { mode: 'number' }).notNull(),
    name: text('name').notNull(),
    description: text('description'),
    unitId: integer('unit_id').notNull(),
    minOrderQty: numeric('min_order_qty', { precision: 12, scale: 2 }).notNull().default('1'),
    pricePerUnit: numeric('price_per_unit', { precision: 12, scale: 2 }).notNull(),
    stockQuantity: numeric('stock_quantity', { precision: 10, scale: 2 }).notNull().default('0'),
    isNegotiable: boolean('is_negotiable').notNull().default(false),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const userAddresses = master.table('user_addresses', {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    label: text('label').notNull(),
    provinceId: bigint('province_id', { mode: 'number' }).notNull(),
    cityId: bigint('city_id', { mode: 'number' }).notNull(),
    address: text('address').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});
