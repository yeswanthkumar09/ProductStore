import mongoose from "mongoose";

const ticketMessageSchema = new mongoose.Schema(
	{
		sender: {
			type: String,
			enum: ["customer", "support", "system"],
			required: true,
		},
		senderName: {
			type: String,
			required: true,
		},
		message: {
			type: String,
			required: true,
		},
		attachments: [{ type: String }],
		createdAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ _id: true }
);

const supportTicketSchema = new mongoose.Schema(
	{
		ticketNumber: {
			type: String,
			unique: true,
			index: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		userEmail: {
			type: String,
			required: true,
		},
		userName: {
			type: String,
			required: true,
		},
		userPhone: {
			type: String,
			default: "",
		},
		orderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Order",
			default: null,
		},
		orderNumber: {
			type: String,
			default: "",
		},
		category: {
			type: String,
			enum: [
				"Order Issue",
				"Delivery & Shipping",
				"Return & Refund",
				"Size & Fit",
				"Payment & Billing",
				"Account & Login",
				"Product Inquiry",
				"General Inquiry",
			],
			default: "Order Issue",
		},
		subject: {
			type: String,
			required: true,
			trim: true,
		},
		priority: {
			type: String,
			enum: ["low", "medium", "high", "urgent"],
			default: "medium",
		},
		status: {
			type: String,
			enum: ["open", "in_progress", "resolved", "closed"],
			default: "open",
			index: true,
		},
		messages: [ticketMessageSchema],
		resolvedAt: {
			type: Date,
			default: null,
		},
		lastRepliedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

// Auto-generate human-friendly ticket number: TCK-YYYYMMDD-XXXX
supportTicketSchema.pre("save", async function (next) {
	if (!this.ticketNumber) {
		const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
		const rand = Math.floor(1000 + Math.random() * 9000);
		this.ticketNumber = `TCK-${dateStr}-${rand}`;
	}
	next();
});

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;

