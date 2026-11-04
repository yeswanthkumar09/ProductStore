import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		fullName: {
			type: String,
			required: [true, "Recipient full name is required"],
			trim: true,
		},
		phone: {
			type: String,
			required: [true, "Recipient mobile number is required"],
			trim: true,
		},
		houseFlat: {
			type: String,
			required: [true, "House / Flat number is required"],
			trim: true,
		},
		street: {
			type: String,
			required: [true, "Street / Building / Locality is required"],
			trim: true,
		},
		landmark: {
			type: String,
			default: "",
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
		district: {
			type: String,
			default: "",
			trim: true,
		},
		state: {
			type: String,
			required: [true, "State / Union Territory is required"],
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
			match: [/^\d{6}$/, "Please provide a valid 6-digit Indian PIN code"],
			index: true,
		},
		addressType: {
			type: String,
			enum: ["Home", "Work", "Other"],
			default: "Home",
		},
		deliveryInstructions: {
			type: String,
			default: "",
			trim: true,
		},
		latitude: {
			type: Number,
			default: null,
		},
		longitude: {
			type: Number,
			default: null,
		},
		isDefault: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

addressSchema.index({ user: 1, isDefault: 1 });

const Address = mongoose.model("Address", addressSchema);

export default Address;
