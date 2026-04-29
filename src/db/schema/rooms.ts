import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

import { users } from './users';

export const rooms = pgTable('rooms', {
    id: serial('id').primaryKey(),
    name: text('room_name').notNull() ,
    userId: integer('owner_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow()
});