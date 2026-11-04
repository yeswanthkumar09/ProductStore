import mongoose from "mongoose";

const warehouseSettingSchema = new mongoose.Schema(
	{
		warehouseName: {
			type: String,
			default: "Primary Fulfillment Hub",
			trim: true,
		},
		contactName: {
			type: String,
			default: "LuxeStore Fulfillment Operations",
			trim: true,
		},
		phone: {
			type: String,
			default: "+919876543210",
			trim: true,
		},
		address: {
			type: String,
			default: "Central Logistics Park, Industrial Area Phase 2",
			trim: true,
		},
		city: {
			type: String,
			default: "New Delhi",
			trim: true,
		},
		state: {
			type: String,
			default: "Delhi",
			trim: true,
		},
		country: {
			type: String,
			default: "India",
			trim: true,
		},
		pickupPincode: {
			type: String,
			required: true,
			default: "110001",
			trim: true,
			match: [/^\d{6}$/, "Pickup PIN code must be a valid 6-digit Indian PIN code"],
		},
		latitude: {
			type: Number,
			default: 28.6448, // New Delhi
		},
		longitude: {
			type: Number,
			default: 77.2167,
		},
		operatingHours: {
			type: String,
			default: "Mon - Sat: 9:00 AM - 7:00 PM",
			trim: true,
		},
		allowPickup: {
			type: Boolean,
			default: true,
		},
		isDefault: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

const WarehouseSetting = mongoose.model("WarehouseSetting", warehouseSettingSchema);

export default WarehouseSetting;
