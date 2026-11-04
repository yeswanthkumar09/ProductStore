import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
	{
		text: {
			type: String,
			required: [true, "Announcement text is required"],
			trim: true,
		},
		highlightText: {
			type: String,
			default: "",
			trim: true,
		},
		link: {
			type: String,
			default: "",
			trim: true,
		},
		type: {
			type: String,
			enum: ["shipping", "coupon", "policy", "custom"],
			default: "custom",
		},
		couponCode: {
			type: String,
			default: "",
			trim: true,
			uppercase: true,
		},
		freeShippingThreshold: {
			type: Number,
			default: 1999,
		},
		returnPolicyDays: {
			type: Number,
			default: 7,
		},
		displayOrder: {
			type: Number,
			default: 0,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		startDate: {
			type: Date,
			default: null,
		},
		endDate: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true }
);

announcementSchema.index({ isActive: 1, displayOrder: 1 });

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;

