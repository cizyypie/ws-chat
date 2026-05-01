import { Elysia, t } from 'elysia'; // 🛠️ Fixed: Changed 't00000' to 't'
import { AuthService } from '../services/auth.service';
// 🛠️ Fixed: Deleted the '@elysiajs/cookie' import completely

const authService = new AuthService();

export function setupAuthRoutes(app: Elysia) {
    
    app.get('/login', ({ cookie }) => {
        const userId = cookie.userId?.value;
        if (userId) {
            return new Response('Redirect', { 
                status: 303, 
                headers: { 'Location': '/chat' } 
            });
        }
        
        return Bun.file('./views/login.ejs');
    });

    app.post('/login',
        async ({ body, cookie, set }) => {
            const user = await authService.validateUser(
                body.username,
                body.password
            );
            
            if (!user) {
                return { 
                    success: false, 
                    message: 'Invalid username or password' 
                };
            }
            
            cookie.userId.value = String(user.id);
            cookie.username.value = user.username;
            
            set.status = 303;
            set.headers['Location'] = '/chat';
            return null;
        },
        {
            body: t.Object({
                username: t.String({ minLength: 1 }),
                password: t.String({ minLength: 3 })
            })
        }
    );
    
    // Route 3: Show register page
    app.get('/register', () => {
        return Bun.file('./views/register.ejs');
    });
    
    // Route 4: Handle registration
    app.post('/register',
        async ({ body, cookie, set }) => {
            const result = await authService.registerUser(
                body.username,
                body.password
            );
            
            if (!result.success) {
                return { success: false, message: result.message };
            }
            
            // Note: Make sure result.user is defined in your AuthService when success is true!
            const user = result.user!; 
            
            // Set cookie
            cookie.userId.value = String(user.id);
            cookie.username.value = user.username;
            
            // Redirect to chat
            set.status = 303;
            set.headers['Location'] = '/chat';
            return null;
        },
        {
            body: t.Object({
                username: t.String({ minLength: 1 }),
                password: t.String({ minLength: 3 })
            })
        }
    );
    
    // Route 5: Logout
    app.get('/logout', ({ cookie, set }) => {
        cookie.userId.remove();
        cookie.username.remove();
        
        set.status = 303;
        set.headers['Location'] = '/login';
        return null;
    });
    
    return app;
}