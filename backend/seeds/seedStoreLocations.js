import dotenv from "dotenv";
import mongoose from "mongoose";
import StoreLocation from "../models/storeLocation.model.js";

dotenv.config();

const verifiedLocations = [
	{
		name: "LuxeStore Flagship Boutique - Connaught Place",
		code: "DEL-CP-01",
		address: "Block A, Inner Circle, Connaught Place",
		locality: "Connaught Place",
		city: "New Delhi",
		state: "Delhi",
		country: "India",
		pincode: "110001",
		latitude: 28.6328,
		longitude: 77.2197,
		phone: "+91 11 4151 8800",
		email: "delhi.cp@luxestore.com",
		openingHours: "10:30 AM - 9:00 PM (Mon - Sun)",
		isActive: true,
		isPickupPoint: true,
		pickupInstructions: "Visit Concierge Counter on Floor 1. Present Order ID and Photo ID.",
	},
	{
		name: "LuxeStore Luxury Maison - Palladium Mall",
		code: "MUM-PAL-02",
		address: "Ground Level, Palladium Mall, High Street Phoenix, Lower Parel",
		locality: "Lower Parel",
		city: "Mumbai",
		state: "Maharashtra",
		country: "India",
		pincode: "400013",
		latitude: 18.9953,
		longitude: 72.8242,
		phone: "+91 22 4004 5500",
		email: "mumbai.palladium@luxestore.com",
		openingHours: "11:00 AM - 9:30 PM (Mon - Sun)",
		isActive: true,
		isPickupPoint: true,
		pickupInstructions: "Express Pickup Desk at boutique entrance.",
	},
	{
		name: "LuxeStore Prestige Gallery - UB City",
		code: "BLR-UB-03",
		address: "Level 1, The Collection, UB City, 24 Vittal Mallya Road",
		locality: "Vittal Mallya Road",
		city: "Bengaluru",
		state: "Karnataka",
		country: "India",
		pincode: "560001",
		latitude: 12.9719,
		longitude: 77.5958,
		phone: "+91 80 2211 4400",
		email: "bengaluru.ub@luxestore.com",
		openingHours: "10:30 AM - 8:30 PM (Mon - Sun)",
		isActive: true,
		isPickupPoint: true,
		pickupInstructions: "Concierge Valet and dedicated Order Pickup Counter available.",
	},
	{
		name: "LuxeStore Haute Couture - Jubilee Hills",
		code: "HYD-JH-04",
		address: "Road No. 36, Near Peddamma Temple, Jubilee Hills",
		locality: "Jubilee Hills",
		city: "Hyderabad",
		state: "Telangana",
		country: "India",
		pincode: "500033",
		latitude: 17.4325,
		longitude: 78.4071,
		phone: "+91 40 2355 6600",
		email: "hyderabad.jh@luxestore.com",
		openingHours: "11:00 AM - 9:00 PM (Mon - Sun)",
		isActive: true,
		isPickupPoint: true,
		pickupInstructions: "Direct curb-side or in-store collection at VIP lounge.",
	},
];

export const seedStoreLocations = async () => {
	try {
		for (const loc of verifiedLocations) {
			await StoreLocation.findOneAndUpdate({ code: loc.code }, loc, {
				upsert: true,
				new: true,
			});
		}
		console.log(`[Store Location Seed] Successfully seeded ${verifiedLocations.length} verified physical stores.`);
	} catch (error) {
		console.error("Error seeding store locations:", error.message);
	}
};

if (process.argv[1] && process.argv[1].endsWith("seedStoreLocations.js")) {
	mongoose
		.connect(process.env.MONGO_URI)
		.then(async () => {
			console.log("Connected to MongoDB for store locations seeding...");
			await seedStoreLocations();
			process.exit(0);
		})
		.catch((err) => {
			console.error("Database connection error:", err);
			process.exit(1);
		});
}
