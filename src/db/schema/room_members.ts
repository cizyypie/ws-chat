import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

import { users } from './users';
import { rooms } from './rooms';

export const room_members = pgTable('room_members', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    roomId: integer ('room_id').references(() => rooms.id).notNull(),
    createdAt: timestamp('created_at').defaultNow()
});