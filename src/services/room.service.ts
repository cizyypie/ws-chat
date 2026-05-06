import { db } from "../db";
import { rooms, room_members, users, messages } from "../db/schema";
import { eq } from "drizzle-orm";

export class RoomService {
  async createRoom(ownerId: number, name: string) {
    const result = await db
      .insert(rooms)
      .values({ name, ownerId })
      .returning()
      .execute();
    return result[0];
  }

  async getAllRooms() {
    return await db
      .select({
        id: rooms.id,
        name: rooms.name,
        ownerName: users.username,
        ownerId: rooms.ownerId,
        createdAt: rooms.createdAt,
      })
      .from(rooms)
      .leftJoin(users, eq(rooms.ownerId, users.id))
      .execute();
  }

  async getRoomById(roomId: number) {
    const result = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, roomId))
      .execute();

    return result[0] || null;
  }

  async getRoomsByUser(userId: number) {
    return await db
      .select({
        id: rooms.id,
        name: rooms.name,
        ownerId: rooms.ownerId,
        createdAt: rooms.createdAt,
      })
      .from(rooms)
      .innerJoin(room_members, eq(rooms.id, room_members.roomId))
      .where(eq(room_members.userId, userId))
      .execute();
  }

  async getRoomsByOwner(userId: number) {
    return await db
      .select()
      .from(rooms)
      .where(eq(rooms.ownerId, userId))
      .execute();
  }

async deleteRoom(roomId: number, userId: number) {
  const room = await db
    .select()
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .execute();

  if (!room.length) return false;         
  if (room[0]!.ownerId !== userId) return false; 

  await db
    .delete(messages)
    .where(eq(messages.roomId, roomId))
    .execute();

  await db
    .delete(room_members)
    .where(eq(room_members.roomId, roomId))
    .execute();
    
  await db
    .delete(rooms)
    .where(eq(rooms.id, roomId))
    .execute();

  return true;
}

  async updateRoomName(roomId: number, userId: number, newName: string) {
    const room = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, roomId))
      .execute();

    if (!room.length) return { success: false, reason: "not_found" };
    if (room[0]!.ownerId !== userId) return { success: false, reason: "not_owner" };

    const updated = await db
      .update(rooms)
      .set({ name: newName })
      .where(eq(rooms.id, roomId))
      .returning()
      .execute();

    return { success: true, room: updated[0] };
  }
}