import mongoose from "mongoose";

const restockSubscriptionSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		email: {
			type: String,
			required: [true, "Subscriber email is required"],
			trim: true,
			lowercase: true,
			match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
		},
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: [true, "Product reference is required"],
			index: true,
		},
		variantId: {
			type: String,
			default: null,
		},
		size: {
			type: String,
			trim: true,
			default: "",
		},
		color: {
			name: { type: String, default: "" },
			hex: { type: String, default: "" },
		},
		status: {
			type: String,
			enum: ["active", "queued", "notified", "cancelled", "failed"],
			default: "active",
			index: true,
		},
		deliveryStatus: {
			type: String,
			enum: ["pending", "sent", "failed", "retrying"],
			default: "pending",
		},
		retryCount: {
			type: Number,
			default: 0,
		},
		lastError: {
			type: String,
			default: "",
		},
		notifiedAt: {
			type: Date,
			default: null,
		},
		restockEventRef: {
			type: String,
			default: "",
		},
	},
	{
		timestamps: true,
	}
);

// Prevent duplicate active subscriptions for the exact same email, product, and variant/size
restockSubscriptionSchema.index(
	{ email: 1, product: 1, variantId: 1, size: 1, status: 1 },
	{
		unique: true,
		partialFilterExpression: { status: "active" },
	}
);

restockSubscriptionSchema.index({ product: 1, status: 1 });
restockSubscriptionSchema.index({ user: 1, status: 1 });

const RestockSubscription = mongoose.model("RestockSubscription", restockSubscriptionSchema);

export default RestockSubscription;

