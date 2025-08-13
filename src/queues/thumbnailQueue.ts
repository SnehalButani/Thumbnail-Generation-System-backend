import { Queue } from 'bullmq';

export interface ThumbnailJobData {
  jobId: string;
  userId: string;
  filePath: string;
  fileType: 'image' | 'video';
}

export const getBullMQConnection = () => {
  const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');
  
  return {
    family: 0,
    host: redisUrl.hostname || process.env.REDISHOST,
    port: parseInt(redisUrl.port || process.env.REDISPORT),
    username: redisUrl.username || undefined,
    password: redisUrl.password || process.env.REDISPASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {
      rejectUnauthorized: false
    } : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  };
};

const thumbnailQueue = new Queue<ThumbnailJobData>('thumbnail-queue', {
  connection: getBullMQConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
});

thumbnailQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

export default thumbnailQueue;