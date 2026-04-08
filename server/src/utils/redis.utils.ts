import "dotenv/config";
import { logger } from "devdad-express-utils";
import {
  createClient,
  RedisClientOptions,
  RedisClientType,
  RedisModules,
} from "redis";

// 1. Define the version as a constant so TS can track it
const RESP_VERSION = 2 as const;
const MAX_REDIS_RETRIES = 3;

// Override the default arguments to stop conflict errors with RESP v2 and v3
// The generic arguments are: <Modules, Functions, Scripts, Protocol>
let _client: RedisClientType<
  RedisModules,
  any,
  any,
  typeof RESP_VERSION
> | null = null;

const options: RedisClientOptions<RedisModules, any, any, typeof RESP_VERSION> =
  {
    url: process.env.REDIS_URL,
    RESP: RESP_VERSION,
    socket: {
      reconnectStrategy(retries, cause) {
        if (retries > MAX_REDIS_RETRIES) {
          logger.error("Redis max connections retries reached. Closing Down.", {
            cause,
          });
          return cause;
        }

        const delay = Math.min(retries * 100, 3000);
        logger.warn(`Redis reconnect attempt #${retries} in ${delay}ms`);
        return delay;
      },
      connectTimeout: 10000,
    },
  };

export async function initializeRedisClient() {
  try {
    if (!_client) {
      _client = createClient(options);

      _client.on("error", (error: any) => {
        logger.error("❌ Redis error", {
          message: error.message,
          code: error.code,
        });
      });

      _client.on("connect", () => {
        logger.info("Redis Connected Successfully");
      });

      _client.on("ready", () => {
        logger.info("🟢 Redis ready");
      });

      _client.on("reconnecting", () => {
        logger.warn(`🔄 Redis is trying to reconnect..`);
      });

      await _client.connect();

      // Initialize bloom filter
      try {
        // NOTE: Values need to be adjusted per users needs, but we have max 2000 documents so this should be fine
        await _client.sendCommand(["BF.RESERVE", "bloom:urls", "0.01", "5000"]);
        logger.info("Bloom filter initialized");
      } catch {
        // Filter already exists - that's fine
      }
    }

    return _client;
  } catch (error) {
    logger.error("Failed to connect to redis server..", { error });
    // Clean up the client reference if connection fails
    if (_client) {
      await _client.quit().catch(() => {});
      _client = null;
    }
    throw error;
  }
}

export function getRedisClient() {
  if (!_client) {
    throw new Error(
      "Redis not initialized - call initializeRedisClient() first",
    );
  }
  return _client;
}
