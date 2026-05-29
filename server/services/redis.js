const { createClient } = require('redis');

let client = null;

async function getRedisClient() {
  if (client && client.isOpen) return client;

  client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  client.on('error', (err) => console.error('Redis error:', err.message));

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
}

async function cacheGet(key) {
  try {
    const redis = await getRedisClient();
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function cacheSet(key, value, ttlSeconds = 300) {
  try {
    const redis = await getRedisClient();
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error('Cache set error:', err.message);
  }
}

async function cacheDel(pattern) {
  try {
    const redis = await getRedisClient();
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(keys);
  } catch (err) {
    console.error('Cache del error:', err.message);
  }
}

module.exports = { getRedisClient, cacheGet, cacheSet, cacheDel };
