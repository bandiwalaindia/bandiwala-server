import {app} from './app.js';
import { createServer } from 'http';
import socketService from './services/socketService.js';

const PORT = process.env.PORT ;
const HOST = process.env.HOST || 'localhost';

const server = createServer(app);

socketService.initialize(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log('Server started on http://' + HOST + ':' + PORT);
  console.log('🚀 Socket.io enabled for real-time notifications');
});
