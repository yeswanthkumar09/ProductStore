import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		products: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
					required: true,
				},
				name: { type: String, default: "" },
				image: { type: String, default: "" },
				variantId: { type: String, default: "" },
				selectedColor: { type: String, default: "" },
				selectedSize: { type: String, default: "" },
				sku: { type: String, default: "" },
				quantity: {
					type: Number,
					required: true,
					min: 1,
				},
				price: {
					type: Number,
					required: true,
					min: 0,
				},
			},
		],
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		stripeSessionId: {
			type: String,
			index: {
				unique: true,
				partialFilterExpression: { stripeSessionId: { $type: "string" } },
			},
		},
		paymentMethod: {
			type: String,
			enum: ["razorpay", "stripe", "cod"],
			default: "razorpay",
		},
		razorpayOrderId: {
			type: String,
			index: {
				unique: true,
				partialFilterExpression: { razorpayOrderId: { $type: "string" } },
			},
		},
		razorpayPaymentId: {
			type: String,
			index: {
				unique: true,
				partialFilterExpression: { razorpayPaymentId: { $type: "string" } },
			},
		},
		razorpaySignature: {
			type: String,
			default: "",
		},
		couponCode: {
			type: String,
			default: "",
		},
		discountAmount: {
			type: Number,
			default: 0,
		},
		webhookEvents: [
			{
				eventId: { type: String },
				eventType: { type: String },
				processedAt: { type: Date, default: Date.now },
			},
		],
		shippingAddress: {
			fullName: { type: String, default: "" },
			phone: { type: String, default: "" },
			houseFlat: { type: String, default: "" },
			street: { type: String, default: "" },
			landmark: { type: String, default: "" },
			locality: { type: String, default: "" },
			city: { type: String, default: "" },
			district: { type: String, default: "" },
			state: { type: String, default: "" },
			country: { type: String, default: "India" },
			pincode: { type: String, default: "" },
			addressType: { type: String, default: "Home" },
			deliveryInstructions: { type: String, default: "" },
		},
		deliveryFee: {
			type: Number,
			default: 0,
		},
		estimatedDeliveryDays: {
			type: String,
			default: "2-4 business days",
		},
		courierName: {
			type: String,
			default: "",
		},
		courierRate: {
			type: Number,
			default: 0,
		},
		isCod: {
			type: Boolean,
			default: false,
		},
		shiprocketOrderId: {
			type: String,
			sparse: true,
		},
		shiprocketShipmentId: {
			type: String,
			sparse: true,
		},
		shiprocketAwb: {
			type: String,
			sparse: true,
		},
		trackingUrl: {
			type: String,
			default: "",
		},
		lastTrackingUpdate: {
			type: Date,
			default: null,
		},
		shipmentTracking: [
			{
				status: { type: String }, // e.g. "PICKED UP", "IN TRANSIT", "OUT FOR DELIVERY", "DELIVERED"
				activity: { type: String },
				location: { type: String },
				date: { type: Date },
				srStatus: { type: String },
			},
		],
		shipmentStatus: {
			type: String,
			enum: ["pending", "created", "shipped", "delivered", "failed", "cancelled"],
			default: "pending",
		},
		shiprocketError: {
			type: String,
			default: "",
		},
		status: {
			type: String,
			enum: [
				"pending",
				"pending_payment",
				"processing",
				"confirmed",
				"awaiting_shipment",
				"shipped",
				"out_for_delivery",
				"delivered",
				"cancelled",
			],
			default: "pending",
		},
		paymentStatus: {
			type: String,
			enum: [
				"created",
				"pending",
				"authorized",
				"captured",
				"paid",
				"failed",
				"refunded",
				"partially_refunded",
				"cancelled",
			],
			default: "pending",
		},
		inventoryRestored: {
			type: Boolean,
			default: false,
		},
		cancellation: {
			isCancelled: { type: Boolean, default: false },
			cancelledAt: { type: Date, default: null },
			cancelledBy: {
				type: String,
				enum: ["customer", "admin", "system", ""],
				default: "",
			},
			cancelledByUserId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
				default: null,
			},
			reason: { type: String, default: "" },
			comment: { type: String, default: "" },
		},
		refund: {
			refundId: { type: String, default: "" },
			amount: { type: Number, default: 0 },
			status: {
				type: String,
				enum: ["not_applicable", "pending", "processed", "failed"],
				default: "not_applicable",
			},
			reason: { type: String, default: "" },
			refundedAt: { type: Date, default: null },
			failureReason: { type: String, default: "" },
			razorpayPaymentId: { type: String, default: "" },
			razorpayResponse: { type: mongoose.Schema.Types.Mixed, default: null },
		},
		auditLog: [
			{
				action: { type: String, required: true },
				performedBy: { type: String, default: "system" },
				performedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
				performedAt: { type: Date, default: Date.now },
				details: { type: mongoose.Schema.Types.Mixed, default: {} },
			},
		],
	},
	{ timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ "shippingAddress.pincode": 1 });
orderSchema.index({ "shippingAddress.state": 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
