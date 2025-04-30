const { Redis } = require("@upstash/redis");
const logger = require("./logger");

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "YOUR_UPSTASH_REDIS_URL",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "YOUR_UPSTASH_REDIS_TOKEN",
});

// Test the connection
redis
  .ping()
  .then(() => {
    logger.info("Connected to Upstash Redis successfully");
  })
  .catch((err) => {
    logger.error("Failed to connect to Upstash Redis", { error: err.message });
    throw err; // Ensure connection errors are propagated
  });

class RedisClient {
  constructor() {
    this.client = redis;
  }

  /**
   * Retrieves a value from Redis by key and parses JSON if applicable
   * @param {string} key - Redis key to fetch
   * @returns {any|null} Parsed value or null if not found/error
   */
  async get(key) {
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch (parseError) {
        return value; // Return as-is if not JSON
      }
    } catch (err) {
      logger.error(`Redis GET error: ${err}`);
      return null;
    }
  }

  /**
   * Stores a value in Redis with optional TTL, stringifying JSON objects
   * @param {string} key - Redis key
   * @param {any} value - Value to store (stringified if object)
   * @param {number} [ttl=3600] - Time-to-live in seconds
   */
  async set(key, value, ttl = 3600) {
    try {
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      await this.client.set(key, stringValue, { ex: ttl });
    } catch (err) {
      logger.error(`Redis SET error: ${err}`);
      throw err; // Rethrow to ensure errors are caught upstream
    }
  }

  /**
   * Deletes a key from Redis
   * @param {string} key - Redis key to delete
   */
  async del(key) {
    try {
      await this.client.del(key);
    } catch (err) {
      logger.error(`Redis DEL error: ${err}`);
    }
  }

  /**
   * Creates a multi-command transaction
   * @returns {Object} Redis multi-command object
   */
  async multi() {
    return this.client.multi();
  }

  /**
   * Executes multiple Redis operations in a transaction
   * @param {Array<{type: string, key: string, value?: string, ttl?: number}>} operations - List of operations
   * @returns {Promise<Array>} Transaction results
   */
  async execMulti(operations) {
    const commands = operations.map((op) => {
      if (op.type === "set") {
        const stringValue =
          typeof op.value === "string" ? op.value : JSON.stringify(op.value);
        return ["set", op.key, stringValue, { ex: op.ttl }];
      } else if (op.type === "del") {
        return ["del", op.key];
      }
    });
    return await this.client.multi(commands).exec();
  }

  /**
   * Safely disconnects the Redis client (optional for Upstash as it's HTTP-based)
   */
  async disconnect() {
    try {
      logger.info("Disconnected from Upstash Redis (HTTP client)");
    } catch (err) {
      logger.error("Error disconnecting from Upstash Redis:", err);
    }
  }
}

module.exports = new RedisClient();
