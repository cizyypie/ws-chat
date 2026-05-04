import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { html } from "@elysiajs/html";
import { cookie } from "@elysiajs/cookie";
import ejs from "ejs";
import { apiRoutes } from "./routes/index";
import { AuthService, ChatService, RoomService,RoomMembersService, ViewService, WebSocketService,} from "./services/index.service";

const viewService = new ViewService(),
  wsService = new WebSocketService(),
  authService = new AuthService(),
  chatService = new ChatService(),
  roomMembersService = new RoomMembersService(),
  roomService = new RoomService();

const renderView = async (view: string, data: object = {}) => {
  const filePath = `${import.meta.dir}/views/${view}.ejs`;
  const template = await Bun.file(filePath).text();
  return ejs.render(template, data);
};

const app = new Elysia()
  .use(cors())
  .use(staticPlugin({ assets: "public", prefix: "/" }))
  .use(html())
  .use(cookie())
  .use(
    swagger({
      documentation: {
        info: {
          title: "Real-time Chat API",
          version: "1.0.0",
        },
      },
    }),
  )
  .use(apiRoutes)

  .get("/", ({ set }: any) => {
    set.status = 303;
    set.headers["Location"] = "/login";
  })

  .get("/login", async () => {
    return await renderView("login", { title: "Login" });
  })

  .get("/register", async () => {
    return await renderView("register", { title: "Signup" });
  })

  .get("/rooms", async ({ cookie, set }: any) => {
    if (!cookie.userId?.value) {
      set.status = 303;
      set.headers["Location"] = "/login";
      return null;
    }

    const userId = parseInt(cookie.userId.value);
    const pageData = await viewService.getRoomsPageData(userId);

    return await renderView("rooms", {
      userId: cookie.userId.value,
      username: cookie.username?.value || "User",
      ...pageData,
    });
  })

  .get("/chat", async ({ query, cookie, set }: any) => {
    if (!cookie.userId?.value) {
      set.status = 303;
      set.headers["Location"] = "/login";
      return null;
    }

    const roomName = query.room || "general";
    const userId = parseInt(cookie.userId.value);

    const allRooms = await roomService.getAllRooms();
    const room = allRooms.find((r: any) => r.name === roomName);

    if (!room) {
      set.status = 404;
      return await renderView("error", {
        message: `Room "${roomName}" not found. Create it first!`,
      });
    }

    return await renderView("chat", {
      userId: cookie.userId.value,
      username: cookie.username?.value || "Guest",
      room: roomName,
      roomId: room.id,
    });
  })

  .ws("/ws", {
    // When client connects
    open: (ws) => {
      console.log("🔗 WebSocket connection opened");
    },

    // When client sends message
    message: async (ws, message: any) => {
      try {
        // Parse the incoming message
        const data = message;

        console.log(data);

        switch (data.type) {
          case "join": {
            const userId = parseInt(data.userId);
            const roomId = parseInt(data.roomId);
            const username = data.username;

            await roomMembersService.joinRoom(userId, roomId);
            wsService.joinRoom(userId, roomId, ws);

            const recentMessages = await chatService.getRecentMessagesByRoom(roomId, 20);
    
            ws.send(
              JSON.stringify({
                type: "joined",
                roomId,
                userCount: wsService.getRoomUserCount(roomId),
                history: recentMessages
              }),
            );

            // Notify others
            wsService.broadcastToRoom(roomId, {
              type: "user_joined",
              username,
              userCount: wsService.getRoomUserCount(roomId),
            });

            break;
          }

          // User sends message
          case "message": {
            const userId = parseInt(data.userId);
            const roomId = parseInt(data.roomId);
            const content = data.content;
            const username = data.username;

            // Save to database
            const savedMessage = await chatService.saveMessage(
              userId,
              roomId,
              content,
            );
            if (!savedMessage) {
              console.error("Failed to save message to database");
              break;
            }
            // Broadcast to room
            wsService.broadcastToRoom(roomId, {
              type: "message",
              id: savedMessage.id,
              username,
              userId,
              content,
              createdAt: new Date().toISOString(),
              isOwn: false,
            });

            break;
          }

          // User edits message (BONUS)
          case "edit_message": {
            const userId = parseInt(data.userId);
            const messageId = parseInt(data.messageId);
            const newContent = data.content;

            const edited = await chatService.editMessage(
              messageId,
              userId,
              newContent,
            );

            if (edited) {
              const userInfo = wsService.getUserInfo(ws);
              if (userInfo) {
                wsService.broadcastToRoom(userInfo.roomId, {
                  type: "message_edited",
                  messageId,
                  content: newContent,
                  editedAt: new Date().toISOString(),
                });
              }
            }

            break;
          }

          // User deletes message (BONUS)
          case "delete_message": {
            const userId = parseInt(data.userId);
            const messageId = parseInt(data.messageId);

            const deleted = await chatService.deleteMessage(messageId, userId);

            if (deleted) {
              const userInfo = wsService.getUserInfo(ws);
              if (userInfo) {
                wsService.broadcastToRoom(userInfo.roomId, {
                  type: "message_deleted",
                  messageId,
                });
              }
            }

            break;
          }

          // User leaves room
          case "leave": {
            const userInfo = wsService.getUserInfo(ws);
            if (userInfo) {
              const roomId = userInfo.roomId;
              const username = data.username;

              wsService.leaveRoom(ws);

              wsService.broadcastToRoom(roomId, {
                type: "user_left",
                username,
                userCount: wsService.getRoomUserCount(roomId),
              });
            }

            break;
          }

          default:
            console.warn("Unknown message type:", data.type);
        }
      } catch (e) {
        console.error("Error processing message", e);
      }
    },

    // When client disconnects
    close: (ws) => {
      console.log("🔌 WebSocket connection closed");
      wsService.leaveRoom(ws);
    },
  })

  .listen(3000);

console.log(`🚀 Server running at http://localhost:3000`);
console.log(`📚 Swagger at http://localhost:3000/swagger`);
