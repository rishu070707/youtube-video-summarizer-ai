
/**
 * Example helper for connecting to BullMQ / Redis
 */
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

const videoQueue = new Queue('video-jobs', { connection });

module.exports = { videoQueue, connection };
