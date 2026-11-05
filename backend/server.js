import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDB, ensureDatabaseDefaults } from "./lib/db.js";
import { validateRazorpayEnv } from "./lib/razorpay.js";
import { ensureDefaultSizeCharts } from "./controllers/sizeChart.controller.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// System Health Check Endpoint for Deployment Orchestrators (Render / Railway / AWS ECS)
app.get("/api/health", (req, res) => {
	const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
	const memory = process.memoryUsage();

	res.status(dbStatus === "connected" ? 200 : 503).json({
		status: "ok",
		uptimeSeconds: Math.floor(process.uptime()),
		timestamp: new Date().toISOString(),
		database: dbStatus,
		memory: {
			rssMb: (memory.rss / (1024 * 1024)).toFixed(1),
			heapUsedMb: (memory.heapUsed / (1024 * 1024)).toFixed(1),
		},
		environment: process.env.NODE_ENV || "development",
		version: "1.0.0",
	});
});

const server = app.listen(PORT, "0.0.0.0", async () => {
	console.log("Server is running on http://localhost:" + PORT);
	validateRazorpayEnv();
	try {
		await connectDB();
		await ensureDatabaseDefaults();
		ensureDefaultSizeCharts();
	} catch (err) {
		console.error("[STANDALONE SERVER DB INIT ERROR]", err.message);
	}
});

// Graceful Shutdown Handling
const gracefulShutdown = (signal) => {
	console.log(`\n[SHUTDOWN] Received ${signal}. Closing HTTP listener and database connections...`);
	server.close(async () => {
		console.log("[SHUTDOWN] HTTP server closed.");
		try {
			await mongoose.connection.close(false);
			console.log("[SHUTDOWN] MongoDB connection closed.");
		} catch (err) {
			console.error("[SHUTDOWN ERROR] Error during DB close:", err.message);
		}
		process.exit(0);
	});

	// Force close if graceful shutdown stalls beyond 8 seconds
	setTimeout(() => {
		console.error("[SHUTDOWN] Force closing process after timeout.");
		process.exit(1);
	}, 8000);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

export default server;
