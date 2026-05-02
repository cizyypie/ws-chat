import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export class AuthService {

    async validateUser(username: string, password: string) {
        const user = await db.select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1)
            .execute();

        if (!user.length) return null;
        return user[0]; // ← RETURN THE USER!
    }

    async registerUser(username: string, password: string) {
        const existing = await db.select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1)
            .execute();

        if (existing.length > 0) {
            return { success: false, message: 'Username already taken' };
        }

        try {
            const newUser = await db.insert(users)
                .values({ username })
                .returning()
                .execute();

            return { success: true, user: newUser[0] };
        } catch (error) {
            return { success: false, message: 'Registration failed' };
        }
    }
}