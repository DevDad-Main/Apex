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
let client: RedisClientType<
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
    if (!client) {
      client = createClient(options);

      client.on("error", (error: any) => {
        logger.error("❌ Redis error", {
          message: error.message,
          code: error.code,
        });
      });

      client.on("connect", () => {
        logger.info("Redis Connected Successfully");
      });

      client.on("ready", () => {
        logger.info("🟢 Redis ready");
      });

      client.on("reconnecting", () => {
        logger.warn(`🔄 Redis is trying to reconnect..`);
      });

      await client.connect();
    }
    return client;
  } catch (error) {
    logger.error("Failed to connect to redis server..", { error });
    // Clean up the client reference if connection fails
    if (client) {
      await client.quit().catch(() => {});
      client = null;
    }
    throw error;
  }
}
