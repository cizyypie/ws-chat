import { db } from "../db";
import { rooms, room_members, users } from "../db/schema";
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

  async getAllRooms(){
    return await db.select({
        id:rooms.id,
        name: rooms.name,
        ownerName: users.username,
        ownerId: rooms.ownerId,
        cretedAt: rooms.createdAt
    })
    .from(rooms)
    .leftJoin(users, eq(rooms.ownerId, users.id)) //
    .execute();
  }

async getRoomsByUser(userId: number){
    return await db.select({
        id:rooms.id,
        name: rooms.name,
        ownerId: rooms.ownerId,
        cretedAt: rooms.createdAt
    })
    .from(rooms)
    .innerJoin(room_members, eq(rooms.id, room_members.roomId))
    .where(eq(room_members.userId, userId))
    .execute();
  }

  async getRoomsByOwner(userId: number) {
        return await db.select()
            .from(rooms)
            .where(eq(rooms.ownerId, userId))
            .execute();
    }

  async deleteRoom(roomId: number, userId:number){
    const room = await db.select()
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .execute();

    if(!room.length) return false;
    if(room[0]!.ownerId !== userId) return false

    await db.delete(rooms)
    .where(eq(rooms.id, roomId))
    .execute();

    return true;
  }
}
