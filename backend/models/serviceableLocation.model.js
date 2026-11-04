import mongoose from "mongoose";

const serviceableLocationSchema = new mongoose.Schema(
	{
		country: {
			type: String,
			default: "India",
			trim: true,
			uppercase: true,
		},
		state: {
			type: String,
			required: [true, "State or union territory is required"],
			trim: true,
		},
		district: {
			type: String,
			required: [true, "District or city is required"],
			trim: true,
		},
		city: {
			type: String,
			required: [true, "City is required"],
			trim: true,
		},
		locality: {
			type: String,
			default: "",
			trim: true,
		},
		pincode: {
			type: String,
			required: [true, "PIN code is required"],
			trim: true,
			match: [/^\d{6}$/, "Please provide a valid 6-digit Indian PIN code"],
		},
		isActive: {
			type: Boolean,
			default: true,
			index: true,
		},
		deliveryFee: {
			type: Number,
			default: 0,
			min: [0, "Delivery fee cannot be negative"],
		},
		minOrderValue: {
			type: Number,
			default: 0,
			min: [0, "Minimum order value cannot be negative"],
		},
		freeDeliveryThreshold: {
			type: Number,
			default: 1999,
			min: [0, "Free delivery threshold cannot be negative"],
		},
		estimatedDeliveryDays: {
			type: String,
			default: "2-4 business days",
			trim: true,
		},
		serviceRestrictions: {
			type: String,
			default: "",
			trim: true,
		},
	},
	{ timestamps: true }
);

// Compound indexes for high-performance lookup and uniqueness
serviceableLocationSchema.index({ pincode: 1 }, { unique: true });
serviceableLocationSchema.index({ state: 1, district: 1 });
serviceableLocationSchema.index({ pincode: 1, isActive: 1 });

const ServiceableLocation = mongoose.model("ServiceableLocation", serviceableLocationSchema);

export default ServiceableLocation;
