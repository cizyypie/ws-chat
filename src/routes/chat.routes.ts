import { Elysia, t } from 'elysia';
import { ChatService } from '../services/chat.service';

const chatService = new ChatService();

const requireAuth = (userId?: string) => {
    if (!userId) throw new Error('Not authenticated');
    return parseInt(userId);
};

export function setupChatRoutes(app: Elysia) {
    
    // Route 1: Get messages in room
    // GET /rooms/:roomId/messages
    app.get('/rooms/:roomId/messages',
        async ({ params, query }) => {
            const roomId = parseInt(params.roomId);
            const limit = parseInt(query.limit || '50');
            
            return await chatService.getRecentMessagesByRoom(roomId, limit);
        }
    );
    
    // Route 2: Send message
    // POST /rooms/:roomId/messages
    app.post('/rooms/:roomId/messages',
        async ({ params, body, cookie }) => {
            const userId = requireAuth(cookie.userId?.value);
            const roomId = parseInt(params.roomId);
            
            const message = await chatService.saveMessage(
                userId,
                roomId,
                body.content
            );
            
            return { success: true, message };
        },
        {
            body: t.Object({
                content: t.String({ minLength: 1 })
            })
        }
    );
    
    // Route 3: Edit message (BONUS)
    // PUT /messages/:messageId
    app.put('/messages/:messageId',
        async ({ params, body, cookie }) => {
            const userId = requireAuth(cookie.userId?.value);
            const messageId = parseInt(params.messageId);
            
            const message = await chatService.editMessage(
                messageId,
                userId,
                body.content
            );
            
            if (!message) {
                return {
                    success: false,
                    message: 'Cannot edit (not owner)'
                };
            }
            
            return { success: true, message };
        },
        {
            body: t.Object({
                content: t.String({ minLength: 1 })
            })
        }
    );
    
    // Route 4: Delete message (BONUS)
    // DELETE /messages/:messageId
    app.delete('/messages/:messageId',
        async ({ params, cookie }) => {
            const userId = requireAuth(cookie.userId?.value);
            const messageId = parseInt(params.messageId);
            
            const success = await chatService.deleteMessage(messageId, userId);
            
            if (!success) {
                return {
                    success: false,
                    message: 'Cannot delete (not owner)'
                };
            }
            
            return { success: true };
        }
    );
    
    return app;
}