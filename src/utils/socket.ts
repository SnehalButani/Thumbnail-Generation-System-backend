import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export async function setupSocketIO(server: any) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"]
    }
  });

  // Create Redis clients
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  try {
    await Promise.all([pubClient.connect(), subClient.connect()]);
    
    // Setup Redis adapter
    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Redis clients connected successfully');

    // Subscribe to job updates
    await subClient.subscribe('job_updates', (message) => {
      const data = JSON.parse(message);
      
      // Emit to both job-specific and user-specific rooms
      io.to(`job-${data.jobId}`).emit('jobUpdate', data);
      io.to(`user-${data.userId}`).emit('jobUpdate', data);
    });

    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join job room
      socket.on('subscribeJob', (jobId: string) => {
        socket.join(`job-${jobId}`);
      });

      // Join user room
      socket.on('subscribeUser', (userId: string) => {
        socket.join(`user-${userId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

  } catch (error) {
    console.error('Socket.IO setup failed:', error);
    throw error;
  }

  return io;
}