import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		slug: {
			type: String,
			lowercase: true,
			trim: true,
		},
		description: {
			type: String,
			default: "",
		},
		badgeText: {
			type: String,
			default: "SPECIAL SALE",
		},
		bannerImage: {
			type: String,
			default: "",
		},
		startDate: {
			type: Date,
			required: true,
		},
		endDate: {
			type: Date,
			required: true,
		},
		discountType: {
			type: String,
			enum: ["percentage", "fixed"],
			default: "percentage",
		},
		discountValue: {
			type: Number,
			required: true,
			min: 0,
		},
		scope: {
			type: String,
			enum: ["storewide", "category", "product"],
			default: "storewide",
		},
		eligibleCategories: [
			{
				type: String,
			},
		],
		eligibleProducts: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Product",
			},
		],
		isActive: {
			type: Boolean,
			default: true,
		},
		isFeatured: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

saleSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const Sale = mongoose.model("Sale", saleSchema);

export default Sale;
