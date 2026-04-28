import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

import { users } from './users';

export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    content: text('content').notNull(),
    userId: integer('user_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow()
});