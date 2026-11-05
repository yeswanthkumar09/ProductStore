/**
 * bootstrap_database.js
 *
 * Standalone Database Initialization & Migration Script for LUXESTORE.
 * Safely seeds default taxonomy, size guides, store locations, sample products,
 * and delivery serviceability if collections are empty.
 *
 * Usage:
 *   node backend/scripts/bootstrap_database.js
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, ensureDatabaseDefaults } from "../lib/db.js";
import { ensureDefaultSizeCharts } from "../controllers/sizeChart.controller.js";

dotenv.config();

const runBootstrap = async () => {
	console.log("==========================================================================");
	console.log("  LUXESTORE – STANDALONE DATABASE BOOTSTRAPPER");
	console.log("==========================================================================\n");

	try {
		console.log("[1/3] Connecting to MongoDB...");
		await connectDB();
		console.log("  ✅ Connected successfully to database.\n");

		console.log("[2/3] Verifying / Seeding Database Defaults...");
		await ensureDatabaseDefaults(true); // force run
		console.log("  ✅ Database defaults verified.\n");

		console.log("[3/3] Verifying / Seeding Size Guides...");
		await ensureDefaultSizeCharts();
		console.log("  ✅ Size guides verified.\n");

		console.log("==========================================================================");
		console.log("  SUCCESS: Database bootstrap completed without errors.");
		console.log("==========================================================================\n");

		await mongoose.connection.close(false);
		process.exit(0);
	} catch (err) {
		console.error("\n❌ [BOOTSTRAP ERROR]:", err.message);
		try {
			await mongoose.connection.close(false);
		} catch (e) {}
		process.exit(1);
	}
};

runBootstrap();

