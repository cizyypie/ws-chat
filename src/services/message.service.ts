import { db } from "../db";
import { messages, users } from "../db/schema";
import { eq, and } from "drizzle-orm";

export class MessageService {
  async getRecentMessages(limit: number = 50) {
    return await db
      .select({
        id: messages.id,
        content: messages.content,
        username: users.username,
        createdAt: messages.createdAt,
        editedAt: messages.editedAt,
        isDeleted: messages.isDeleted,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .limit(limit)
      .orderBy(messages.createdAt)
      .execute();
  }
  async getRecentMessagesByRoom(roomId: number, limit: number = 50) {
    return await db
      .select({
        id: messages.id,
        content: messages.content,
        username: users.username,
        userId: messages.userId,
        createdAt: messages.createdAt,
        editedAt: messages.editedAt,
        isDeleted: messages.isDeleted,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .where(and(eq(messages.roomId, roomId), eq(messages.isDeleted, false)))
      .limit(limit)
      .orderBy(messages.createdAt)
      .execute();
  }

  async saveMessage(userId: number, roomId: number, content: string) {
    const result = await db
      .insert(messages)
      .values({
        content,
        userId,
        roomId,
      })
      .returning()
      .execute();

    const messageWithUser = await db
      .select({
        id: messages.id,
        content: messages.content,
        username: users.username,
        userId: messages.userId,
        roomId: messages.roomId,
        createdAt: messages.createdAt,
        editedAt: messages.editedAt,
        isDeleted: messages.isDeleted,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.id, result[0]!.id))
      .execute();

    return messageWithUser[0];
  }

  async editMessage(messageId: number, userId: number, newContent: string) {
    const message = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .execute();

    if (!message.length) return null;
    if (message[0]!.userId !== userId) return null; // Not owner!
    
    const ageInSeconds =
      (Date.now() - new Date(message[0]!.createdAt as Date).getTime()) / 1000;

    if (ageInSeconds > 300) return null; // Can't edit after 5 min

    const result = await db
      .update(messages)
      .set({
        content: newContent,
        editedAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning()
      .execute();

    return result[0];
  }


  async deleteMessage(messageId: number, userId: number) {
    const message = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .execute();

    if (!message.length) return false;
    if (message[0]!.userId !== userId) return false; // Not owner!

    await db
      .update(messages)
      .set({ isDeleted: true })
      .where(eq(messages.id, messageId))
      .execute();

    return true;
  }
}
