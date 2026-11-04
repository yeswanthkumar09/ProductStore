import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Coupon from "../models/coupon.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { razorpay } from "../lib/razorpay.js";
import { cancelShiprocketOrder } from "../services/shiprocket.service.js";
import {
	sendOrderCancellationEmail,
	sendRefundUpdateEmail,
	sendOrderStatusUpdateEmail,
} from "../services/email.service.js";

/**
 * Restore inventory on products and variants (idempotent, single-execution)
 */
export const restoreOrderInventory = async (order) => {
	if (order.inventoryRestored) {
		return false;
	}

	for (const item of order.products || []) {
		const productId = item.product?._id || item.product;
		if (!productId) continue;

		const prod = await Product.findById(productId);
		if (prod) {
			prod.stock = (prod.stock || 0) + (item.quantity || 1);

			if (item.variantId && Array.isArray(prod.variants)) {
				const v =
					prod.variants.id(item.variantId) ||
					prod.variants.find((vr) => vr._id?.toString() === item.variantId);
				if (v) {
					v.stock = (v.stock || 0) + (item.quantity || 1);
				}
			}
			await prod.save();
		}
	}

	order.inventoryRestored = true;
	return true;
};

/**
 * Restore coupon if user was granted single-use coupon
 */
export const restoreCouponUsage = async (couponCode, userId) => {
	if (!couponCode) return;
	try {
		const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
		if (coupon) {
			coupon.usedCount = Math.max(0, (coupon.usedCount || 1) - 1);
			if (Array.isArray(coupon.usedBy)) {
				coupon.usedBy = coupon.usedBy.filter(
					(u) => u.user?.toString() !== userId?.toString()
				);
			}
			if (coupon.userId) {
				coupon.isActive = true;
			}
			await coupon.save();
		}
	} catch (e) {
		console.warn("[Coupon Restore Note]", e.message);
	}
};

/**
 * GET /api/orders
 * Returns authenticated customer's order history (strictly paid or refunded orders only)
 */
export const getUserOrders = async (req, res) => {
	try {
		// Clean up any stale uncompleted draft checkout attempts for this user
		await Order.deleteMany({
			user: req.user._id,
			paymentStatus: { $in: ["created", "pending", "failed"] },
			razorpayPaymentId: { $in: [null, ""] },
		});

		// Query only authentic completed purchases
		const orders = await Order.find({
			user: req.user._id,
			paymentStatus: { $in: ["paid", "refunded", "partially_refunded"] },
		})
			.populate("products.product", "name image price sku category")
			.sort({ createdAt: -1 });

		return res.status(200).json(orders);
	} catch (error) {
		console.error("Error fetching user orders:", error);
		return res.status(500).json({ error: "Failed to fetch orders", message: error.message });
	}
};

/**
 * GET /api/orders/:id
 * Returns complete order details with ownership verification
 */
export const getOrderById = async (req, res) => {
	try {
		const { id } = req.params;
		const order = await Order.findById(id)
			.populate("products.product", "name image price sku category")
			.populate("user", "name email phone");

		if (!order) {
			return res.status(404).json({ error: "Order not found." });
		}

		// Security: Customers can view only their own orders
		if (req.user.role !== "admin" && order.user._id.toString() !== req.user._id.toString()) {
			return res.status(403).json({ error: "Unauthorized to access this order." });
		}

		// Security: Non-admin users cannot query unpaid abandoned drafts
		if (
			req.user.role !== "admin" &&
			!["paid", "refunded", "partially_refunded"].includes(order.paymentStatus)
		) {
			return res.status(404).json({ error: "Order payment has not been completed." });
		}

		return res.status(200).json(order);
	} catch (error) {
		console.error("Error fetching order details:", error);
		return res.status(500).json({ error: "Failed to fetch order details", message: error.message });
	}
};

/**
 * POST /api/orders/:id/cancel
 * Customer cancels an eligible order from their account
 */
export const cancelUserOrder = async (req, res) => {
	try {
		const { id } = req.params;
		const { reason, comment } = req.body;

		const order = await Order.findById(id).populate("products.product");
		if (!order) {
			return res.status(404).json({ error: "Order not found." });
		}

		// 1. Ownership verification
		if (order.user.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				error: "Unauthorized: You do not have permission to cancel this order.",
			});
		}

		// 2. Cancellation eligibility rules
		if (order.status === "cancelled") {
			return res.status(400).json({ error: "This order is already cancelled." });
		}

		const ineligibleStatuses = ["shipped", "out_for_delivery", "delivered"];
		if (ineligibleStatuses.includes(order.status) || ineligibleStatuses.includes(order.shipmentStatus)) {
			return res.status(400).json({
				error: `Order cannot be cancelled because it has already reached '${order.shipmentStatus || order.status}'. Please contact customer support.`,
			});
		}

		// 3. Status transition
		order.status = "cancelled";
		order.cancellation = {
			isCancelled: true,
			cancelledAt: new Date(),
			cancelledBy: "customer",
			cancelledByUserId: req.user._id,
			reason: reason || "Customer requested cancellation",
			comment: comment || "",
		};

		// 4. Inventory restoration (atomic & exactly once)
		if (order.paymentStatus === "paid" || order.status === "confirmed" || order.status === "processing") {
			await restoreOrderInventory(order);
		}

		// 5. Restore coupon if used
		if (order.couponCode) {
			await restoreCouponUsage(order.couponCode, req.user._id);
		}

		// 6. Payment & Razorpay refund handling
		let refundAttempted = false;
		let refundSucceeded = false;
		let refundResult = null;

		if (order.paymentStatus === "paid" && order.paymentMethod === "razorpay" && order.razorpayPaymentId) {
			refundAttempted = true;
			try {
				const refundPaise = Math.round(order.totalAmount * 100);
				const rzpRefund = await razorpay.payments.refund(order.razorpayPaymentId, {
					amount: refundPaise,
					notes: {
						internalOrderId: order._id.toString(),
						reason: reason || "Customer order cancellation",
					},
				});

				refundSucceeded = true;
				order.refund = {
					refundId: rzpRefund.id || `rfnd_${Date.now()}`,
					amount: order.totalAmount,
					status: rzpRefund.status === "failed" ? "failed" : "processed",
					reason: reason || "Customer order cancellation",
					refundedAt: new Date(),
					razorpayPaymentId: order.razorpayPaymentId,
					razorpayResponse: rzpRefund,
				};
				order.paymentStatus = "refunded";
				refundResult = order.refund;
			} catch (rzpErr) {
				console.error("[Razorpay Refund Error]", rzpErr.message || rzpErr);
				// Order is cancelled, but refund is marked as failed for administrative manual review
				order.refund = {
					refundId: "",
					amount: order.totalAmount,
					status: "failed",
					reason: reason || "Customer order cancellation",
					failureReason: rzpErr.error?.description || rzpErr.message || "Gateway refund API rejected request",
					razorpayPaymentId: order.razorpayPaymentId,
				};
				// Keep paymentStatus as paid to indicate customer was charged but refund is pending/failed
				refundResult = order.refund;
			}
		} else {
			// Unpaid or COD orders
			order.paymentStatus = "cancelled";
			order.refund = {
				status: "not_applicable",
				amount: 0,
				reason: "No online payment captured",
			};
		}

		// 7. Synchronize cancellation with Shiprocket if shipment exists
		if (order.shiprocketOrderId || order.shiprocketAwb) {
			try {
				const srCancel = await cancelShiprocketOrder({
					shiprocketOrderId: order.shiprocketOrderId,
					shiprocketAwb: order.shiprocketAwb,
				});
				if (srCancel.success) {
					order.shipmentStatus = "cancelled";
				} else {
					order.shiprocketError = srCancel.error;
				}
			} catch (srErr) {
				console.warn("[Shiprocket Sync Note]", srErr.message);
				order.shiprocketError = srErr.message;
			}
		}

		// 8. Audit trail
		order.auditLog = order.auditLog || [];
		order.auditLog.push({
			action: "order_cancelled_by_customer",
			performedBy: "customer",
			performedByUserId: req.user._id,
			performedAt: new Date(),
			details: {
				reason: reason || "Customer requested cancellation",
				refundStatus: order.refund?.status,
				inventoryRestored: order.inventoryRestored,
			},
		});

		await order.save();

		// 9. Transactional Notifications & Emails
		try {
			await Notification.create({
				user: req.user._id,
				type: "order",
				title: "Order Cancelled",
				message: `Your order #${order._id
					.toString()
					.slice(-6)
					.toUpperCase()} has been cancelled.${refundSucceeded ? ` A refund of ₹${order.totalAmount.toLocaleString("en-IN")} was initiated.` : ""}`,
				link: "/orders",
			});
		} catch (notifErr) {
			console.warn("Notification notice:", notifErr.message);
		}

		const customerUser = await User.findById(req.user._id);
		if (customerUser && customerUser.email) {
			try {
				await sendOrderCancellationEmail({
					order,
					user: customerUser,
					reason: reason || "Customer requested cancellation",
					refundInfo: order.refund,
				});
			} catch (emailErr) {
				console.warn("Cancellation email notice:", emailErr.message);
			}
		}

		return res.status(200).json({
			success: true,
			message: "Order cancelled successfully.",
			order,
			refund: refundResult,
		});
	} catch (error) {
		console.error("Error cancelling order:", error);
		return res.status(500).json({
			error: "Failed to cancel order",
			message: error.message,
		});
	}
};

/**
 * GET /api/orders/admin/all
 * Admin: Search, filter, and paginate all orders with metrics
 */
export const getAdminOrders = async (req, res) => {
	try {
		const {
			search,
			status,
			paymentStatus,
			shipmentStatus,
			dateFrom,
			dateTo,
			page = 1,
			limit = 15,
			sort = "newest",
		} = req.query;

		const filter = {};

		if (status && status !== "all") {
			filter.status = status;
		}

		if (paymentStatus && paymentStatus !== "all") {
			filter.paymentStatus = paymentStatus;
		} else {
			// By default, exclude uncompleted checkout drafts from general admin list
			filter.paymentStatus = { $ne: "created" };
		}

		if (shipmentStatus && shipmentStatus !== "all") {
			filter.shipmentStatus = shipmentStatus;
		}

		if (dateFrom || dateTo) {
			filter.createdAt = {};
			if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
			if (dateTo) {
				const end = new Date(dateTo);
				end.setHours(23, 59, 59, 999);
				filter.createdAt.$lte = end;
			}
		}

		if (search && search.trim()) {
			const s = search.trim();
			const or = [
				{ "shippingAddress.fullName": new RegExp(s, "i") },
				{ "shippingAddress.phone": new RegExp(s, "i") },
				{ "shippingAddress.city": new RegExp(s, "i") },
				{ razorpayOrderId: new RegExp(s, "i") },
				{ razorpayPaymentId: new RegExp(s, "i") },
				{ shiprocketAwb: new RegExp(s, "i") },
			];
			if (/^[0-9a-fA-F]{24}$/.test(s)) {
				or.push({ _id: s });
			}
			filter.$or = or;
		}

		let sortOptions = { createdAt: -1 };
		if (sort === "oldest") sortOptions = { createdAt: 1 };
		else if (sort === "total_high") sortOptions = { totalAmount: -1 };
		else if (sort === "total_low") sortOptions = { totalAmount: 1 };

		const skip = (Number(page) - 1) * Number(limit);

		const [orders, total, allOrdersSummary] = await Promise.all([
			Order.find(filter)
				.populate("user", "name email phone")
				.populate("products.product", "name image price sku")
				.sort(sortOptions)
				.skip(skip)
				.limit(Number(limit)),
			Order.countDocuments(filter),
			Order.aggregate([
				{
					$match: { paymentStatus: { $ne: "created" } },
				},
				{
					$group: {
						_id: null,
						totalRevenue: {
							$sum: {
								$cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0],
							},
						},
						totalRefunded: {
							$sum: {
								$cond: [{ $eq: ["$paymentStatus", "refunded"] }, "$totalAmount", 0],
							},
						},
						totalOrders: { $sum: 1 },
						cancelledOrders: {
							$sum: {
								$cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
							},
						},
					},
				},
			]),
		]);

		const metrics = allOrdersSummary[0] || {
			totalRevenue: 0,
			totalRefunded: 0,
			totalOrders: 0,
			cancelledOrders: 0,
		};

		return res.status(200).json({
			orders,
			total,
			page: Number(page),
			pages: Math.ceil(total / Number(limit)) || 1,
			metrics,
		});
	} catch (error) {
		console.error("Error fetching admin orders:", error);
		return res.status(500).json({ error: "Failed to fetch orders", message: error.message });
	}
};

/**
 * POST /api/orders/admin/:id/cancel
 * Admin cancels an order with policy justification, inventory restore, and optional refund
 */
export const adminCancelOrder = async (req, res) => {
	try {
		const { id } = req.params;
		const { reason, initiateRefund = true, comment } = req.body;

		if (!reason || !reason.trim()) {
			return res.status(400).json({ error: "A cancellation reason is required for administrative audit." });
		}

		const order = await Order.findById(id).populate("products.product").populate("user", "name email");
		if (!order) {
			return res.status(404).json({ error: "Order not found." });
		}

		if (order.status === "cancelled") {
			return res.status(400).json({ error: "This order is already cancelled." });
		}

		// Status transition
		order.status = "cancelled";
		order.cancellation = {
			isCancelled: true,
			cancelledAt: new Date(),
			cancelledBy: "admin",
			cancelledByUserId: req.user._id,
			reason: reason.trim(),
			comment: comment || "",
		};

		// Restore inventory
		await restoreOrderInventory(order);

		// Restore coupon
		if (order.couponCode) {
			await restoreCouponUsage(order.couponCode, order.user?._id || order.user);
		}

		// Refund handling
		let refundResult = null;
		if (initiateRefund && order.paymentStatus === "paid" && order.paymentMethod === "razorpay" && order.razorpayPaymentId) {
			try {
				const refundPaise = Math.round(order.totalAmount * 100);
				const rzpRefund = await razorpay.payments.refund(order.razorpayPaymentId, {
					amount: refundPaise,
					notes: {
						internalOrderId: order._id.toString(),
						adminId: req.user._id.toString(),
						reason: reason.trim(),
					},
				});

				order.refund = {
					refundId: rzpRefund.id || `rfnd_${Date.now()}`,
					amount: order.totalAmount,
					status: rzpRefund.status === "failed" ? "failed" : "processed",
					reason: reason.trim(),
					refundedAt: new Date(),
					razorpayPaymentId: order.razorpayPaymentId,
					razorpayResponse: rzpRefund,
				};
				order.paymentStatus = "refunded";
				refundResult = order.refund;
			} catch (rzpErr) {
				console.error("[Admin Razorpay Refund Error]", rzpErr.message || rzpErr);
				order.refund = {
					refundId: "",
					amount: order.totalAmount,
					status: "failed",
					reason: reason.trim(),
					failureReason: rzpErr.error?.description || rzpErr.message || "Gateway refund API rejected request",
					razorpayPaymentId: order.razorpayPaymentId,
				};
				refundResult = order.refund;
			}
		} else if (order.paymentStatus !== "paid") {
			order.paymentStatus = "cancelled";
			order.refund = { status: "not_applicable", amount: 0, reason: "No payment captured" };
		}

		// Shiprocket cancellation
		if (order.shiprocketOrderId || order.shiprocketAwb) {
			try {
				const srCancel = await cancelShiprocketOrder({
					shiprocketOrderId: order.shiprocketOrderId,
					shiprocketAwb: order.shiprocketAwb,
				});
				if (srCancel.success) {
					order.shipmentStatus = "cancelled";
				} else {
					order.shiprocketError = srCancel.error;
				}
			} catch (srErr) {
				console.warn("[Admin Shiprocket Cancel Note]", srErr.message);
				order.shiprocketError = srErr.message;
			}
		}

		// Audit Log
		order.auditLog = order.auditLog || [];
		order.auditLog.push({
			action: "order_cancelled_by_admin",
			performedBy: "admin",
			performedByUserId: req.user._id,
			performedAt: new Date(),
			details: {
				reason: reason.trim(),
				initiateRefund,
				refundStatus: order.refund?.status,
				refundError: order.refund?.failureReason || null,
			},
		});

		await order.save();

		// Notifications & transactional email
		const customerUser = order.user;
		if (customerUser) {
			try {
				await Notification.create({
					user: customerUser._id || customerUser,
					type: "order",
					title: "Order Cancelled by Merchant",
					message: `Your order #${order._id
						.toString()
						.slice(-6)
						.toUpperCase()} was cancelled by store operations. Reason: ${reason.trim()}`,
					link: "/orders",
				});
			} catch (e) {}

			if (customerUser.email) {
				try {
					await sendOrderCancellationEmail({
						order,
						user: customerUser,
						reason: reason.trim(),
						refundInfo: order.refund,
					});
				} catch (emailErr) {
					console.warn("Email dispatch note:", emailErr.message);
				}
			}
		}

		return res.status(200).json({
			success: true,
			message: "Order cancelled by administrator.",
			order,
			refund: refundResult,
		});
	} catch (error) {
		console.error("Error in adminCancelOrder:", error);
		return res.status(500).json({ error: "Admin order cancellation failed", message: error.message });
	}
};

/**
 * POST /api/orders/admin/:id/refund
 * Admin initiates or re-tries a refund through Razorpay API for a paid order
 */
export const adminRefundOrder = async (req, res) => {
	try {
		const { id } = req.params;
		const { amount, reason = "Administrative refund" } = req.body;

		const order = await Order.findById(id).populate("user", "name email");
		if (!order) {
			return res.status(404).json({ error: "Order not found." });
		}

		if (!order.razorpayPaymentId) {
			return res.status(400).json({
				error: "Cannot refund: No Razorpay payment ID exists for this order.",
			});
		}

		if (order.refund?.status === "processed") {
			return res.status(400).json({
				error: `This order was already refunded (Reference: ${order.refund.refundId}).`,
			});
		}

		const refundAmountRupees = Number(amount) || order.totalAmount;
		const refundAmountPaise = Math.round(refundAmountRupees * 100);

		try {
			const rzpRefund = await razorpay.payments.refund(order.razorpayPaymentId, {
				amount: refundAmountPaise,
				notes: {
					internalOrderId: order._id.toString(),
					adminId: req.user._id.toString(),
					reason,
				},
			});

			order.refund = {
				refundId: rzpRefund.id || `rfnd_${Date.now()}`,
				amount: refundAmountRupees,
				status: rzpRefund.status === "failed" ? "failed" : "processed",
				reason,
				refundedAt: new Date(),
				razorpayPaymentId: order.razorpayPaymentId,
				razorpayResponse: rzpRefund,
			};
			order.paymentStatus = "refunded";

			order.auditLog = order.auditLog || [];
			order.auditLog.push({
				action: "admin_refund_initiated",
				performedBy: "admin",
				performedByUserId: req.user._id,
				performedAt: new Date(),
				details: {
					refundId: rzpRefund.id,
					amount: refundAmountRupees,
					status: rzpRefund.status,
				},
			});

			await order.save();

			if (order.user?.email) {
				try {
					await sendRefundUpdateEmail({
						order,
						user: order.user,
						refundInfo: order.refund,
					});
				} catch (e) {}
			}

			return res.status(200).json({
				success: true,
				message: `Refund of ₹${refundAmountRupees.toLocaleString("en-IN")} initiated successfully.`,
				refund: order.refund,
			});
		} catch (rzpErr) {
			console.error("[Admin Manual Refund Error]", rzpErr);
			order.refund = {
				refundId: "",
				amount: refundAmountRupees,
				status: "failed",
				reason,
				failureReason: rzpErr.error?.description || rzpErr.message || "Razorpay API rejected refund",
				razorpayPaymentId: order.razorpayPaymentId,
			};
			await order.save();

			return res.status(502).json({
				error: "Razorpay refund failed.",
				details: rzpErr.error?.description || rzpErr.message,
				refund: order.refund,
			});
		}
	} catch (error) {
		console.error("Error in adminRefundOrder:", error);
		return res.status(500).json({ error: "Failed to process refund", message: error.message });
	}
};

/**
 * PUT /api/orders/admin/:id/status
 * Admin updates order status or shipment milestones
 */
export const adminUpdateOrderStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status, shipmentStatus, note } = req.body;

		const order = await Order.findById(id).populate("user", "name email");
		if (!order) {
			return res.status(404).json({ error: "Order not found." });
		}

		const previousStatus = order.status;
		const previousShipmentStatus = order.shipmentStatus;

		if (status) order.status = status;
		if (shipmentStatus) order.shipmentStatus = shipmentStatus;

		order.auditLog = order.auditLog || [];
		order.auditLog.push({
			action: "admin_status_update",
			performedBy: "admin",
			performedByUserId: req.user._id,
			performedAt: new Date(),
			details: {
				previousStatus,
				newStatus: order.status,
				previousShipmentStatus,
				newShipmentStatus: order.shipmentStatus,
				note: note || "",
			},
		});

		await order.save();

		// In-app notification for status updates
		if (order.user) {
			try {
				await Notification.create({
					user: order.user._id || order.user,
					type: "order",
					title: `Order Status: ${order.status.toUpperCase()}`,
					message: `Your order #${order._id.toString().slice(-6).toUpperCase()} status is now "${order.status}".`,
					link: "/orders",
				});
			} catch (e) {}

			// Transactional email notification for status update
			if (order.user.email) {
				sendOrderStatusUpdateEmail({
					order,
					user: order.user,
					newStatus: order.status,
					trackingNumber: order.shiprocketAwb,
					courierName: order.shiprocketCourierName,
				}).catch((e) => console.warn("Order status update email note:", e.message));
			}
		}

		return res.status(200).json({
			success: true,
			message: "Order status updated successfully.",
			order,
		});
	} catch (error) {
		console.error("Error updating order status:", error);
		return res.status(500).json({ error: "Failed to update order status", message: error.message });
	}
};

