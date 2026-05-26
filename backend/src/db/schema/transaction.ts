import {
  pgSchema,
  integer,
  bigint,
  text,
  timestamp,
  numeric,
  date,
  time,
} from 'drizzle-orm/pg-core';

export const transaction = pgSchema('transaction');

export const negotiations = transaction.table('negotiations', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  sellerId: bigint('seller_id', { mode: 'number' }).notNull(),
  buyerId: bigint('buyer_id', { mode: 'number' }).notNull(),
  productId: bigint('product_id', { mode: 'number' }),
  agreedPriceOffer: numeric('agreed_price_offer', { precision: 12, scale: 2 }).notNull(),
  agreedUnitId: integer('agreed_unit_id').notNull(),
  agreedQuantityOffer: numeric('agreed_quantity_offer', { precision: 10, scale: 2 }).notNull(),
  validUntil: timestamp('valid_until', { mode: 'date' }).notNull(),
  status: text('status').notNull().default('ongoing'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

export const negotiationChats = transaction.table('negotiation_chats', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  negotiationId: bigint('negotiation_id', { mode: 'number' }).notNull(),
  turnOrder: integer('turn_order').notNull(),
  turnOwner: text('turn_owner').notNull(),
  offerPrice: numeric('offer_price', { precision: 12, scale: 2 }).notNull(),
  unitId: integer('unit_id').notNull(),
  quantityOffer: numeric('quantity_offer', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const payments = transaction.table('payments', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  paymentMethodId: integer('payment_method_id').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  paymentStatusId: integer('payment_status_id').notNull(),
  transactionId: text('transaction_id'),
  paidAt: timestamp('paid_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

export const carts = transaction.table('carts', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const cartItems = transaction.table('cart_items', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  cartId: bigint('cart_id', { mode: 'number' }).notNull(),
  productId: bigint('product_id', { mode: 'number' }).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unitId: integer('unit_id').notNull(),
  addedAt: timestamp('added_at', { mode: 'date' }).defaultNow(),
});

export const shipments = transaction.table('shipments', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  courierName: text('courier_name'),
  provinceId: bigint('province_id', { mode: 'number' }).notNull(),
  cityId: bigint('city_id', { mode: 'number' }).notNull(),
  shippingAddress: text('shipping_address').notNull(),
  shipmentStatusId: integer('shipment_status_id').notNull(),
  shippedAt: timestamp('shipped_at', { mode: 'date' }),
  deliveredAt: timestamp('delivered_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

export const checkouts = transaction.table('checkouts', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  buyerId: bigint('buyer_id', { mode: 'number' }).notNull(),
  paymentId: bigint('payment_id', { mode: 'number' }),
  totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull().default('0'),
  shippingAddress: text('shipping_address').notNull(),
  checkoutStatusId: integer('checkout_status_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

export const orders = transaction.table('orders', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  checkoutId: bigint('checkout_id', { mode: 'number' }).notNull(),
  shipmentId: bigint('shipment_id', { mode: 'number' }).notNull().unique(),
  orderNumber: text('order_number').notNull().unique(),
  sellerId: bigint('seller_id', { mode: 'number' }).notNull(),
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

export const orderItems = transaction.table('order_items', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  orderId: bigint('order_id', { mode: 'number' }).notNull(),
  productId: bigint('product_id', { mode: 'number' }).notNull(),
  orderItemStatusId: integer('order_item_status_id').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unitId: integer('unit_id').notNull(),
  pricePerUnit: numeric('price_per_unit', { precision: 12, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 12, scale: 2 }).default('0'),
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(),
  negotiationId: bigint('negotiation_id', { mode: 'number' }),
});

export const contracts = transaction.table('contracts', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  buyerId: bigint('buyer_id', { mode: 'number' }).notNull(),
  sellerId: bigint('seller_id', { mode: 'number' }).notNull(),
  shipmentId: bigint('shipment_id', { mode: 'number' }).notNull().unique(),
  paymentId: bigint('payment_id', { mode: 'number' }),
  totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull(),
  deliveryLocation: text('delivery_location').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  frequency: text('frequency').notNull().default('weekly'),
  totalShipping: integer('total_shipping').notNull().default(0),
  description: text('description'),
  contractStatusId: integer('contract_status_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

export const contractProducts = transaction.table('contract_products', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  contractId: bigint('contract_id', { mode: 'number' }).notNull(),
  productId: bigint('product_id', { mode: 'number' }).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unitId: integer('unit_id').notNull(),
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(),
  totalQuantity: numeric('total_quantity', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const contractSchedules = transaction.table('contract_schedules', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  contractId: bigint('contract_id', { mode: 'number' }).notNull(),
  deliveryDay: text('delivery_day'),
  deliveryDate: date('delivery_date'),
  deliveryTime: time('delivery_time'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});
