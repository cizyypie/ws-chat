import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';

import { apiRoutes } from './routes/index';

const app = new Elysia()
    .use(cors())
    .use(staticPlugin())
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
    
    // Chat page (show chat.ejs)
    .get('/chat', ({ cookie }) => {
        if (!cookie.userId?.value) {
            // Not logged in, redirect
            return new Response('Redirect', {
                status: 303,
                headers: { 'Location': '/login' }
            });
        }
        return Bun.file('./views/chat.ejs');
    })
    
    .listen(3000);

console.log(`🚀 Server running at http://localhost:3000`);
console.log(`📚 Swagger at http://localhost:3000/swagger`);