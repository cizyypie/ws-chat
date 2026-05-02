import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import { html } from '@elysiajs/html';
import { cookie } from '@elysiajs/cookie'; // ✅ ADD THIS IMPORT
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
    .use(cookie())
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
    .get('/', ({ set }: any) => {
        set.status = 303;
        set.headers['Location'] = '/login';
    })
    
    .get('/login', async () => {
        return await renderView('login', { title: 'Login' }); 
    })
    
    .get('/register', async () => {
        return await renderView('register', { title: 'Signup' }); 
    })
    
    .get('/rooms', async ({ cookie, set }: any) => {
        if (!cookie.userId?.value) {
            set.status = 303;
            set.headers['Location'] = '/login';
            return null;
        }
        return await renderView('rooms', { 
            userId: cookie.userId.value,
            username: cookie.username?.value || 'User'
        });
    })
    
    // Chat page
    .get('/chat', async ({ query, cookie, set }: any) => {
        if (!cookie.userId?.value) {
            set.status = 303;
            set.headers['Location'] = '/login';
            return null;
        }
        
        const roomName = query.room || 'general'; 
        
        return await renderView('chat', { 
            userId: cookie.userId.value,
            room: roomName
        });
    })
    
    .listen(3000);

console.log(`🚀 Server running at http://localhost:3000`);
console.log(`📚 Swagger at http://localhost:3000/swagger`);