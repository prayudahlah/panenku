import { pgTable, serial, varchar, integer, timestamp, date } from 'drizzle-orm/pg-core';
import { users } from './users';

export const panen = pgTable('panen', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  komoditas: varchar('komoditas', { length: 255 }).notNull(),
  jumlah: integer('jumlah').notNull(),
  satuan: varchar('satuan', { length: 50 }).notNull(),
  tanggalPanen: date('tanggal_panen').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
