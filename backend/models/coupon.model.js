import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
			trim: true,
		},
		name: {
			type: String,
			default: "",
		},
		description: {
			type: String,
			default: "",
		},
		discountType: {
			type: String,
			enum: ["percentage", "fixed"],
			default: "percentage",
		},
		// For backward compatibility: discountPercentage maps to discountValue if percentage
		discountPercentage: {
			type: Number,
			default: 10,
			min: 0,
			max: 100,
		},
		discountValue: {
			type: Number,
			required: true,
			default: 10,
			min: 0,
		},
		maxDiscountCap: {
			type: Number,
			default: null, // No cap if null
		},
		minOrderAmount: {
			type: Number,
			default: 0,
		},
		startDate: {
			type: Date,
			default: Date.now,
		},
		expirationDate: {
			type: Date,
			required: true,
		},
		maxUses: {
			type: Number,
			default: null, // Unlimited if null
		},
		usedCount: {
			type: Number,
			default: 0,
		},
		perUserLimit: {
			type: Number,
			default: 1,
		},
		usedBy: [
			{
				user: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				orderId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Order",
				},
				usedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
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
		excludedProducts: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Product",
			},
		],
		isFirstOrderOnly: {
			type: Boolean,
			default: false,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null, // null for storewide / general coupons
		},
	},
	{
		timestamps: true,
	}
);

couponSchema.index({ code: 1, isActive: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
