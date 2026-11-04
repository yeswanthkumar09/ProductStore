import mongoose from "mongoose";
import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
	try {
		const rawProductIds = (req.user.cartItems || [])
			.map((item) => item.product)
			.filter((id) => id && mongoose.Types.ObjectId.isValid(id));

		const products = await Product.find({
			$or: [
				{ _id: { $in: rawProductIds } },
				{ "variants._id": { $in: rawProductIds } },
			],
		});

		const cartMap = new Map();
		products.forEach((p) => {
			cartMap.set(p._id.toString(), p);
			if (Array.isArray(p.variants)) {
				p.variants.forEach((v) => {
					if (v._id) cartMap.set(v._id.toString(), p);
				});
			}
		});

		const cartItems = [];
		let hasDirtyQuantity = false;
		for (const cartItem of req.user.cartItems || []) {
			if (!cartItem.product) continue;
			const rawKey = cartItem.product.toString();
			const product = cartMap.get(rawKey);

			// If product has been deleted or archived from DB, show clear unavailable item
			if (!product) {
				cartItems.push({
					_id: rawKey,
					productId: rawKey,
					cartItemId: cartItem._id?.toString() || rawKey,
					name: "Archived Garment",
					price: 0,
					quantity: cartItem.quantity || 1,
					image: "/placeholder.png",
					isAvailable: false,
					isDeleted: true,
					unavailableReason: "This item is no longer available in the catalogue.",
				});
				continue;
			}

			// If variant is selected, find the authoritative variant
			let variant = null;
			const targetVariantId = cartItem.variantId || (rawKey !== product._id.toString() ? rawKey : null);
			if (targetVariantId && Array.isArray(product.variants)) {
				variant =
					product.variants.id(targetVariantId) ||
					product.variants.find((v) => v._id.toString() === targetVariantId);
			}

			// Authoritative price and image from variant (or product fallback)
			const price = variant ? variant.price : product.price;
			const originalPrice = variant ? variant.originalPrice : product.originalPrice;
			const image = variant?.images?.[0] || product.image;
			const stock = variant ? variant.stock : product.stock;
			const sku = variant?.sku || cartItem.sku || product.sku;

			// Self-heal and clamp corrupted/runaway quantities
			const maxAllowed = stock > 0 ? Math.min(stock, 10) : 10;
			const currentQty = parseInt(cartItem.quantity, 10);
			if (isNaN(currentQty) || currentQty < 1 || currentQty > maxAllowed) {
				cartItem.quantity = Math.max(1, Math.min(isNaN(currentQty) ? 1 : currentQty, maxAllowed));
				hasDirtyQuantity = true;
			}

			cartItems.push({
				...product.toJSON(),
				_id: product._id.toString(),
				productId: product._id.toString(),
				cartItemId: cartItem._id?.toString() || `${product._id}-${cartItem.variantId || "base"}`,
				variantId: cartItem.variantId || null,
				selectedColor: cartItem.selectedColor || variant?.color?.name || null,
				selectedSize: cartItem.selectedSize || variant?.size || null,
				sku,
				price,
				originalPrice,
				stock,
				image,
				quantity: cartItem.quantity,
				isAvailable: stock > 0,
			});
		}

		if (hasDirtyQuantity) {
			req.user.markModified("cartItems");
			await req.user.save();
		}

		res.json(cartItems);
	} catch (error) {
		console.log("Error in getCartProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const addToCart = async (req, res) => {
	try {
		const { productId, variantId, selectedColor, selectedSize, quantity = 1 } = req.body;
		const user = req.user;

		if (!productId) {
			return res.status(400).json({ message: "Product ID is required" });
		}

		const parsedQty = Math.max(1, Math.min(10, parseInt(quantity, 10) || 1));

		let product = null;
		if (mongoose.Types.ObjectId.isValid(productId)) {
			product = await Product.findById(productId);
			if (!product) {
				// Check if productId passed was actually a variantId
				const productWithVariant = await Product.findOne({ "variants._id": productId });
				if (productWithVariant) {
					product = productWithVariant;
				}
			}
		}

		if (!product) return res.status(404).json({ message: "Product not found" });

		// Verify variant if passed
		let variant = null;
		let effectiveVariantId = variantId;
		if (effectiveVariantId && Array.isArray(product.variants)) {
			variant =
				product.variants.id(effectiveVariantId) ||
				product.variants.find((v) => v._id.toString() === effectiveVariantId);
		}

		const availableStock = variant ? variant.stock : product.stock;
		const maxAllowed = Math.min(availableStock > 0 ? availableStock : 10, 10);

		if (availableStock <= 0) {
			return res.status(400).json({
				message: `This item is currently out of stock.`,
			});
		}

		// Check if same product + variant already exists in user's cart
		const targetProductId = product._id.toString();
		const existingItem = user.cartItems.find(
			(item) =>
				item.product?.toString() === targetProductId &&
				(item.variantId || "") === (effectiveVariantId || "")
		);

		if (existingItem) {
			if (existingItem.quantity >= maxAllowed) {
				return res.status(400).json({
					message: `Maximum allowable quantity (${maxAllowed}) reached for this item.`,
				});
			}
			existingItem.quantity = Math.min(existingItem.quantity + parsedQty, maxAllowed);
		} else {
			user.cartItems.push({
				product: product._id,
				variantId: effectiveVariantId || "",
				selectedColor: selectedColor || variant?.color?.name || "",
				selectedSize: selectedSize || variant?.size || "",
				sku: variant?.sku || product.sku || "",
				quantity: Math.min(parsedQty, maxAllowed),
			});
		}

		await user.save();
		return getCartProducts(req, res);
	} catch (error) {
		console.log("Error in addToCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeAllFromCart = async (req, res) => {
	try {
		const { productId, cartItemId, variantId } = req.body;
		const user = req.user;

		if (!productId && !cartItemId) {
			user.cartItems = [];
		} else if (cartItemId) {
			user.cartItems = user.cartItems.filter(
				(item) =>
					item._id?.toString() !== cartItemId &&
					item.product?.toString() !== cartItemId
			);
		} else {
			user.cartItems = user.cartItems.filter(
				(item) =>
					!(item.product?.toString() === productId && (!variantId || item.variantId === variantId))
			);
		}

		await user.save();
		return getCartProducts(req, res);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateQuantity = async (req, res) => {
	try {
		const { id: itemId } = req.params;
		const { quantity, variantId } = req.body;
		const user = req.user;

		const existingItem = user.cartItems.find(
			(item) =>
				item._id?.toString() === itemId ||
				(item.product?.toString() === itemId && (!variantId || item.variantId === variantId))
		);

		if (existingItem) {
			const targetQty = parseInt(quantity, 10);
			if (isNaN(targetQty) || targetQty <= 0) {
				user.cartItems = user.cartItems.filter((item) => item !== existingItem);
				await user.save();
				return getCartProducts(req, res);
			}

			// Look up authoritative stock
			const product = await Product.findById(existingItem.product);
			let stock = 10;
			if (product) {
				if (existingItem.variantId && Array.isArray(product.variants)) {
					const v =
						product.variants.id(existingItem.variantId) ||
						product.variants.find((x) => x._id.toString() === existingItem.variantId);
					if (v) stock = v.stock;
				} else {
					stock = product.stock;
				}
			}

			const maxAllowed = Math.min(stock > 0 ? stock : 10, 10);
			existingItem.quantity = Math.min(Math.max(1, targetQty), maxAllowed);
			await user.save();
			return getCartProducts(req, res);
		} else {
			res.status(404).json({ message: "Item not found in cart" });
		}
	} catch (error) {
		console.log("Error in updateQuantity controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
