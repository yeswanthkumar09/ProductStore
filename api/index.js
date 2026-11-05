import app from "../backend/app.js";
import { connectDB, ensureDatabaseDefaults } from "../backend/lib/db.js";

/**
 * Serverless Function Configuration for Vercel.
 * bodyParser: false disables Vercel's default JSON parser so that the incoming
 * HTTP stream remains unconsumed, allowing Express.json({ verify }) to capture
 * req.rawBody for Razorpay HMAC signatures, and multer to stream file uploads.
 */
export const config = {
	api: {
		bodyParser: false,
	},
};

/**
 * Primary Vercel Serverless Function entry point.
 * Guarantees Mongoose connection caching and re-use across warm container invocations.
 */
export default async function handler(req, res) {
	try {
		await connectDB();

		// Ensure defaults if in non-production or if explicitly requested via environment
		if (process.env.AUTO_SEED_DEFAULTS === "true" || process.env.NODE_ENV !== "production") {
			await ensureDatabaseDefaults();
		}
	} catch (dbErr) {
		console.error("[SERVERLESS DB CONNECTION ERROR]", dbErr.message);
	}

	return app(req, res);
}
