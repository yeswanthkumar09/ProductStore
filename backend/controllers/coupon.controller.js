import mongoose from "mongoose";
import Coupon from "../models/coupon.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";

// Customer: Get primary active coupon
export const getCoupon = async (req, res) => {
	try {
		const query = {
			isActive: true,
			expirationDate: { $gte: new Date() },
		};

		if (req.user?._id) {
			query.$or = [{ userId: req.user._id }, { userId: null }];
		} else {
			query.userId = null;
		}

		const coupon = await Coupon.findOne(query).sort({ createdAt: -1 });
		res.json(coupon || null);
	} catch (error) {
		console.log("Error in getCoupon controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Customer: Get all available active store coupons for checkout picker
export const getAvailableStoreCoupons = async (req, res) => {
	try {
		const now = new Date();
		const query = {
			isActive: true,
			expirationDate: { $gte: now },
			$or: [{ userId: null }],
		};

		if (req.user?._id) {
			query.$or.push({ userId: req.user._id });
		}

		const coupons = await Coupon.find(query)
			.select("code name description discountType discountPercentage discountValue minOrderAmount maxDiscountCap scope eligibleCategories expirationDate")
			.sort({ createdAt: -1 });

		res.json(coupons);
	} catch (error) {
		console.error("Error in getAvailableStoreCoupons controller:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export async function evaluateCouponDiscount({ code, user, cartItems = [] }) {
	if (!code) {
		return { isValid: false, statusCode: 400, message: "Coupon code is required" };
	}

	const cleanCode = code.trim().toUpperCase();
	const coupon = await Coupon.findOne({ code: cleanCode });

	if (!coupon) {
		return { isValid: false, statusCode: 404, message: "Invalid coupon code" };
	}

	if (!coupon.isActive) {
		return { isValid: false, statusCode: 400, message: "This coupon is no longer active" };
	}

	const now = new Date();
	if (coupon.startDate && new Date(coupon.startDate) > now) {
		return { isValid: false, statusCode: 400, message: "This coupon campaign has not started yet" };
	}

	if (new Date(coupon.expirationDate) < now) {
		coupon.isActive = false;
		await coupon.save();
		return { isValid: false, statusCode: 400, message: "Coupon has expired" };
	}

	// Check if user-restricted coupon
	if (coupon.userId) {
		if (!user || coupon.userId.toString() !== user._id?.toString()) {
			return { isValid: false, statusCode: 403, message: "This coupon is exclusively assigned to another account" };
		}
	}

	// Check overall usage limit
	if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
		return { isValid: false, statusCode: 400, message: "Coupon usage limit has been reached" };
	}

	// Check per-user limit
	if (coupon.perUserLimit && user?._id && Array.isArray(coupon.usedBy)) {
		const userUses = coupon.usedBy.filter(
			(u) => u.user?.toString() === user._id.toString()
		).length;
		if (userUses >= coupon.perUserLimit) {
			return {
				isValid: false,
				statusCode: 400,
				message: `You have already redeemed this coupon the maximum allowed times (${coupon.perUserLimit})`,
			};
		}
	}

	// Check first order eligibility
	if (coupon.isFirstOrderOnly && user?._id) {
		const previousOrders = await Order.countDocuments({ user: user._id });
		if (previousOrders > 0) {
			return { isValid: false, statusCode: 400, message: "This coupon is only valid for your first order" };
		}
	}

	// Calculate eligible subtotal by verifying products against the database
	let eligibleSubtotal = 0;
	const APPAREL_CATEGORIES = new Set([
		"apparel",
		"clothing",
		"shirts",
		"t-shirts",
		"tshirts",
		"trousers",
		"jeans",
		"jackets",
		"overshirts",
		"suits",
		"hoodies",
		"sweaters",
		"vests",
		"cargo pants",
		"joggers",
		"shorts",
		"outerwear",
	]);

	const matchesCategory = (prodCategory, eligibleList = []) => {
		if (!prodCategory || !Array.isArray(eligibleList) || eligibleList.length === 0) return false;
		const normProd = prodCategory.toLowerCase().trim();
		const normEligible = eligibleList.map((c) => c.toLowerCase().trim());
		if (normEligible.includes(normProd)) return true;
		const isApparelCoupon = normEligible.some((c) => APPAREL_CATEGORIES.has(c));
		if (isApparelCoupon && APPAREL_CATEGORIES.has(normProd)) return true;
		return false;
	};

	let effectiveCartItems = Array.isArray(cartItems) && cartItems.length > 0 ? cartItems : [];
	if (effectiveCartItems.length === 0 && user?.cartItems && user.cartItems.length > 0) {
		effectiveCartItems = user.cartItems.map((ci) => ({
			productId: ci.product?.toString(),
			variantId: ci.variantId?.toString(),
			quantity: ci.quantity || 1,
		}));
	}

	if (effectiveCartItems.length > 0) {
		const rawIds = effectiveCartItems
			.map((i) => i.productId || i.product?._id || i.product || i._id)
			.filter((id) => id && mongoose.Types.ObjectId.isValid(id.toString()))
			.map((id) => id.toString());

		const variantIds = effectiveCartItems
			.map((i) => i.variantId)
			.filter((id) => id && mongoose.Types.ObjectId.isValid(id.toString()))
			.map((id) => id.toString());

		const allQueryIds = Array.from(new Set([...rawIds, ...variantIds]));

		const dbProducts = await Product.find({
			$or: [{ _id: { $in: allQueryIds } }, { "variants._id": { $in: allQueryIds } }],
		});

		const productMap = new Map();
		dbProducts.forEach((p) => {
			productMap.set(p._id.toString(), p);
			if (Array.isArray(p.variants)) {
				p.variants.forEach((v) => {
					if (v._id) productMap.set(v._id.toString(), p);
				});
			}
		});

		for (const item of effectiveCartItems) {
			const pid = (item.productId || item.product?._id || item.product || item._id)?.toString();
			const vId = item.variantId?.toString();
			const dbProd = productMap.get(pid) || (vId ? productMap.get(vId) : null);
			if (!dbProd) continue;

			// Check exclusions
			const isExcluded = coupon.excludedProducts?.some(
				(exId) => exId.toString() === dbProd._id.toString()
			);
			if (isExcluded) continue;

			let isEligible = false;
			if (coupon.scope === "storewide" || !coupon.scope) {
				isEligible = true;
			} else if (coupon.scope === "category") {
				isEligible = matchesCategory(dbProd.category, coupon.eligibleCategories);
			} else if (coupon.scope === "product") {
				isEligible = coupon.eligibleProducts?.some(
					(pId) => pId.toString() === dbProd._id.toString()
				);
			}

			if (isEligible) {
				const qty = Math.max(1, Math.min(10, parseInt(item.quantity, 10) || 1));
				let itemPrice = dbProd.price;
				const effectiveVariantId = vId || (pid !== dbProd._id.toString() ? pid : null);
				if (effectiveVariantId && Array.isArray(dbProd.variants)) {
					const v =
						dbProd.variants.id(effectiveVariantId) ||
						dbProd.variants.find((x) => x._id.toString() === effectiveVariantId);
					if (v && v.price) itemPrice = v.price;
				}
				eligibleSubtotal += itemPrice * qty;
			}
		}
	}

	// Provide clear, actionable feedback if no items in cart match the coupon's category/product scope
	if (eligibleSubtotal === 0 && effectiveCartItems.length > 0) {
		if (coupon.scope === "category") {
			const categoriesStr = (coupon.eligibleCategories || []).join(", ") || "specific apparel";
			return {
				isValid: false,
				statusCode: 400,
				message: `Coupon "${coupon.code}" applies exclusively to ${categoriesStr}. Your cart does not contain qualifying items.`,
			};
		} else if (coupon.scope === "product") {
			return {
				isValid: false,
				statusCode: 400,
				message: `Coupon "${coupon.code}" applies exclusively to specific promotional items not currently in your cart.`,
			};
		}
	}

	// Validate minimum order requirement
	if (coupon.minOrderAmount && eligibleSubtotal < coupon.minOrderAmount) {
		const scopeNotice =
			coupon.scope === "category"
				? ` in ${coupon.eligibleCategories?.join(", ") || "qualifying items"}`
				: "";
		return {
			isValid: false,
			statusCode: 400,
			message: `Minimum eligible purchase of ₹${coupon.minOrderAmount.toLocaleString(
				"en-IN"
			)}${scopeNotice} required for this coupon (Current qualifying total: ₹${Math.round(
				eligibleSubtotal
			).toLocaleString("en-IN")})`,
		};
	}

	// Calculate discount amount
	let discountAmount = 0;
	const discountVal = coupon.discountValue || coupon.discountPercentage || 0;
	if (coupon.discountType === "fixed") {
		discountAmount = Math.min(discountVal, eligibleSubtotal);
	} else {
		// Percentage discount
		discountAmount = (eligibleSubtotal * discountVal) / 100;
		if (coupon.maxDiscountCap && coupon.maxDiscountCap > 0) {
			discountAmount = Math.min(discountAmount, coupon.maxDiscountCap);
		}
	}
	discountAmount = Math.round(discountAmount);

	return {
		isValid: true,
		coupon,
		discountValue: discountVal,
		discountPercentage: coupon.discountPercentage || discountVal,
		discountAmount,
		eligibleSubtotal: Math.round(eligibleSubtotal),
	};
}

export const validateCoupon = async (req, res) => {
	try {
		const { code, cartItems = [] } = req.body;
		const result = await evaluateCouponDiscount({
			code,
			user: req.user,
			cartItems,
		});

		if (!result.isValid) {
			return res.status(result.statusCode || 400).json({ message: result.message });
		}

		res.json({
			message: `Coupon "${result.coupon.code}" applied successfully!`,
			code: result.coupon.code,
			name: result.coupon.name || result.coupon.code,
			discountType: result.coupon.discountType || "percentage",
			discountValue: result.discountValue,
			discountPercentage: result.discountPercentage,
			discountAmount: result.discountAmount,
			maxDiscountCap: result.coupon.maxDiscountCap || null,
			minOrderAmount: result.coupon.minOrderAmount || 0,
			eligibleSubtotal: result.eligibleSubtotal,
			scope: result.coupon.scope,
		});
	} catch (error) {
		console.log("Error in validateCoupon controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// ================= ADMIN CONTROLLERS =================

// Get all coupons for Admin Panel
export const getAllCouponsAdmin = async (req, res) => {
	try {
		const coupons = await Coupon.find().sort({ createdAt: -1 });
		res.json(coupons);
	} catch (error) {
		console.error("Error in getAllCouponsAdmin:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Create a new Coupon (Admin)
export const createCouponAdmin = async (req, res) => {
	try {
		const {
			code,
			name,
			description,
			discountType = "percentage",
			discountValue,
			maxDiscountCap,
			minOrderAmount = 0,
			startDate,
			expirationDate,
			maxUses,
			perUserLimit = 1,
			scope = "storewide",
			eligibleCategories = [],
			isFirstOrderOnly = false,
			isActive = true,
		} = req.body;

		if (!code || !discountValue || !expirationDate) {
			return res.status(400).json({ message: "Code, discount value, and expiry date are required" });
		}

		const cleanCode = code.trim().toUpperCase();
		const existing = await Coupon.findOne({ code: cleanCode });
		if (existing) {
			return res.status(400).json({ message: `Coupon with code "${cleanCode}" already exists` });
		}

		const coupon = new Coupon({
			code: cleanCode,
			name: name || cleanCode,
			description: description || "",
			discountType,
			discountValue: Number(discountValue),
			discountPercentage: discountType === "percentage" ? Number(discountValue) : 10,
			maxDiscountCap: maxDiscountCap ? Number(maxDiscountCap) : null,
			minOrderAmount: Number(minOrderAmount) || 0,
			startDate: startDate ? new Date(startDate) : new Date(),
			expirationDate: new Date(expirationDate),
			maxUses: maxUses ? Number(maxUses) : null,
			perUserLimit: Number(perUserLimit) || 1,
			scope,
			eligibleCategories: Array.isArray(eligibleCategories) ? eligibleCategories : [],
			isFirstOrderOnly: Boolean(isFirstOrderOnly),
			isActive: Boolean(isActive),
		});

		await coupon.save();
		res.status(201).json(coupon);
	} catch (error) {
		console.error("Error in createCouponAdmin:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Update an existing coupon (Admin)
export const updateCouponAdmin = async (req, res) => {
	try {
		const { id } = req.params;
		const updates = req.body;

		if (updates.code) {
			updates.code = updates.code.trim().toUpperCase();
		}

		const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true });
		if (!coupon) {
			return res.status(404).json({ message: "Coupon not found" });
		}

		res.json(coupon);
	} catch (error) {
		console.error("Error in updateCouponAdmin:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Delete a coupon (Admin)
export const deleteCouponAdmin = async (req, res) => {
	try {
		const { id } = req.params;
		const coupon = await Coupon.findByIdAndDelete(id);
		if (!coupon) {
			return res.status(404).json({ message: "Coupon not found" });
		}
		res.json({ success: true, message: "Coupon deleted successfully" });
	} catch (error) {
		console.error("Error in deleteCouponAdmin:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
