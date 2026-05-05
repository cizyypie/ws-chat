import { db } from '../db';
import { room_members, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export class RoomMembersService {
    
    async joinRoom(userId: number, roomId: number) {
        try {
            const result = await db.insert(room_members).values({
                userId,
                roomId
            }).returning().execute();

            return { success: true, data: result[0] };
        } catch (error) {
            console.error("Join Room Error:", error);
            return { success: false, message: 'Failed' };
        }
    }

    async leaveRoom(userId: number, roomId: number) {
        const result = await db.delete(room_members)
            .where(
                and(
                    eq(room_members.userId, userId),
                    eq(room_members.roomId, roomId)
                )
            )
            .execute();
        
        return result.rowCount > 0;
    }

    async getRoomMembers(roomId: number) {
        return await db.select({
            id: users.id,
            username: users.username,
            createdAt: room_members.createdAt
        })
        .from(room_members)
        .innerJoin(users, eq(room_members.userId, users.id))
        .where(eq(room_members.roomId, roomId))
        .execute();
    }

    async isUserInRoom(userId: number, roomId: number) {
        const result = await db.select()
            .from(room_members)
            .where(
                and(
                    eq(room_members.userId, userId),
                    eq(room_members.roomId, roomId)
                )
            )
            .execute();
        
        return result.length > 0;
    }
}