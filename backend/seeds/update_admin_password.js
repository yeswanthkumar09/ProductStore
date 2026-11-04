import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";

async function updateAdminPassword() {
	try {
		await connectDB();

		const users = await User.find({
			$or: [{ role: "admin" }, { email: "yeswanthagathamudi@gmail.com" }],
		});

		console.log(`Found ${users.length} target admin account(s).`);

		if (users.length === 0) {
			console.log("No existing admin found. Creating admin account with yeswanthagathamudi@gmail.com...");
			const newAdmin = await User.create({
				name: "Yeswanth Agathamudi",
				email: "yeswanthagathamudi@gmail.com",
				password: "admin123",
				role: "admin",
				accountStatus: "active",
				isEmailVerified: true,
			});
			const verified = await newAdmin.comparePassword("admin123");
			console.log(`Created new admin: ${newAdmin.email}, verified: ${verified}`);
		} else {
			for (const user of users) {
				user.password = "admin123";
				user.role = "admin";
				user.accountStatus = "active";
				user.isEmailVerified = true;
				await user.save();

				const verified = await user.comparePassword("admin123");
				console.log(`Updated user: ${user.email} (role: ${user.role}), password verification: ${verified}`);
			}
		}

		process.exit(0);
	} catch (error) {
		console.error("Failed to update admin password:", error);
		process.exit(1);
	}
}

updateAdminPassword();
