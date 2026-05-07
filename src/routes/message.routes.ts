import { Elysia, t } from "elysia";
import { MessageService } from "../services/message.service";

const messageService = new MessageService();

const requireAuth = (cookieValue: string | undefined): number => {
  if (!cookieValue) {
    throw new Error("Not authenticated");
  }
  return parseInt(cookieValue);
};

export function setupMessageRoutes(app: Elysia) {
  // GET /rooms/:roomId/messages
  app.get("/rooms/:roomId/messages", async ({ params, query }: any) => {
    const roomId = parseInt(params.roomId as string);
    const limit = parseInt((query.limit as string) || "50");

    return await messageService.getRecentMessagesByRoom(roomId, limit);
  });

  // POST /rooms/:roomId/messages
  app.post(
    "/rooms/:roomId/messages",
    async ({ params, body, cookie }: any) => {
      // Type the cookie value
      const userId = requireAuth(cookie.userId?.value as string | undefined);
      const roomId = parseInt(params.roomId as string);

      const message = await messageService.saveMessage(
        userId,
        roomId,
        body.content,
      );

      return { success: true, message };
    },
    {
      body: t.Object({
        content: t.String({ minLength: 1 }),
      }),
    },
  );

  // PUT /messages/:messageId
  app.put(
    "/messages/:messageId",
    async ({ params, body, cookie }: any) => {
      const userId = requireAuth(cookie.userId?.value as string | undefined);
      const messageId = parseInt(params.messageId as string);

      const message = await messageService.editMessage(
        messageId,
        userId,
        body.content,
      );

      if (!message) {
        return {
          success: false,
          message: "Cannot edit (not owner)",
        };
      }

      return { success: true, message };
    },
    {
      body: t.Object({
        content: t.String({ minLength: 1 }),
      }),
    },
  );

  // DELETE /messages/:messageId
  app.delete("/messages/:messageId", async ({ params, cookie }: any) => {
    const userId = requireAuth(cookie.userId?.value as string | undefined);
    const messageId = parseInt(params.messageId as string);

    const success = await messageService.deleteMessage(messageId, userId);

    if (!success) {
      return {
        success: false,
        message: "Cannot delete (not owner)",
      };
    }

    return { success: true };
  });

  return app;
}
