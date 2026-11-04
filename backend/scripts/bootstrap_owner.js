/**
 * bootstrap_owner.js
 * 
 * Standalone Owner Account Initialization & Credential Management Script.
 * Ensures exactly ONE designated business owner exists with exclusive administrative control.
 * 
 * Usage:
 *   node backend/scripts/bootstrap_owner.js --email=owner@luxestore.com --password=SecurePassword123! --name="Owner Yeswanth"
 *   OR configure OWNER_EMAIL, OWNER_PASSWORD, OWNER_NAME in .env and run:
 *   node backend/scripts/bootstrap_owner.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const parseArgs = () => {
	const args = {};
	process.argv.slice(2).forEach((arg) => {
		if (arg.startsWith("--")) {
			const [key, value] = arg.slice(2).split("=");
			args[key] = value || true;
		}
	});
	return args;
};

const run = async () => {
	const args = parseArgs();

	const email = (args.email || process.env.OWNER_EMAIL || "yeswanthagathamudi@gmail.com").trim().toLowerCase();
	const password = args.password || process.env.OWNER_PASSWORD || null;
	const name = (args.name || process.env.OWNER_NAME || "Yeswanth Agathamudi").trim();

	const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecommerce";

	console.log("==========================================================================");
	console.log("  LUXESTORE – OWNER ACCOUNT BOOTSTRAPPER");
	console.log("==========================================================================");

	let conn = null;
	try {
		console.log(`Connecting to primary MongoDB URI...`);
		conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
		console.log(`MongoDB connection established: ${conn.connection.host}`);
	} catch (atlasErr) {
		console.warn(`[MONGODB NOTICE] Primary URI failed. Connecting to local MongoDB on 127.0.0.1:27017...`);
		try {
			conn = await mongoose.connect("mongodb://127.0.0.1:27017/ecommerce", { serverSelectionTimeoutMS: 2000 });
			console.log(`MongoDB connected to local instance: ${conn.connection.host}`);
		} catch (localErr) {
			console.error("[BOOTSTRAP ERROR] Both primary and local MongoDB failed:", localErr.message);
			process.exit(1);
		}
	}

	try {

		// 1. Demote any other accounts with role 'admin' to preserve single-owner structure
		const demoteResult = await User.updateMany(
			{ email: { $ne: email }, role: "admin" },
			{ $set: { role: "customer" } }
		);
		if (demoteResult.modifiedCount > 0) {
			console.log(`[SINGLE OWNER ENFORCEMENT] Demoted ${demoteResult.modifiedCount} unauthorized admin accounts to 'customer'.`);
		}

		// 2. Find or create the designated owner account
		let owner = await User.findOne({ email });

		if (!owner) {
			if (!password) {
				console.error("[ERROR] Owner account does not exist. A password must be provided via --password or OWNER_PASSWORD in .env.");
				process.exit(1);
			}

			owner = new User({
				name,
				email,
				password,
				role: "admin",
				isEmailVerified: true,
				accountStatus: "active",
			});
			await owner.save();
			console.log(`[CREATED] Created designated owner account: ${email}`);
		} else {
			let updated = false;
			if (owner.role !== "admin") {
				owner.role = "admin";
				updated = true;
			}
			if (!owner.isEmailVerified) {
				owner.isEmailVerified = true;
				updated = true;
			}
			if (owner.accountStatus !== "active") {
				owner.accountStatus = "active";
				updated = true;
			}
			if (name && owner.name !== name) {
				owner.name = name;
				updated = true;
			}
			if (password) {
				owner.password = password; // Will be hashed by userSchema pre-save hook
				updated = true;
				console.log("[UPDATED] Owner password updated successfully.");
			}

			if (updated) {
				await owner.save();
				console.log(`[UPDATED] Designated owner account (${email}) successfully verified and synchronized.`);
			} else {
				console.log(`[CONFIRMED] Designated owner account (${email}) is already active and up to date.`);
			}
		}

		// 3. Verify exactly 1 admin exists
		const totalAdmins = await User.countDocuments({ role: "admin" });
		console.log(`\nVerification: Total admin accounts in database = ${totalAdmins}`);
		if (totalAdmins === 1) {
			console.log("✅ Single-owner constraint verified: 1 exclusive administrator.");
		} else {
			console.warn(`⚠️ Warning: Expected 1 admin, found ${totalAdmins}.`);
		}

		console.log("\nOwner account bootstrap complete.");
		await mongoose.disconnect();
		process.exit(0);
	} catch (error) {
		console.error("[BOOTSTRAP ERROR]:", error.message);
		await mongoose.disconnect();
		process.exit(1);
	}
};

run();
