import mongoose from "mongoose";

const measurementRowSchema = new mongoose.Schema(
	{
		size: { type: String, required: true }, // e.g. "S", "M", "L", "XL", "XXL", "38", "40", "42"
		chestCm: { type: Number, default: null },
		chestIn: { type: Number, default: null },
		shoulderCm: { type: Number, default: null },
		shoulderIn: { type: Number, default: null },
		lengthCm: { type: Number, default: null },
		lengthIn: { type: Number, default: null },
		sleeveCm: { type: Number, default: null },
		sleeveIn: { type: Number, default: null },
		waistCm: { type: Number, default: null },
		waistIn: { type: Number, default: null },
		hipCm: { type: Number, default: null },
		hipIn: { type: Number, default: null },
		inseamCm: { type: Number, default: null },
		inseamIn: { type: Number, default: null },
		outseamCm: { type: Number, default: null },
		outseamIn: { type: Number, default: null },
		footLengthCm: { type: Number, default: null },
		footLengthIn: { type: Number, default: null },
		// International size conversions
		conversions: {
			in: { type: String, default: "" }, // India
			us: { type: String, default: "" }, // US
			uk: { type: String, default: "" }, // UK
			eu: { type: String, default: "" }, // EU
			intl: { type: String, default: "" }, // International (XS, S, M, L, XL, XXL)
		},
	},
	{ _id: false }
);

const measuringInstructionSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		instruction: { type: String, required: true },
		tip: { type: String, default: "" },
	},
	{ _id: false }
);

const sizeChartSchema = new mongoose.Schema(
	{
		category: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
			index: true,
		}, // e.g., "shirts", "t-shirts", "trousers", "jeans", "jackets", "shoes", "overshirt", "suits"
		name: {
			type: String,
			required: true,
			trim: true,
		}, // e.g., "Men's Casual & Formal Shirts Size Guide"
		fitDescription: {
			type: String,
			default: "Designed for a contemporary tailored fit. Size up if you prefer a relaxed silhouette.",
		},
		columns: [{ type: String }], // e.g., ["chest", "shoulder", "length", "sleeve"]
		rows: [measurementRowSchema],
		instructions: [measuringInstructionSchema],
		isDefault: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

const SizeChart = mongoose.model("SizeChart", sizeChartSchema);

export default SizeChart;

