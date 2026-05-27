import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { join, extname } from 'node:path';
import { promises as fs } from 'node:fs';
import handler from './dist/server/server.js';

const port = process.env.PORT || 3001;
const CLIENT_DIR = join(process.cwd(), 'dist', 'client');
const MIME_TYPES = {
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.svg': 'image/svg+xml',
};
  
const server = createServer(async (req, res) => {

    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        if (url.pathname.startsWith('/assets/') || url.pathname === '/vite.svg') {
            const filePath = join(CLIENT_DIR, url.pathname);
            try {
                const content = await fs.readFile(filePath);
                const ext = extname(filePath);
                res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
                res.end(content);
                return;
            } catch (e) {
                
            }
        }
        
        const webReq = new Request(url, {
            method: req.method,
            headers: req.headers,
            body: req.method !== 'GET' && req.method !== 'HEAD' ? Readable.toWeb(req) : null,
            duplex: 'half'
        });
        
        const webRes = await handler.fetch(webReq);
        res.statusCode = webRes.status;
        webRes.headers.forEach((v, k) => res.setHeader(k, v));
        
        if (webRes.body) {
            const reader = webRes.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
        }
        
        res.end();
        
    } catch (err) {
        console.error('Bridge Error:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
    }

});
   
server.listen(port, () => { console.log(`🚀 PinterQ Frontend is running on http://localhost:${port}`);});