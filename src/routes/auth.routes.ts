import { Elysia, t } from 'elysia';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export function setupAuthRoutes(app: Elysia) {
    
    // GET /login - Show login page
    app.get('/login', ({ cookie }: any) => {
        // Check if already logged in
        const userId = cookie.userId?.value;
        if (userId) {
            return new Response('Redirect', { 
                status: 303, 
                headers: { 'Location': '/rooms' } 
            });
        }
        
        return Bun.file('./views/login.ejs');
    });

    // POST /login - Handle login form
    app.post('/login',
        async ({ body, cookie, set }: any) => {
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
            set.headers['Location'] = '/rooms';
            return null;
        },
        {
            body: t.Object({
                username: t.String({ minLength: 1 }),
                password: t.String({ minLength: 3 })
            })
        }
    );
    
    // GET /register - Show register page
    app.get('/register', () => {
        return Bun.file('./views/register.ejs');
    });
    
    // POST /register - Handle registration
    app.post('/register',
        async ({ body, cookie, set }: any) => {
            const result = await authService.registerUser(
                body.username,
                body.password
            );
            
            if (!result.success) {
                return { success: false, message: result.message };
            }
            
            const user = result.user;
            if (!user) {
                return { success: false, message: 'User not created' };
            }
            
            cookie.userId.value = String(user.id);
            cookie.username.value = user.username;
            
            set.status = 303;
            set.headers['Location'] = '/rooms';
            return null;
        },
        {
            body: t.Object({
                username: t.String({ minLength: 1 }),
                password: t.String({ minLength: 3 })
            })
        }
    );
    
    // GET /logout - Clear cookies
    app.get('/logout', ({ cookie, set }: any) => {
        cookie.userId.value = '';
        cookie.username.value = '';
        
        set.status = 303;
        set.headers['Location'] = '/login';
        return null;
    });
    
    return app;
}