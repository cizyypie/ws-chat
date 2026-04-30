import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { rooms } from './rooms';

export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    content: text('content').notNull(),
    userId: integer('user_id').references(() => users.id),
    roomId: integer ('room_id').references(() => rooms.id),
    createdAt: timestamp('created_at').defaultNow(),
    editedAt: timestamp('edited_at'), 
    isDeleted: boolean('is_deleted').default(false) 
});