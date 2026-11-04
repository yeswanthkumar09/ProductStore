import crypto from "crypto";
import mongoose from "mongoose";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Address from "../models/address.model.js";
import ServiceableLocation from "../models/serviceableLocation.model.js";
import { stripe } from "../lib/stripe.js";
import { razorpay } from "../lib/razorpay.js";
import { evaluateCouponDiscount } from "./coupon.controller.js";
import { sendOrderConfirmationEmail, sendPaymentSuccessEmail } from "../services/email.service.js";
import { checkCourierServiceability, createShiprocketOrder } from "../services/shiprocket.service.js";

export const createCheckoutSession = async (req, res) => {
	try {
		const { products, couponCode, addressId, shippingAddress } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ error: "Invalid or empty products array" });
		}

		// Security & Integrity: Resolve and validate delivery address
		let resolvedAddress = null;
		if (addressId) {
			resolvedAddress = await Address.findOne({ _id: addressId, user: req.user._id });
			if (!resolvedAddress) {
				return res.status(400).json({ error: "Selected delivery address was not found." });
			}
		} else if (shippingAddress && shippingAddress.pincode) {
			resolvedAddress = shippingAddress;
		} else {
			// Check if customer has a default or saved address
			resolvedAddress =
				(await Address.findOne({ user: req.user._id, isDefault: true })) ||
				(await Address.findOne({ user: req.user._id }));
		}

		if (!resolvedAddress || !resolvedAddress.pincode) {
			return res.status(400).json({
				error: "A valid delivery address with PIN code is required to checkout.",
			});
		}

		const cleanPincode = (resolvedAddress.pincode || "").toString().trim();

		// 1. Check if merchant explicitly restricted this PIN code
		const explicitRestriction = await ServiceableLocation.findOne({ pincode: cleanPincode, isActive: false });
		if (explicitRestriction) {
			return res.status(400).json({
				error: explicitRestriction.serviceRestrictions || `Delivery to PIN ${cleanPincode} is restricted by merchant policy.`,
			});
		}

		// 2. Authoritatively revalidate courier serviceability via Shiprocket
		const srCheck = await checkCourierServiceability({
			deliveryPincode: cleanPincode,
			cod: false,
		});

		const adminLocation = await ServiceableLocation.findOne({ pincode: cleanPincode, isActive: true });
		const isShiprocketUnconfigured = !process.env.SHIPROCKET_EMAIL || process.env.SHIPROCKET_EMAIL.includes("example.com");

		if (srCheck.isInconclusive && !adminLocation && !isShiprocketUnconfigured) {
			return res.status(503).json({
				error: "Unable to verify delivery availability with logistics provider. Please try again.",
				retryable: true,
			});
		}

		if (!srCheck.serviceable && !adminLocation && !isShiprocketUnconfigured) {
			return res.status(400).json({
				error: `Delivery is currently unavailable for PIN code ${cleanPincode}.`,
			});
		}

		// Security: Validate prices and existence authoritatively from the database
		const rawProductIds = products
			.map((p) => p._id || p.id || p.productId)
			.filter((id) => id && mongoose.Types.ObjectId.isValid(id));

		const dbProducts = await Product.find({
			$or: [
				{ _id: { $in: rawProductIds } },
				{ "variants._id": { $in: rawProductIds } },
			],
		});

		const dbProductMap = new Map();
		dbProducts.forEach((p) => {
			dbProductMap.set(p._id.toString(), p);
			if (Array.isArray(p.variants)) {
				p.variants.forEach((v) => {
					if (v._id) dbProductMap.set(v._id.toString(), p);
				});
			}
		});

		let totalAmount = 0;
		const lineItems = [];
		const verifiedProductsForMetadata = [];

		for (const item of products) {
			const itemId = (item._id || item.id || item.productId || "").toString();
			let dbProduct = dbProductMap.get(itemId);

			// Resilient fallback lookup if ID format changed or from older localStorage session
			if (!dbProduct) {
				const skuToFind = item.sku || (item.variant && item.variant.sku);
				const nameToFind = item.name ? item.name.trim() : null;

				if (skuToFind) {
					dbProduct = await Product.findOne({
						$or: [{ sku: skuToFind }, { "variants.sku": skuToFind }],
					});
				}
				if (!dbProduct && nameToFind) {
					dbProduct = await Product.findOne({
						name: new RegExp(`^${nameToFind.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
					});
				}
				if (dbProduct) {
					dbProductMap.set(itemId, dbProduct);
					dbProductMap.set(dbProduct._id.toString(), dbProduct);
				}
			}

			if (!dbProduct) {
				return res.status(400).json({
					error: `"${item.name || "A garment in your bag"}" is no longer available in our catalogue. Please remove it from your bag to proceed.`,
				});
			}

			const quantity = Math.max(1, Number(item.quantity) || 1);

			// Authoritatively resolve variant if specified
			let variant = null;
			if (item.variantId && Array.isArray(dbProduct.variants)) {
				variant =
					dbProduct.variants.id(item.variantId) ||
					dbProduct.variants.find((v) => v._id?.toString() === item.variantId);
			}

			const authoritativeStock = variant ? variant.stock : dbProduct.stock;
			const authoritativePrice = variant ? variant.price : dbProduct.price;
			const itemName = variant
				? `${dbProduct.name} (${variant.color?.name || ""} ${variant.size || ""})`.trim()
				: dbProduct.name;
			const itemImage = variant?.images?.[0] || dbProduct.images?.[0] || dbProduct.image;

			// Check stock availability
			if (authoritativeStock !== undefined && authoritativeStock < quantity) {
				return res.status(400).json({
					error: `Insufficient stock for "${itemName}". Only ${authoritativeStock} available.`,
				});
			}

			// In INR, 1 INR = 100 paise
			const amountInPaise = Math.round(authoritativePrice * 100);
			totalAmount += amountInPaise * quantity;

			lineItems.push({
				price_data: {
					currency: "inr",
					product_data: {
						name: itemName,
						images: itemImage ? [itemImage] : [],
					},
					unit_amount: amountInPaise,
				},
				quantity: quantity,
			});

			verifiedProductsForMetadata.push({
				id: dbProduct._id.toString(),
				name: dbProduct.name,
				image: itemImage,
				variantId: variant?._id?.toString() || null,
				quantity: quantity,
				price: authoritativePrice,
				color: item.selectedColor || variant?.color?.name || null,
				size: item.selectedSize || variant?.size || null,
				sku: variant?.sku || dbProduct.sku || "",
			});
		}

		// Calculate delivery fee authoritatively
		let deliveryFeeInPaise = 0;
		const subtotalRupees = totalAmount / 100;
		const freeThreshold = adminLocation?.freeDeliveryThreshold !== undefined ? adminLocation.freeDeliveryThreshold : 1999;

		if (adminLocation?.minOrderValue && subtotalRupees < adminLocation.minOrderValue) {
			return res.status(400).json({
				error: `Minimum order value for delivery to PIN ${cleanPincode} is ₹${adminLocation.minOrderValue}.`,
			});
		}

		if (subtotalRupees >= freeThreshold) {
			deliveryFeeInPaise = 0;
		} else if (adminLocation && adminLocation.deliveryFee !== undefined) {
			deliveryFeeInPaise = Math.round(adminLocation.deliveryFee * 100);
		} else if (srCheck.minDeliveryFee > 0) {
			deliveryFeeInPaise = Math.round(srCheck.minDeliveryFee * 100);
		} else if (subtotalRupees < freeThreshold) {
			deliveryFeeInPaise = 5000;
		} else {
			deliveryFeeInPaise = 0;
		}

		if (deliveryFeeInPaise > 0) {
			lineItems.push({
				price_data: {
					currency: "inr",
					product_data: {
						name: `Delivery Charge (PIN: ${cleanPincode})`,
					},
					unit_amount: deliveryFeeInPaise,
				},
				quantity: 1,
			});
			totalAmount += deliveryFeeInPaise;
		}

		let coupon = null;
		let discountAmountInPaise = 0;
		if (couponCode) {
			const couponEval = await evaluateCouponDiscount({
				code: couponCode,
				user: req.user,
				cartItems: products,
			});
			if (couponEval.isValid) {
				coupon = couponEval.coupon;
				discountAmountInPaise = Math.round(couponEval.discountAmount * 100);
				totalAmount = Math.max(0, totalAmount - discountAmountInPaise);
			} else {
				return res.status(400).json({ error: couponEval.message });
			}
		}

		const snapshotAddress = {
			fullName: resolvedAddress.fullName || req.user.name,
			phone: resolvedAddress.phone || req.user.phone || "",
			houseFlat: resolvedAddress.houseFlat || "",
			street: resolvedAddress.street || "",
			landmark: resolvedAddress.landmark || "",
			locality: resolvedAddress.locality || "",
			city: resolvedAddress.city || adminLocation?.city || srCheck.city || "",
			district: resolvedAddress.district || adminLocation?.district || "",
			state: resolvedAddress.state || adminLocation?.state || srCheck.state || "",
			country: resolvedAddress.country || "India",
			pincode: cleanPincode,
			addressType: resolvedAddress.addressType || "Home",
			deliveryInstructions: resolvedAddress.deliveryInstructions || "",
		};

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: lineItems,
			mode: "payment",
			success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
			discounts:
				coupon && coupon.discountType === "percentage"
					? [
							{
								coupon: await createStripeCoupon(coupon.discountValue || coupon.discountPercentage),
							},
					  ]
					: [],
			metadata: {
				userId: req.user._id.toString(),
				couponCode: couponCode ? couponCode.trim().toUpperCase() : "",
				products: JSON.stringify(verifiedProductsForMetadata),
				addressId: resolvedAddress._id ? resolvedAddress._id.toString() : "",
				pincode: cleanPincode,
				deliveryFee: (deliveryFeeInPaise / 100).toString(),
				estimatedDeliveryDays: serviceableLoc.estimatedDeliveryDays || "2-4 business days",
				shippingAddress: JSON.stringify(snapshotAddress),
			},
		});

		// If total order exceeds ₹5,000 (500,000 paise), reward user with 10% coupon
		if (totalAmount >= 500000) {
			await createNewCoupon(req.user._id);
		}
		res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
	} catch (error) {
		console.error("Error processing checkout:", error);
		res.status(500).json({ message: "Error processing checkout", error: error.message });
	}
};

export const checkoutSuccess = async (req, res) => {
	try {
		const { sessionId } = req.body;

		if (!sessionId) {
			return res.status(400).json({ error: "sessionId is required" });
		}

		// Idempotency: Prevent duplicate orders if user refreshes purchase-success page
		const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
		if (existingOrder) {
			return res.status(200).json({
				success: true,
				message: "Order already fulfilled",
				orderId: existingOrder._id,
			});
		}

		const session = await stripe.checkout.sessions.retrieve(sessionId);

		if (session.payment_status === "paid") {
			const products = JSON.parse(session.metadata.products || "[]");
			const orderTotal = session.amount_total / 100; // convert from paise to INR
			const shippingAddress = session.metadata.shippingAddress
				? JSON.parse(session.metadata.shippingAddress)
				: {};

			// Create a new Order with verified items and full shipping address snapshot
			const newOrder = new Order({
				user: session.metadata.userId,
				products: products.map((product) => ({
					product: product.id,
					variantId: product.variantId || "",
					selectedColor: product.color || "",
					selectedSize: product.size || "",
					sku: product.sku || "",
					quantity: product.quantity,
					price: product.price,
				})),
				totalAmount: orderTotal,
				stripeSessionId: sessionId,
				shippingAddress,
				deliveryFee: Number(session.metadata.deliveryFee || 0),
				estimatedDeliveryDays: session.metadata.estimatedDeliveryDays || "2-4 business days",
				status: "processing",
				paymentStatus: "paid",
			});

			await newOrder.save();

			// Atomically record coupon usage
			if (session.metadata.couponCode) {
				const coupon = await Coupon.findOne({ code: session.metadata.couponCode });
				if (coupon) {
					coupon.usedCount = (coupon.usedCount || 0) + 1;
					if (!Array.isArray(coupon.usedBy)) coupon.usedBy = [];
					coupon.usedBy.push({
						user: session.metadata.userId,
						orderId: newOrder._id,
						usedAt: new Date(),
					});
					if (coupon.userId) {
						coupon.isActive = false;
					}
					await coupon.save();
				}
			}

			// Decrement inventory stock on products and variants
			for (const p of products) {
				const prod = await Product.findById(p.id);
				if (prod) {
					prod.stock = Math.max(0, (prod.stock || 0) - p.quantity);
					if (p.variantId && Array.isArray(prod.variants)) {
						const v =
							prod.variants.id(p.variantId) ||
							prod.variants.find((vr) => vr._id?.toString() === p.variantId);
						if (v) {
							v.stock = Math.max(0, (v.stock || 0) - p.quantity);
						}
					}
					await prod.save();
				}
			}

			// Clear user's cart in database
			await User.findByIdAndUpdate(session.metadata.userId, { cartItems: [] });

			// Populate user to get name and email for emails
			const customerUser = await User.findById(session.metadata.userId);

			// Trigger automated transactional order confirmation & payment confirmation emails
			try {
				if (customerUser && customerUser.email) {
					await sendOrderConfirmationEmail({
						order: newOrder,
						user: customerUser,
						products,
						shippingAddress,
						couponCode: session.metadata.couponCode,
					});
					await sendPaymentSuccessEmail({
						order: newOrder,
						user: customerUser,
						amount: orderTotal,
					});
				}
			} catch (emailErr) {
				console.error("Transactional email dispatch note:", emailErr.message);
			}

			// Create in-app order confirmation notification
			try {
				const Notification = (await import("../models/notification.model.js")).default;
				await Notification.create({
					user: session.metadata.userId,
					type: "order",
					title: "Order Confirmed!",
					message: `Your order #${newOrder._id
						.toString()
						.slice(-6)
						.toUpperCase()} of ₹${orderTotal.toLocaleString("en-IN")} was placed successfully.`,
					link: "/orders",
				});
			} catch (notifErr) {
				console.error("Failed to create order notification:", notifErr);
			}

			// Attempt Shiprocket logistics shipment creation (side-effect isolated: preserves paid order)
			try {
				await createShiprocketOrder(newOrder);
			} catch (srErr) {
				console.warn(`[Shiprocket Shipment] Order #${newOrder._id} paid, shipment note: ${srErr.message}`);
			}

			res.status(200).json({
				success: true,
				message: "Payment successful, order created, stock updated, and coupon recorded.",
				orderId: newOrder._id,
			});
		} else {
			res.status(400).json({ error: "Payment was not completed" });
		}
	} catch (error) {
		console.error("Error processing successful checkout:", error);
		res.status(500).json({ message: "Error processing successful checkout", error: error.message });
	}
};

async function createStripeCoupon(discountPercentage) {
	const coupon = await stripe.coupons.create({
		percent_off: discountPercentage,
		duration: "once",
	});

	return coupon.id;
}

async function createNewCoupon(userId) {
	await Coupon.findOneAndDelete({ userId });

	const newCoupon = new Coupon({
		code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
		discountPercentage: 10,
		expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
		userId: userId,
	});

	await newCoupon.save();

	return newCoupon;
}

// ==========================================
// RAZORPAY STANDARD CHECKOUT CONTROLLERS
// ==========================================

/**
 * Timing-safe HMAC-SHA256 signature verifier
 */
const verifyRazorpaySignature = (orderId, paymentId, signature, secret) => {
	if (!orderId || !paymentId || !signature || !secret) return false;
	if (typeof signature !== "string" || !/^[0-9a-fA-F]{64}$/.test(signature)) return false;

	const payload = `${orderId}|${paymentId}`;
	const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
	const expectedBuffer = Buffer.from(expected, "utf8");
	const actualBuffer = Buffer.from(signature, "utf8");

	if (expectedBuffer.length !== actualBuffer.length) return false;
	return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

/**
 * Timing-safe webhook signature verifier using raw request body
 */
const verifyWebhookHmacSignature = (rawBody, signature, secret) => {
	if (!rawBody || !signature || !secret) return false;
	if (typeof signature !== "string" || !/^[0-9a-fA-F]{64}$/.test(signature)) return false;

	const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
	const expectedBuffer = Buffer.from(expected, "utf8");
	const actualBuffer = Buffer.from(signature, "utf8");

	if (expectedBuffer.length !== actualBuffer.length) return false;
	return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

/**
 * Decrement inventory stock on products and variants
 */
const deductInventoryForOrder = async (products) => {
	for (const p of products) {
		const productId = p.product?._id || p.product || p.id;
		if (!productId) continue;

		const prod = await Product.findById(productId);
		if (prod) {
			prod.stock = Math.max(0, (prod.stock || 0) - p.quantity);
			if (p.variantId && Array.isArray(prod.variants)) {
				const v =
					prod.variants.id(p.variantId) ||
					prod.variants.find((vr) => vr._id?.toString() === p.variantId);
				if (v) {
					v.stock = Math.max(0, (v.stock || 0) - p.quantity);
				}
			}
			await prod.save();
		}
	}
};

/**
 * Record coupon usage idempotently
 */
const recordCouponUsage = async (couponCode, userId, orderId) => {
	if (!couponCode) return;
	const coupon = await Coupon.findOne({ code: couponCode });
	if (coupon) {
		coupon.usedCount = (coupon.usedCount || 0) + 1;
		if (!Array.isArray(coupon.usedBy)) coupon.usedBy = [];
		coupon.usedBy.push({
			user: userId,
			orderId: orderId,
			usedAt: new Date(),
		});
		if (coupon.userId) {
			coupon.isActive = false;
		}
		await coupon.save();
	}
};

/**
 * Dispatch transactional order & payment confirmation notifications
 */
const sendOrderNotifications = async (order, user, products, shippingAddress, couponCode) => {
	try {
		if (user && user.email) {
			await sendOrderConfirmationEmail({
				order,
				user,
				products,
				shippingAddress,
				couponCode,
			});
			await sendPaymentSuccessEmail({
				order,
				user,
				amount: order.totalAmount,
			});
		}
	} catch (emailErr) {
		console.error("Order notification email notice:", emailErr.message);
	}

	try {
		const Notification = (await import("../models/notification.model.js")).default;
		await Notification.create({
			user: order.user,
			type: "order",
			title: "Order Confirmed!",
			message: `Your order #${order._id
				.toString()
				.slice(-6)
				.toUpperCase()} of ₹${Number(order.totalAmount || 0).toLocaleString("en-IN")} was placed successfully.`,
			link: "/orders",
		});
	} catch (notifErr) {
		console.error("Failed to create in-app order notification:", notifErr.message);
	}
};

/**
 * POST /api/payments/create-order
 * Authoritatively calculates order total server-side and creates a Razorpay Order
 */
export const createRazorpayOrder = async (req, res) => {
	try {
		const { products, couponCode, addressId, shippingAddress } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ error: "Invalid or empty products array." });
		}

		// Security & Integrity: Resolve and validate delivery address
		let resolvedAddress = null;
		if (addressId) {
			resolvedAddress = await Address.findOne({ _id: addressId, user: req.user._id });
			if (!resolvedAddress) {
				return res.status(400).json({ error: "Selected delivery address was not found." });
			}
		} else if (shippingAddress && shippingAddress.pincode) {
			resolvedAddress = shippingAddress;
		} else {
			resolvedAddress =
				(await Address.findOne({ user: req.user._id, isDefault: true })) ||
				(await Address.findOne({ user: req.user._id }));
		}

		if (!resolvedAddress || !resolvedAddress.pincode) {
			return res.status(400).json({
				error: "A valid delivery address with PIN code is required to checkout.",
			});
		}

		const cleanPincode = (resolvedAddress.pincode || "").toString().trim();

		// 1. Check if merchant explicitly restricted this PIN code for legal or business reasons
		const explicitRestriction = await ServiceableLocation.findOne({ pincode: cleanPincode, isActive: false });
		if (explicitRestriction) {
			return res.status(400).json({
				error: explicitRestriction.serviceRestrictions || `Delivery to PIN ${cleanPincode} is restricted by merchant policy.`,
			});
		}

		// 2. Authoritatively revalidate courier serviceability via Shiprocket (Source of Truth)
		const srCheck = await checkCourierServiceability({
			deliveryPincode: cleanPincode,
			cod: false,
		});

		const adminLocation = await ServiceableLocation.findOne({ pincode: cleanPincode, isActive: true });
		const isShiprocketUnconfigured = !process.env.SHIPROCKET_EMAIL || process.env.SHIPROCKET_EMAIL.includes("example.com");

		if (srCheck.isInconclusive && !adminLocation && !isShiprocketUnconfigured) {
			return res.status(503).json({
				error: "Unable to verify delivery availability with logistics provider. Please try again.",
				retryable: true,
			});
		}

		if (!srCheck.serviceable && !adminLocation && !isShiprocketUnconfigured) {
			return res.status(400).json({
				error: `Delivery is currently unavailable for PIN code ${cleanPincode}.`,
			});
		}

		// Authoritatively validate prices, existence, and stock from MongoDB
		const rawProductIds = products
			.map((p) => p._id || p.id || p.productId)
			.filter((id) => id && mongoose.Types.ObjectId.isValid(id));

		const dbProducts = await Product.find({
			$or: [
				{ _id: { $in: rawProductIds } },
				{ "variants._id": { $in: rawProductIds } },
			],
		});

		const dbProductMap = new Map();
		dbProducts.forEach((p) => {
			dbProductMap.set(p._id.toString(), p);
			if (Array.isArray(p.variants)) {
				p.variants.forEach((v) => {
					if (v._id) dbProductMap.set(v._id.toString(), p);
				});
			}
		});

		let itemsSubtotalInPaise = 0;
		const verifiedProductsForOrder = [];

		for (const item of products) {
			const itemId = (item._id || item.id || item.productId || "").toString();
			let dbProduct = dbProductMap.get(itemId);

			// Resilient fallback lookup if ID format changed or from older localStorage session
			if (!dbProduct) {
				const skuToFind = item.sku || (item.variant && item.variant.sku);
				const nameToFind = item.name ? item.name.trim() : null;

				if (skuToFind) {
					dbProduct = await Product.findOne({
						$or: [{ sku: skuToFind }, { "variants.sku": skuToFind }],
					});
				}
				if (!dbProduct && nameToFind) {
					dbProduct = await Product.findOne({
						name: new RegExp(`^${nameToFind.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
					});
				}
				if (dbProduct) {
					dbProductMap.set(itemId, dbProduct);
					dbProductMap.set(dbProduct._id.toString(), dbProduct);
				}
			}

			if (!dbProduct) {
				return res.status(400).json({
					error: `"${item.name || "A garment in your bag"}" is no longer available in our catalogue. Please remove it from your bag to proceed.`,
				});
			}

			const quantity = Math.max(1, Number(item.quantity) || 1);

			// Authoritatively resolve variant if specified
			let variant = null;
			const targetVariantId = item.variantId || (itemId !== dbProduct._id.toString() ? itemId : null);
			if (targetVariantId && Array.isArray(dbProduct.variants)) {
				variant =
					dbProduct.variants.id(targetVariantId) ||
					dbProduct.variants.find((v) => v._id?.toString() === targetVariantId);
			}

			const authoritativeStock = variant ? variant.stock : dbProduct.stock;
			const authoritativePrice = variant ? variant.price : dbProduct.price;
			const itemName = variant
				? `${dbProduct.name} (${variant.color?.name || ""} ${variant.size || ""})`.trim()
				: dbProduct.name;
			const itemImage = variant?.images?.[0] || dbProduct.images?.[0] || dbProduct.image || "/placeholder.png";

			// Validate inventory stock
			if (authoritativeStock !== undefined && authoritativeStock < quantity) {
				return res.status(400).json({
					error: `Insufficient stock for "${itemName}". Only ${authoritativeStock} available.`,
				});
			}

			const amountInPaise = Math.round(authoritativePrice * 100);
			itemsSubtotalInPaise += amountInPaise * quantity;

			verifiedProductsForOrder.push({
				product: dbProduct._id,
				name: itemName,
				image: itemImage,
				variantId: variant?._id?.toString() || "",
				selectedColor: item.selectedColor || variant?.color?.name || "",
				selectedSize: item.selectedSize || variant?.size || "",
				sku: variant?.sku || dbProduct.sku || "",
				quantity: quantity,
				price: authoritativePrice,
			});
		}

		// Calculate delivery fee authoritatively
		let deliveryFeeInPaise = 0;
		const subtotalRupees = itemsSubtotalInPaise / 100;
		const freeThreshold = adminLocation?.freeDeliveryThreshold !== undefined ? adminLocation.freeDeliveryThreshold : 1999;

		if (adminLocation?.minOrderValue && subtotalRupees < adminLocation.minOrderValue) {
			return res.status(400).json({
				error: `Minimum order value for delivery to PIN ${cleanPincode} is ₹${adminLocation.minOrderValue}.`,
			});
		}

		if (subtotalRupees >= freeThreshold) {
			deliveryFeeInPaise = 0;
		} else if (adminLocation && adminLocation.deliveryFee !== undefined) {
			deliveryFeeInPaise = Math.round(adminLocation.deliveryFee * 100);
		} else if (srCheck?.minDeliveryFee > 0) {
			deliveryFeeInPaise = Math.round(srCheck.minDeliveryFee * 100);
		} else if (subtotalRupees < freeThreshold) {
			deliveryFeeInPaise = 5000; // Flat ₹50 shipping under free threshold
		} else {
			deliveryFeeInPaise = 0;
		}

		let totalAmountInPaise = itemsSubtotalInPaise + deliveryFeeInPaise;

		// Calculate coupons authoritatively
		let coupon = null;
		let discountAmountInPaise = 0;
		if (couponCode) {
			const couponEval = await evaluateCouponDiscount({
				code: couponCode,
				user: req.user,
				cartItems: products,
			});
			if (couponEval.isValid) {
				coupon = couponEval.coupon;
				discountAmountInPaise = Math.round(couponEval.discountAmount * 100);
				totalAmountInPaise = Math.max(0, itemsSubtotalInPaise - discountAmountInPaise) + deliveryFeeInPaise;
			} else {
				return res.status(400).json({ error: couponEval.message });
			}
		}

		// Razorpay minimum payment amount enforcement (100 paise = ₹1.00 INR)
		if (totalAmountInPaise < 100) {
			return res.status(400).json({
				error: "Total payable amount must be at least ₹1.00 (100 paise) to proceed with online checkout.",
			});
		}

		const snapshotAddress = {
			fullName: resolvedAddress.fullName || req.user.name,
			phone: resolvedAddress.phone || req.user.phone || "",
			houseFlat: resolvedAddress.houseFlat || "",
			street: resolvedAddress.street || "",
			landmark: resolvedAddress.landmark || "",
			locality: resolvedAddress.locality || "",
			city: resolvedAddress.city || adminLocation?.city || srCheck.city || "",
			district: resolvedAddress.district || adminLocation?.district || "",
			state: resolvedAddress.state || adminLocation?.state || srCheck.state || "",
			country: resolvedAddress.country || "India",
			pincode: cleanPincode,
			addressType: resolvedAddress.addressType || "Home",
			deliveryInstructions: resolvedAddress.deliveryInstructions || "",
		};

		// Clean up any stale uncompleted draft checkout attempts for this user
		await Order.deleteMany({
			user: req.user._id,
			paymentStatus: { $in: ["created", "pending", "failed"] },
			razorpayPaymentId: { $in: [null, ""] },
		});

		// Create internal pending order in database before initiating payment attempt
		const newOrder = new Order({
			user: req.user._id,
			products: verifiedProductsForOrder,
			totalAmount: totalAmountInPaise / 100, // saved in INR
			shippingAddress: snapshotAddress,
			deliveryFee: deliveryFeeInPaise / 100,
			estimatedDeliveryDays: adminLocation?.estimatedDeliveryDays || srCheck.estimatedDeliveryDays || "2-4 business days",
			courierName: srCheck.couriers?.[0]?.courierName || "",
			courierRate: srCheck.minDeliveryFee || 0,
			status: "pending",
			paymentStatus: "created",
			paymentMethod: "razorpay",
			couponCode: coupon ? coupon.code : "",
			discountAmount: discountAmountInPaise / 100,
		});

		await newOrder.save();

		// Razorpay receipt identifier must be <= 40 chars
		const receipt = `rcpt_${newOrder._id.toString().slice(-14)}_${Date.now().toString().slice(-4)}`;

		if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
			await Order.findByIdAndDelete(newOrder._id);
			return res.status(503).json({
				error: "Razorpay payment gateway credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured on the server.",
			});
		}

		let razorpayOrder;
		try {
			razorpayOrder = await razorpay.orders.create({
				amount: totalAmountInPaise,
				currency: "INR",
				receipt: receipt,
				payment_capture: 1, // Auto-capture payment upon successful authorization
				notes: {
					internalOrderId: newOrder._id.toString(),
					userId: req.user._id.toString(),
					couponCode: coupon?.code || "",
					store: "LuxeStore",
				},
			});
		} catch (rzpError) {
			console.error("Razorpay API order creation error:", rzpError.message || rzpError);
			await Order.findByIdAndDelete(newOrder._id);
			return res.status(502).json({
				error: "Payment gateway order creation failed. Please verify Razorpay credentials or gateway status.",
				details: rzpError.error?.description || rzpError.message,
			});
		}

		newOrder.razorpayOrderId = razorpayOrder.id;
		await newOrder.save();

		// Expose checkout details strictly needed by Razorpay Checkout modal
		return res.status(200).json({
			success: true,
			orderId: razorpayOrder.id,
			internalOrderId: newOrder._id,
			amount: razorpayOrder.amount, // in paise
			currency: razorpayOrder.currency,
			key: process.env.RAZORPAY_KEY_ID,
			customer: {
				name: snapshotAddress.fullName || req.user.name || "",
				email: req.user.email || "",
				contact: snapshotAddress.phone || req.user.phone || "",
			},
			notes: {
				internalOrderId: newOrder._id.toString(),
			},
		});
	} catch (error) {
		console.error("Error creating Razorpay order:", error);
		return res.status(500).json({
			error: "Error creating Razorpay order",
			message: error.message,
		});
	}
};

/**
 * POST /api/payments/verify
 * Validates HMAC-SHA256 signature, ensures order ownership, checks idempotency, and authoritatively fulfills order
 */
export const verifyRazorpayPayment = async (req, res) => {
	try {
		const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internalOrderId } = req.body;
		console.log("[PAYMENT_VERIFY] Incoming verification request:", {
			razorpay_order_id,
			razorpay_payment_id,
			internalOrderId,
			userId: req.user?._id,
		});

		// 1. Validate required payment fields
		if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
			return res.status(400).json({
				error: "Missing required payment fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
			});
		}

		// 2. Validate signature format
		if (typeof razorpay_signature !== "string" || !/^[0-9a-fA-F]{64}$/.test(razorpay_signature)) {
			return res.status(400).json({
				error: "Invalid signature format. Signature must be a 64-character hexadecimal string.",
			});
		}

		// 3. Timing-safe HMAC-SHA256 signature verification
		const keySecret = process.env.RAZORPAY_KEY_SECRET;
		if (!keySecret) {
			return res.status(500).json({ error: "Server configuration error: Key Secret not configured." });
		}

		const isSignatureValid = verifyRazorpaySignature(
			razorpay_order_id,
			razorpay_payment_id,
			razorpay_signature,
			keySecret
		);

		if (!isSignatureValid) {
			console.warn("[PAYMENT_VERIFY] Signature verification failed for payment:", razorpay_payment_id);
			return res.status(400).json({
				error: "Invalid payment signature. Verification failed.",
			});
		}

		// 4. Resolve internal order
		let order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
		if (!order && internalOrderId) {
			order = await Order.findById(internalOrderId);
			if (order && !order.razorpayOrderId) {
				order.razorpayOrderId = razorpay_order_id;
			}
		}

		if (!order) {
			return res.status(404).json({
				error: "Order not found for the specified Razorpay order ID.",
			});
		}

		// 5. Verify order ownership
		if (order.user.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				error: "Unauthorized: Payment does not match the authenticated user account.",
			});
		}

		// 6. Prevent payment ID reuse across different orders
		const duplicatePayment = await Order.findOne({
			razorpayPaymentId: razorpay_payment_id,
			_id: { $ne: order._id },
		});

		if (duplicatePayment) {
			return res.status(400).json({
				error: "This payment ID has already been credited to another order.",
			});
		}

		// 7. Idempotency: Return early if already paid
		if (order.paymentStatus === "paid" || order.paymentStatus === "captured") {
			return res.status(200).json({
				success: true,
				message: "Payment already verified and order fulfilled.",
				orderId: order._id,
			});
		}

		// 8. Authoritative payment verification against Razorpay API
		try {
			const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
			if (paymentDetails) {
				console.log("[PAYMENT_VERIFY] Razorpay payment status fetched:", {
					id: paymentDetails.id,
					status: paymentDetails.status,
					method: paymentDetails.method,
					amount: paymentDetails.amount,
				});

				const expectedPaise = Math.round(order.totalAmount * 100);
				if (paymentDetails.amount !== expectedPaise) {
					return res.status(400).json({
						error: `Payment amount mismatch: expected ₹${order.totalAmount}, gateway reported ₹${paymentDetails.amount / 100}.`,
					});
				}
				if (paymentDetails.currency !== "INR") {
					return res.status(400).json({
						error: `Payment currency mismatch: expected INR, gateway reported ${paymentDetails.currency}.`,
					});
				}
				if (paymentDetails.order_id && paymentDetails.order_id !== razorpay_order_id) {
					return res.status(400).json({
						error: "Payment order reference mismatch.",
					});
				}

				// If authorized, capture it immediately
				if (paymentDetails.status === "authorized") {
					try {
						await razorpay.payments.capture(razorpay_payment_id, expectedPaise, "INR");
						console.log(`[PAYMENT_VERIFY] Successfully captured authorized payment ${razorpay_payment_id}`);
					} catch (capErr) {
						console.warn("[PAYMENT_VERIFY] Payment capture warning:", capErr.message || capErr);
					}
				} else if (paymentDetails.status !== "captured") {
					return res.status(400).json({
						error: `Payment status is not captured or authorized (status: ${paymentDetails.status}).`,
					});
				}
			}
		} catch (apiErr) {
			console.warn("[PAYMENT_VERIFY] Razorpay API verification note:", apiErr.message || apiErr);
		}

		// 9. Update order to paid state
		order.razorpayPaymentId = razorpay_payment_id;
		order.razorpaySignature = razorpay_signature;
		order.paymentStatus = "paid";
		order.status = "confirmed";
		order.auditLog = order.auditLog || [];
		order.auditLog.push({
			action: "payment_verified",
			performedBy: "razorpay_gateway",
			performedAt: new Date(),
			details: {
				paymentId: razorpay_payment_id,
				orderId: razorpay_order_id,
				amount: order.totalAmount,
			},
		});
		await order.save();

		// 10. Deduct inventory stock
		await deductInventoryForOrder(order.products);

		// 11. Record coupon usage
		if (order.couponCode) {
			await recordCouponUsage(order.couponCode, req.user._id, order._id);
		}

		// 12. Clear user's cart in database
		await User.findByIdAndUpdate(req.user._id, { cartItems: [] });

		// 13. Send transactional notifications
		const customerUser = await User.findById(req.user._id);
		await sendOrderNotifications(
			order,
			customerUser,
			order.products,
			order.shippingAddress,
			order.couponCode
		);

		// 14. Reward customer with 10% coupon if order >= ₹5,000
		if (order.totalAmount >= 5000) {
			await createNewCoupon(req.user._id);
		}

		// 15. Attempt Shiprocket logistics shipment creation (side-effect isolated: preserves paid order)
		try {
			await createShiprocketOrder(order);
		} catch (srErr) {
			console.warn(`[Shiprocket Shipment] Order #${order._id} paid, shipment note: ${srErr.message}`);
		}

		return res.status(200).json({
			success: true,
			message: "Payment verified successfully, order confirmed, and inventory updated.",
			orderId: order._id,
		});
	} catch (error) {
		console.error("Error verifying Razorpay payment:", error);
		return res.status(500).json({
			error: "Error verifying payment",
			message: error.message,
		});
	}
};

/**
 * POST /api/payments/webhook
 * Handles asynchronous Razorpay webhook events idempotently with raw body signature verification
 */
export const handleRazorpayWebhook = async (req, res) => {
	try {
		const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
		if (!webhookSecret) {
			console.error("[WEBHOOK] Missing webhook secret configuration");
			return res.status(500).json({ error: "Webhook secret not configured on server." });
		}

		const signature = req.headers["x-razorpay-signature"];
		if (!signature) {
			return res.status(400).json({ error: "Missing x-razorpay-signature header." });
		}

		const rawBody = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body);
		const isSignatureValid = verifyWebhookHmacSignature(rawBody, signature, webhookSecret);

		if (!isSignatureValid) {
			console.warn("[WEBHOOK] Invalid webhook signature detected.");
			return res.status(400).json({ error: "Invalid webhook signature." });
		}

		const event = req.body;
		const eventType = event.event;
		const paymentEntity = event.payload?.payment?.entity;
		const razorpayOrderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
		const webhookEventId = event.event_id || `${eventType}_${paymentEntity?.id || Date.now()}`;

		if (!razorpayOrderId) {
			return res.status(200).json({ status: "acknowledged_no_order" });
		}

		const order = await Order.findOne({ razorpayOrderId });
		if (!order) {
			return res.status(200).json({ status: "acknowledged_order_not_found" });
		}

		// Idempotency: Ignore already processed webhook events
		const alreadyProcessed = order.webhookEvents?.some((e) => e.eventId === webhookEventId);
		if (alreadyProcessed) {
			return res.status(200).json({ status: "already_processed" });
		}

		// Handle payment events
		if (eventType === "payment.captured" || eventType === "order.paid") {
			if (order.paymentStatus !== "paid") {
				order.paymentStatus = "paid";
				order.status = "processing";
				if (paymentEntity?.id) {
					order.razorpayPaymentId = paymentEntity.id;
				}
				await order.save();

				await deductInventoryForOrder(order.products);
				if (order.couponCode) {
					await recordCouponUsage(order.couponCode, order.user, order._id);
				}
				await User.findByIdAndUpdate(order.user, { cartItems: [] });

				const customerUser = await User.findById(order.user);
				if (customerUser) {
					await sendOrderNotifications(
						order,
						customerUser,
						order.products,
						order.shippingAddress,
						order.couponCode
					);
				}

				// Create Shiprocket shipment
				try {
					await createShiprocketOrder(order);
				} catch (srErr) {
					console.warn(`[Shiprocket Shipment] Webhook order #${order._id} paid, shipment note: ${srErr.message}`);
				}
			}
		} else if (eventType === "payment.failed") {
			if (order.paymentStatus === "pending" || order.paymentStatus === "created") {
				order.paymentStatus = "failed";
				await order.save();
			}
		} else if (eventType === "refund.processed" || eventType === "refund.created") {
			const refundEntity = event.payload?.refund?.entity;
			order.paymentStatus = "refunded";
			order.refund = order.refund || {};
			order.refund.refundId = refundEntity?.id || order.refund.refundId || `rfnd_${Date.now()}`;
			order.refund.amount = refundEntity?.amount ? refundEntity.amount / 100 : order.totalAmount;
			order.refund.status = "processed";
			order.refund.refundedAt = new Date();
			await order.save();
		} else if (eventType === "refund.failed") {
			const refundEntity = event.payload?.refund?.entity;
			order.refund = order.refund || {};
			order.refund.status = "failed";
			order.refund.failureReason = refundEntity?.error_description || "Gateway reported refund failure";
			await order.save();
		}

		// Record event in order audit history
		order.webhookEvents = order.webhookEvents || [];
		order.webhookEvents.push({
			eventId: webhookEventId,
			eventType,
			processedAt: new Date(),
		});
		await order.save();

		return res.status(200).json({ status: "ok" });
	} catch (err) {
		console.error("[WEBHOOK] Processing error:", err.message);
		return res.status(500).json({ error: "Webhook processing error", message: err.message });
	}
};

/**
 * GET /api/payments/razorpay-key or /api/payments/config
 * Exposes the public Razorpay Key ID to the frontend safely
 */
export const getRazorpayConfig = async (req, res) => {
	try {
		return res.status(200).json({
			keyId: process.env.RAZORPAY_KEY_ID || "",
			currency: "INR",
		});
	} catch (err) {
		return res.status(500).json({ error: "Unable to retrieve payment configuration." });
	}
};
