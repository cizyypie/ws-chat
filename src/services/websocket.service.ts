export class WebSocketService {
  private roomConnections = new Map<number, Set<any>>();
  private wsUserMap = new Map<any, { userId: number; roomId: number }>();
  private userRoomMap = new Map<string, any>();

  joinRoom(userId: number, roomId: number, ws: any) {
    const key = `${userId}-${roomId}`;
    this.userRoomMap.set(key, ws);
    this.wsUserMap.set(ws, { userId, roomId });

    if (!this.roomConnections.has(roomId)) {
      this.roomConnections.set(roomId, new Set());
    }
    this.roomConnections.get(roomId)!.add(ws);

    console.log(`User ${userId} joined room ${roomId}`);
    console.log(
      `Total connections in room ${roomId}: ${this.roomConnections.get(roomId)!.size}`,
    );
  }

  removeUserFromRoom(userId: number, roomId: number) {
    const key = `${userId}-${roomId}`;
    const oldWs = this.userRoomMap.get(key);

    if (oldWs) {
      console.log(
        `Removing old connection for user ${userId} in room ${roomId}`,
      );

      const roomSet = this.roomConnections.get(roomId);
      if (roomSet) {
        roomSet.delete(oldWs);
      }

      this.wsUserMap.delete(oldWs);
      this.userRoomMap.delete(key);

      console.log(
        `Removed old connection. Remaining in room: ${roomSet ? roomSet.size : 0}`,
      );
    }
  }

  leaveRoom(ws: any) {
    const connection = this.wsUserMap.get(ws);
    if (!connection) return;

    const { userId, roomId } = connection;
    const roomSet = this.roomConnections.get(roomId);
    if (roomSet) {
      roomSet.delete(ws);
    }
    this.wsUserMap.delete(ws);
    this.userRoomMap.delete(`${userId}-${roomId}`);

    console.log(`User ${userId} left room ${roomId}`);
  }

  broadcastToRoom(roomId: number, message: any, excludeWs?: any) {
    const connections = this.roomConnections.get(roomId);
    if (!connections) {
      console.log(`No connections in room ${roomId}`);
      return;
    }

    let sentCount = 0;
    connections.forEach((ws) => {
      if (excludeWs && ws === excludeWs) {
        console.log(`Skipping excluded WebSocket`);
        return;
      }
      try {
        console.log(`Sending to WebSocket connection`);
        ws.send(JSON.stringify(message));
        sentCount++;
      } catch (error) {
        console.error(`Error sending to user:`, error);
      }
    });

    console.log(`Broadcast complete. Sent to ${sentCount} users`);
  }

  isConnected(ws: any): boolean {
    return this.wsUserMap.has(ws);
  }

  getUserInfo(ws: any) {
    return this.wsUserMap.get(ws) || null;
  }
}
