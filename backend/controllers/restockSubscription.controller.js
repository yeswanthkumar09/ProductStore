import RestockSubscription from "../models/restockSubscription.model.js";
import Product from "../models/product.model.js";
import Notification from "../models/notification.model.js";
import { sendRestockAlertEmail } from "../services/email.service.js";

/**
 * POST /api/restock-subscriptions/subscribe
 * Register customer subscription for out-of-stock product or specific variant
 */
export const subscribeRestock = async (req, res) => {
	try {
		const { productId, variantId, size, color, email } = req.body;

		if (!productId) {
			return res.status(400).json({ message: "Product ID is required." });
		}

		// 1. Validate product exists
		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({ message: "Product not found." });
		}

		// 2. Resolve subscriber email and user ID
		let subscriberEmail = "";
		let userId = null;

		if (req.user) {
			userId = req.user._id;
			subscriberEmail = (email || req.user.email || "").trim().toLowerCase();
		} else {
			if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
				return res.status(400).json({ message: "A valid email address is required to subscribe." });
			}
			subscriberEmail = email.trim().toLowerCase();
		}

		const cleanSize = (size || "").trim().toUpperCase();
		const cleanVariantId = variantId || null;

		// 3. Prevent duplicate active subscriptions
		const existingActive = await RestockSubscription.findOne({
			email: subscriberEmail,
			product: productId,
			variantId: cleanVariantId,
			size: cleanSize,
			status: "active",
		});

		if (existingActive) {
			return res.status(200).json({
				success: true,
				alreadySubscribed: true,
				message: `You are already registered to receive restock alerts for ${product.name}${cleanSize ? ` (${cleanSize})` : ""}.`,
				subscription: existingActive,
			});
		}

		// 4. Create new subscription
		const subscription = await RestockSubscription.create({
			user: userId,
			email: subscriberEmail,
			product: productId,
			variantId: cleanVariantId,
			size: cleanSize,
			color: color || null,
			status: "active",
			deliveryStatus: "pending",
		});

		// 5. In-app confirmation notification for authenticated user
		if (userId) {
			try {
				await Notification.create({
					user: userId,
					type: "announcement",
					title: "Restock Alert Subscribed",
					message: `We'll notify you as soon as ${product.name}${cleanSize ? ` (${cleanSize})` : ""} is back in stock!`,
					link: `/product/${productId}`,
				});
			} catch (notifErr) {
				console.warn("Restock confirmation notification note:", notifErr.message);
			}
		}

		return res.status(201).json({
			success: true,
			message: `You're all set! We will email you at ${subscriberEmail} the moment ${product.name}${cleanSize ? ` (${cleanSize})` : ""} arrives in stock.`,
			subscription,
		});
	} catch (error) {
		console.error("Error in subscribeRestock:", error);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * GET /api/restock-subscriptions/my
 * Customer views their active and past restock subscriptions
 */
export const getMySubscriptions = async (req, res) => {
	try {
		const userId = req.user._id;
		const userEmail = req.user.email.toLowerCase();

		const subscriptions = await RestockSubscription.find({
			$or: [{ user: userId }, { email: userEmail }],
		})
			.populate("product", "name image price stock category slug variants")
			.sort({ createdAt: -1 });

		return res.status(200).json(subscriptions);
	} catch (error) {
		console.error("Error in getMySubscriptions:", error);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * DELETE /api/restock-subscriptions/:id
 * Customer cancels their restock subscription
 */
export const cancelSubscription = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user?._id;
		const userEmail = req.user?.email?.toLowerCase();

		const subscription = await RestockSubscription.findById(id);
		if (!subscription) {
			return res.status(404).json({ message: "Subscription not found." });
		}

		// Verify ownership unless admin
		const isOwner =
			(userId && subscription.user && subscription.user.toString() === userId.toString()) ||
			(userEmail && subscription.email === userEmail);
		const isAdmin = req.user?.role === "admin";

		if (!isOwner && !isAdmin) {
			return res.status(403).json({ message: "Unauthorized to cancel this subscription." });
		}

		subscription.status = "cancelled";
		await subscription.save();

		return res.status(200).json({
			success: true,
			message: "Restock alert subscription has been cancelled.",
			subscription,
		});
	} catch (error) {
		console.error("Error in cancelSubscription:", error);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * GET /api/restock-subscriptions/admin
 * Admin reviews all restock subscriptions, inventory status, and notification telemetry
 */
export const getAdminSubscriptions = async (req, res) => {
	try {
		const { product, status, page = 1, limit = 20, search } = req.query;

		const query = {};

		if (status && status !== "all") {
			query.status = status;
		}

		if (product) {
			query.product = product;
		}

		if (search && search.trim()) {
			query.$or = [
				{ email: { $regex: search.trim(), $options: "i" } },
				{ size: { $regex: search.trim(), $options: "i" } },
			];
		}

		const skip = (Number(page) - 1) * Number(limit);

		const [subscriptions, total, summary] = await Promise.all([
			RestockSubscription.find(query)
				.populate("product", "name image price stock category")
				.populate("user", "name email")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(Number(limit)),
			RestockSubscription.countDocuments(query),
			RestockSubscription.aggregate([
				{
					$group: {
						_id: null,
						total: { $sum: 1 },
						active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
						notified: { $sum: { $cond: [{ $eq: ["$status", "notified"] }, 1, 0] } },
						failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
						cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
					},
				},
			]),
		]);

		const metrics = summary[0] || { total: 0, active: 0, notified: 0, failed: 0, cancelled: 0 };

		return res.status(200).json({
			subscriptions,
			total,
			page: Number(page),
			pages: Math.ceil(total / Number(limit)) || 1,
			metrics,
		});
	} catch (error) {
		console.error("Error in getAdminSubscriptions:", error);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * POST /api/restock-subscriptions/admin/:id/retry
 * Admin manually re-triggers a restock notification for a subscriber
 */
export const retryNotificationAdmin = async (req, res) => {
	try {
		const { id } = req.params;
		const subscription = await RestockSubscription.findById(id).populate("product").populate("user");

		if (!subscription) {
			return res.status(404).json({ message: "Subscription not found." });
		}

		const product = subscription.product;
		if (!product) {
			return res.status(400).json({ message: "Associated product no longer exists." });
		}

		subscription.deliveryStatus = "retrying";
		await subscription.save();

		// Dispatch email
		const directUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/product/${product._id}`;
		const result = await sendRestockAlertEmail({
			email: subscription.email,
			subscriberName: subscription.user?.name || "Valued Patron",
			product,
			size: subscription.size,
			color: subscription.color?.name || "",
			directUrl,
			subscriptionId: subscription._id,
		});

		if (result && (result.success || result.status === "provider_not_configured" || result.messageId)) {
			subscription.status = "notified";
			subscription.deliveryStatus = "sent";
			subscription.notifiedAt = new Date();
			subscription.lastError = "";
		} else {
			subscription.status = "failed";
			subscription.deliveryStatus = "failed";
			subscription.lastError = result?.error || "Email delivery failed";
			subscription.retryCount = (subscription.retryCount || 0) + 1;
		}

		await subscription.save();

		return res.status(200).json({
			success: true,
			message: subscription.status === "notified" ? "Notification sent successfully." : "Notification retry failed.",
			subscription,
		});
	} catch (error) {
		console.error("Error in retryNotificationAdmin:", error);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Core Engine: Check and trigger restock notifications asynchronously
 * Called from product update / inventory restock logic
 */
export const checkAndTriggerRestock = async ({
	productId,
	variantId = null,
	size = "",
	colorName = "",
	previousStock = 0,
	newStock = 0,
}) => {
	try {
		// Strict condition: only trigger when transitioning from 0 to > 0
		if (previousStock > 0 || newStock <= 0) {
			return { triggered: false, reason: "Not an out-of-stock to in-stock transition" };
		}

		const product = await Product.findById(productId);
		if (!product) {
			return { triggered: false, reason: "Product not found" };
		}

		// Find active subscribers
		const query = {
			product: productId,
			status: "active",
		};

		if (variantId) {
			query.$or = [{ variantId }, { size: (size || "").trim().toUpperCase() }];
		} else if (size) {
			query.size = size.trim().toUpperCase();
		}

		const activeSubscribers = await RestockSubscription.find(query).populate("user");

		if (activeSubscribers.length === 0) {
			return { triggered: true, notifiedCount: 0, message: "No active subscribers for this item" };
		}

		console.log(
			`[RESTOCK ENGINE] Found ${activeSubscribers.length} subscribers for restocked product "${product.name}" (Size: ${size || "N/A"})`
		);

		// Process subscribers asynchronously in background
		const restockEventId = `restock_${productId}_${Date.now()}`;

		// Mark subscribers as queued to prevent duplicate processing
		const subscriberIds = activeSubscribers.map((s) => s._id);
		await RestockSubscription.updateMany(
			{ _id: { $in: subscriberIds } },
			{ status: "queued", deliveryStatus: "pending", restockEventRef: restockEventId }
		);

		// Non-blocking dispatch
		setImmediate(async () => {
			for (const sub of activeSubscribers) {
				try {
					const directUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/product/${product._id}`;
					const result = await sendRestockAlertEmail({
						email: sub.email,
						subscriberName: sub.user?.name || "Valued Patron",
						product,
						size: sub.size || size,
						color: sub.color?.name || colorName,
						directUrl,
						subscriptionId: sub._id,
					});

					// Also dispatch in-app notification if user account exists
					if (sub.user) {
						try {
							await Notification.create({
								user: sub.user._id,
								type: "new_arrival",
								title: "Back In Stock: " + product.name,
								message: `The piece you saved${sub.size ? ` (Size ${sub.size})` : ""} is back in stock in limited quantities!`,
								link: `/product/${product._id}`,
							});
						} catch (e) {}
					}

					await RestockSubscription.findByIdAndUpdate(sub._id, {
						status: "notified",
						deliveryStatus: "sent",
						notifiedAt: new Date(),
						lastError: "",
					});
				} catch (err) {
					console.error(`[RESTOCK ERROR] Failed notification for ${sub.email}:`, err.message);
					await RestockSubscription.findByIdAndUpdate(sub._id, {
						status: "failed",
						deliveryStatus: "failed",
						lastError: err.message,
						$inc: { retryCount: 1 },
					});
				}
			}
		});

		return {
			triggered: true,
			notifiedCount: activeSubscribers.length,
			restockEventId,
		};
	} catch (error) {
		console.error("Error in checkAndTriggerRestock:", error);
		return { triggered: false, error: error.message };
	}
};

