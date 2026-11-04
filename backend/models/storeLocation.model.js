import mongoose from "mongoose";

const storeLocationSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Store name is required"],
			trim: true,
		},
		code: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			uppercase: true,
		},
		address: {
			type: String,
			required: [true, "Store address is required"],
			trim: true,
		},
		locality: {
			type: String,
			default: "",
			trim: true,
		},
		city: {
			type: String,
			required: [true, "City is required"],
			trim: true,
		},
		state: {
			type: String,
			required: [true, "State is required"],
			trim: true,
		},
		country: {
			type: String,
			default: "India",
			trim: true,
		},
		pincode: {
			type: String,
			required: [true, "PIN code is required"],
			trim: true,
			match: [/^\d{6}$/, "Must be a valid 6-digit PIN code"],
			index: true,
		},
		latitude: {
			type: Number,
			required: [true, "Latitude is required for map display"],
		},
		longitude: {
			type: Number,
			required: [true, "Longitude is required for map display"],
		},
		phone: {
			type: String,
			default: "+91 11 4567 8900",
			trim: true,
		},
		email: {
			type: String,
			default: "concierge@luxestore.com",
			trim: true,
		},
		openingHours: {
			type: String,
			default: "10:30 AM - 9:00 PM (Mon - Sun)",
			trim: true,
		},
		isActive: {
			type: Boolean,
			default: true,
			index: true,
		},
		isPickupPoint: {
			type: Boolean,
			default: true,
		},
		pickupInstructions: {
			type: String,
			default: "Please present your Order ID and government-issued ID upon arrival.",
		},
	},
	{ timestamps: true }
);

storeLocationSchema.index({ city: 1, isActive: 1 });

const StoreLocation = mongoose.model("StoreLocation", storeLocationSchema);

export default StoreLocation;
