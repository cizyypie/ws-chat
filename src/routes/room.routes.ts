import { Elysia, t } from 'elysia';
import { RoomService } from '../services/room.service';
import { RoomMembersService } from '../services/room-members.service';

const roomService = new RoomService();
const roomMembersService = new RoomMembersService();

const requireAuth = (cookieValue: string | undefined): number => {
    if (!cookieValue) {
        throw new Error('Not authenticated');
    }
    return parseInt(cookieValue);
};

export function setupRoomRoutes(app: Elysia) {
    
    // GET /rooms - List all rooms
    app.get('/rooms',
        async ({ cookie }: any) => {
            const userId = requireAuth(cookie.userId?.value as string | undefined);
            
            const allRooms = await roomService.getAllRooms();
            const userRooms = await roomService.getRoomsByUser(userId);
            
            return {
                allRooms,
                userRooms,
                userId
            };
        }
    );

   // POST /rooms - Create new room
    app.post('/rooms',
        async ({ body, cookie, set }: any) => { 
            const userId = requireAuth(cookie.userId?.value as string | undefined);
            
            const room = await roomService.createRoom(userId, body.name as string);
            
            // Auto join the creator
            await roomMembersService.joinRoom(userId, room!.id);
            
            // Tell the browser to immediately redirect back to the rooms list
            set.status = 303;
            set.headers['Location'] = '/rooms';
            return null; 
        },
        {
            body: t.Object({
                name: t.String({ minLength: 1, maxLength: 50 })
            })
        }
    );
    
    // DELETE /rooms/:roomId
    app.delete('/rooms/:roomId',
        async ({ params, cookie }: any) => {
            const userId = requireAuth(cookie.userId?.value as string | undefined);
            const roomId = parseInt(params.roomId as string);
            
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
    
    // POST /rooms/:roomId/join
    app.post('/rooms/:roomId/join',
        async ({ params, cookie, set }: any) => {
            const userId = requireAuth(cookie.userId?.value as string | undefined);
            const roomId = parseInt(params.roomId as string);
            
            // 1. Join the room in the DB
            await roomMembersService.joinRoom(userId, roomId);
            
            // 2. Look up the room name so we know where to redirect
            const room = await roomService.getRoomById(roomId); 
            
            if (!room) {
                set.status = 404;
                return { error: 'Room not found' };
            }

            // 3. Redirect to the chat route using the room name
            set.status = 303;
            set.headers['Location'] = `/chat?room=${room.name}`;
            return null;
        }
    );
    
    // POST /rooms/:roomId/leave
    app.post('/rooms/:roomId/leave',
        async ({ params, cookie }: any) => {
            const userId = requireAuth(cookie.userId?.value as string | undefined);
            const roomId = parseInt(params.roomId as string);
            
            const success = await roomMembersService.leaveRoom(userId, roomId);
            
            return { success };
        }
    );
    
    // GET /rooms/:roomId/members
    app.get('/rooms/:roomId/members',
        async ({ params }: any) => {
            const roomId = parseInt(params.roomId as string);
            
            return await roomMembersService.getRoomMembers(roomId);
        }
    );
    
    return app;
}