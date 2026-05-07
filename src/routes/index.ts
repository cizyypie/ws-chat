import { Elysia } from "elysia";
import { setupAuthRoutes } from "./auth.routes";
import { setupRoomRoutes } from "./room.routes";
import { setupMessageRoutes } from "./message.routes";

export const apiRoutes = new Elysia()
  .use(setupAuthRoutes)
  .use(setupRoomRoutes)
  .use(setupMessageRoutes);
