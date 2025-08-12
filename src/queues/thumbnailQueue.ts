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
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port || '6379'),
    username: redisUrl.username || undefined,
    password: redisUrl.password || process.env.REDIS_PASSWORD,
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