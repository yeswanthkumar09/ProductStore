import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
			index: true,
		},
		subscriptionStatus: {
			type: String,
			enum: ["active", "unsubscribed"],
			default: "active",
			index: true,
		},
		source: {
			type: String,
			default: "footer_newsletter",
		},
		ipAddress: {
			type: String,
			default: "",
		},
		subscribedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

const Newsletter = mongoose.model("Newsletter", newsletterSchema);
export default Newsletter;

