import { Elysia, t } from "elysia";
import { RoomService } from "../services/room.service";
import { RoomMembersService } from "../services/room-members.service";

const roomService = new RoomService();
const roomMembersService = new RoomMembersService();

const requireAuth = (cookieValue: string | undefined): number => {
  if (!cookieValue) throw new Error("Not authenticated");
  return parseInt(cookieValue);
};

export function setupRoomRoutes(app: Elysia) {
  app.get("/rooms", async ({ cookie }: any) => {
    const userId = requireAuth(cookie.userId?.value);
    const allRooms = await roomService.getAllRooms();
    const userRooms = await roomService.getRoomsByUser(userId);
    const userRoomIds = new Set(userRooms.map((r) => r.id));
    const availableRooms = allRooms.filter((r) => !userRoomIds.has(r.id));
    return { username: "User", userId: userId, userRooms, availableRooms };
  });

  app.post(
    "/rooms",
    async ({ body, cookie, set }: any) => {
      const userId = requireAuth(cookie.userId?.value);
      const room = await roomService.createRoom(userId, body.name);
      await roomMembersService.joinRoom(userId, room!.id);
      set.status = 303;
      set.headers["Location"] = "/rooms";
      return null;
    },
    { body: t.Object({ name: t.String({ minLength: 1, maxLength: 50 }) }) },
  );

  app.post(
    "/rooms/:roomId/rename",
    async ({ params, body, cookie, set }: any) => {
      const userId = requireAuth(cookie.userId?.value);
      const roomId = parseInt(params.roomId);

      const result = await roomService.updateRoomName(
        roomId,
        userId,
        body.name,
      );

      if (!result.success) {
        set.status = result.reason === "not_owner" ? 403 : 404;
        return { success: false, message: result.reason };
      }

      set.status = 303;
      set.headers["Location"] = "/rooms";
      return null;
    },
    { body: t.Object({ name: t.String({ minLength: 1, maxLength: 50 }) }) },
  );

  app.delete("/rooms/:roomId", async ({ params, cookie }: any) => {
    const userId = requireAuth(cookie.userId?.value);
    const roomId = parseInt(params.roomId);
    const success = await roomService.deleteRoom(roomId, userId);
    if (!success)
      return { success: false, message: "Cannot delete (not owner)" };
    return { success: true };
  });

  app.post("/rooms/:roomId/delete", async ({ params, cookie, set }: any) => {
    const userId = requireAuth(cookie.userId?.value);
    const roomId = parseInt(params.roomId);
    const success = await roomService.deleteRoom(roomId, userId);

    set.status = 303;
    set.headers["Location"] = "/rooms";
    return null;
  });

  app.post("/rooms/:roomId/join", async ({ params, cookie, set }: any) => {
    const userId = requireAuth(cookie.userId?.value);
    const roomId = parseInt(params.roomId);
    const alreadyIn = await roomMembersService.isUserInRoom(userId, roomId);
    if (!alreadyIn) await roomMembersService.joinRoom(userId, roomId);
    const room = await roomService.getRoomById(roomId);
    set.status = 303;
    set.headers["Location"] = `/message?room=${room!.name}`;
    return null;
  });

  app.post("/rooms/:roomId/leave", async ({ params, cookie }: any) => {
    const userId = requireAuth(cookie.userId?.value);
    const roomId = parseInt(params.roomId);
    const success = await roomMembersService.leaveRoom(userId, roomId);
    return { success };
  });

  app.get("/rooms/:roomId/members", async ({ params }: any) => {
    const roomId = parseInt(params.roomId);
    return await roomMembersService.getRoomMembers(roomId);
  });

  return app;
}
