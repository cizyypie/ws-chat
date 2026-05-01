import { Elysia, t } from 'elysia';
import { RoomService } from '../services/room.service';
import { RoomMembersService } from '../services/room-members.service';

const roomService = new RoomService();
const roomMembersService = new RoomMembersService();

// Middleware: Check if user is logged in
const requireAuth = (userId?: string) => {
    if (!userId) {
        throw new Error('Not authenticated');
    }
    return parseInt(userId);
};

export function setupRoomRoutes(app: Elysia) {
    
    app.get('/rooms',
        async ({ cookie }) => {
            const userId = requireAuth(cookie.userId?.value);
            
            // Get all rooms with owner info
            const allRooms = await roomService.getAllRooms();
            
            // Get rooms user is in
            const userRooms = await roomService.getRoomsByUser(userId);
            
            return {
                allRooms,
                userRooms,
                userId
            };
        }
    );
    
    // Route 2: Create new room
    // POST /rooms → create room
    app.post('/rooms',
        async ({ body, cookie }) => {
            const userId = requireAuth(cookie.userId?.value);
            
            const room = await roomService.createRoom(userId, body.name);
            
            // Auto join the creator
            await roomMembersService.joinRoom(userId, room.id);
            
            return {
                success: true,
                room
            };
        },
        {
            body: t.Object({
                name: t.String({ minLength: 1, maxLength: 50 })
            })
        }
    );
    
    // Route 3: Delete room (only owner)
    // DELETE /rooms/:roomId
    app.delete('/rooms/:roomId',
        async ({ params, cookie }) => {
            const userId = requireAuth(cookie.userId?.value);
            const roomId = parseInt(params.roomId);
            
            const success = await roomService.deleteRoom(roomId, userId);
            
            if (!success) {
                return {
                    success: false,
                    message: 'Cannot delete (not owner)'
                };
            }
            
            return { success: true };
        }
    );
    
    // Route 4: Join room
    // POST /rooms/:roomId/join
    app.post('/rooms/:roomId/join',
        async ({ params, cookie }) => {
            const userId = requireAuth(cookie.userId?.value);
            const roomId = parseInt(params.roomId);
            
            const result = await roomMembersService.joinRoom(userId, roomId);
            
            return result;
        }
    );
    
    // Route 5: Leave room
    // POST /rooms/:roomId/leave
    app.post('/rooms/:roomId/leave',
        async ({ params, cookie }) => {
            const userId = requireAuth(cookie.userId?.value);
            const roomId = parseInt(params.roomId);
            
            const success = await roomMembersService.leaveRoom(userId, roomId);
            
            return { success };
        }
    );
    
    // Route 6: Get room members
    // GET /rooms/:roomId/members
    app.get('/rooms/:roomId/members',
        async ({ params }) => {
            const roomId = parseInt(params.roomId);
            
            return await roomMembersService.getRoomMembers(roomId);
        }
    );
    
    return app;
}