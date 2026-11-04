import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null, // null indicates global broadcast to all users
		},
		type: {
			type: String,
			enum: [
				"new_arrival",
				"sale",
				"coupon",
				"order",
				"payment",
				"shipping",
				"refund",
				"announcement",
				"welcome",
				"login_alert",
				"password_change",
				"order_confirmed",
				"payment_failed",
				"delivery_update",
			],
			default: "announcement",
		},
		title: {
			type: String,
			required: true,
			trim: true,
		},
		message: {
			type: String,
			required: true,
			trim: true,
		},
		link: {
			type: String,
			default: "/",
		},
		isRead: {
			type: Boolean,
			default: false,
		},
		readBy: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		targetCategory: {
			type: String,
			default: null,
		},
	},
	{ timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
