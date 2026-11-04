import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let client = null;
const memoryCache = new Map();

try {
	if (process.env.UPSTASH_REDIS_URL && !process.env.UPSTASH_REDIS_URL.includes("placeholder")) {
		client = new Redis(process.env.UPSTASH_REDIS_URL, {
			maxRetriesPerRequest: 1,
			retryStrategy: (times) => {
				if (times > 2) return null; // stop retrying
				return 500;
			},
			enableOfflineQueue: false,
		});

		client.on("error", (err) => {
			// Suppress crash on connection/DNS errors (e.g. university network firewall)
		});
	}
} catch (err) {
	// Fallback to in-memory cache
}

export const redis = {
	get: async (key) => {
		try {
			if (client && client.status === "ready") {
				return await client.get(key);
			}
		} catch (e) {}
		return memoryCache.get(key) || null;
	},
	set: async (key, value, ...args) => {
		try {
			if (client && client.status === "ready") {
				return await client.set(key, value, ...args);
			}
		} catch (e) {}
		memoryCache.set(key, value);
		return "OK";
	},
	del: async (...keys) => {
		try {
			if (client && client.status === "ready") {
				return await client.del(...keys);
			}
		} catch (e) {}
		keys.forEach((k) => memoryCache.delete(k));
		return 1;
	},
	status: client?.status || "ready",
};
