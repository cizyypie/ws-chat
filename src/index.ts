import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import { html } from '@elysiajs/html';
import ejs from 'ejs';            
import { apiRoutes } from './routes/index';

const renderView = async (view: string, data: object = {}) => {
  const filePath = `${import.meta.dir}/views/${view}.ejs`;
  const template = await Bun.file(filePath).text();
  return ejs.render(template, data);
};

const app = new Elysia()
    .use(cors())
    .use(staticPlugin())
    .use(html())                     
    .use(swagger({
        documentation: {
            info: {
                title: 'Real-time Chat API',
                version: '1.0.0'
            }
        }
    }))
    .use(apiRoutes)
    
    // Home page redirect
    .get('/', ({ set }) => {
        set.status = 303;
        set.headers['Location'] = '/login';
    })
    
    .get('/login', async () => {
        return await renderView('login', { title: 'Login' }); 
    })
    
    .get('/register', async () => {
        return await renderView('register', { title: 'Signup' }); 
    })
    
    // Chat page
    .get('/chat', async ({ query, cookie }) => {
        // 1. Check if logged in
        if (!cookie.userId?.value) {
            return new Response('Redirect', {
                status: 303,
                headers: { 'Location': '/login' }
            });
        }
        
        // 2. Get the room name from the URL (e.g., /chat?room=gaming)
        // If they just go to /chat, default to 'general'
        const roomName = query.room || 'general'; 
        
        // 3. Pass BOTH userId and room to the EJS template!
        return await renderView('chat', { 
            userId: cookie.userId.value,
            room: roomName
        });
    })
    
    .listen(3000);

console.log(`🚀 Server running at http://localhost:3000`);
console.log(`📚 Swagger at http://localhost:3000/swagger`);