export class WebSocketService {
  private roomConnections = new Map<number, Set<any>>();
  private wsUserMap = new Map<any, { userId: number; roomId: number }>();

  joinRoom(userId: number, roomId: number, ws: any) {
    this.wsUserMap.set(ws, { userId, roomId });

    if (!this.roomConnections.has(roomId)) {
      this.roomConnections.set(roomId, new Set());
    }
    this.roomConnections.get(roomId)!.add(ws);

    console.log(`User ${userId} joined room ${roomId}`);
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

    console.log(`User ${userId} left room ${roomId}`);
  }

  broadcastToRoom(roomId: number, message: any) {
    const connections = this.roomConnections.get(roomId);
    if (!connections) return;
    connections.forEach((ws) => {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error("Error sending to user:", error);
      }
    });

    console.log(`📤 Broadcast to room ${roomId}: ${connections.size} users`);
  }

  getRoomUserCount(roomId: number): number {
    const connections = this.roomConnections.get(roomId);
    return connections ? connections.size : 0;
  }

  isConnected(ws: any): boolean {
    return this.wsUserMap.has(ws);
  }

  getUserInfo(ws: any) {
    return this.wsUserMap.get(ws) || null;
  }
}
