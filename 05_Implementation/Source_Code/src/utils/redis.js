const { createClient } = require("redis");
const logger = require("./logger");

class RedisClient {
  /**
   * Initializes a Redis client with reconnection logic and error handling
   */
  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) return new Error("Max retries reached");
          return Math.min(retries * 100, 5000); // Exponential backoff with cap
        },
      },
    });

    this.client.on("error", (err) => {
      logger.error(`Redis Client Error: ${err}`);
    });

    this.connect();
  }

  /**
   * Establishes connection to Redis with error logging
   */
  async connect() {
    try {
      await this.client.connect();
      logger.info("Connected to Redis successfully");
    } catch (err) {
      logger.error("Redis connection failed:", err);
    }
  }

  /**
   * Retrieves a value from Redis by key, parsing JSON if present
   * @param {string} key - Redis key to fetch
   * @returns {Object|null} Parsed value or null if not found/error
   */
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.error(`Redis GET error: ${err}`);
      return null;
    }
  }

  /**
   * Stores a value in Redis with optional TTL
   * @param {string} key - Redis key
   * @param {Object} value - Value to store (serialized to JSON)
   * @param {number} [ttl=3600] - Time-to-live in seconds
   */
  async set(key, value, ttl = 3600) {
    try {
      await this.client.set(key, JSON.stringify(value), { EX: ttl });
    } catch (err) {
      logger.error(`Redis SET error: ${err}`);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (err) {
      logger.error(`Redis DEL error: ${err}`);
    }
  }

  async multi() {
    return this.client.multi();
  }

  /**
   * Executes multiple Redis operations in a transaction
   * @param {Array<{type: string, key: string, value?: Object, ttl?: number}>} operations - List of operations
   * @returns {Promise<Array>} Transaction results
   */
  async execMulti(operations) {
    const multi = this.client.multi();
    operations.forEach((op) => {
      if (op.type === "set") {
        multi.set(op.key, JSON.stringify(op.value), { EX: op.ttl });
      } else if (op.type === "del") {
        multi.del(op.key);
      }
    });
    return await multi.exec();
  }
}

module.exports = new RedisClient();
