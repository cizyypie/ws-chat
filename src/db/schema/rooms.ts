import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

import { users } from './users';

export const rooms = pgTable('rooms', {
    id: serial('id').primaryKey(),
    name: text('name').notNull() ,
    ownerId: integer('owner_id').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow()
});