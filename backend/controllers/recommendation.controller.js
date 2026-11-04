import BrowsingHistory from "../models/browsingHistory.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

// Record viewing of a product
export const trackProductView = async (req, res) => {
	try {
		const { productId } = req.body;
		if (!productId) return res.status(400).json({ message: "Product ID is required" });

		const product = await Product.findById(productId);
		if (!product) return res.status(404).json({ message: "Product not found" });

		// If user is authenticated
		if (req.user) {
			let history = await BrowsingHistory.findOne({ user: req.user._id });
			if (!history) {
				history = new BrowsingHistory({ user: req.user._id, items: [] });
			}

			const existingIndex = history.items.findIndex(
				(item) => item.product.toString() === productId.toString()
			);

			if (existingIndex > -1) {
				history.items[existingIndex].viewCount += 1;
				history.items[existingIndex].viewedAt = new Date();
			} else {
				history.items.push({
					product: productId,
					category: product.category,
					brand: product.brand || "",
					viewedAt: new Date(),
					viewCount: 1,
				});
			}

			// Keep last 50 entries
			if (history.items.length > 50) {
				history.items = history.items.slice(-50);
			}

			await history.save();
		}

		res.json({ success: true, message: "View tracked" });
	} catch (error) {
		console.error("Error in trackProductView:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Sync guest browsing history after login
export const syncGuestHistory = async (req, res) => {
	try {
		const { productIds } = req.body;
		if (!Array.isArray(productIds) || productIds.length === 0 || !req.user) {
			return res.json({ success: true });
		}

		let history = await BrowsingHistory.findOne({ user: req.user._id });
		if (!history) {
			history = new BrowsingHistory({ user: req.user._id, items: [] });
		}

		const products = await Product.find({ _id: { $in: productIds } });
		for (const p of products) {
			const existing = history.items.find((i) => i.product.toString() === p._id.toString());
			if (existing) {
				existing.viewCount += 1;
				existing.viewedAt = new Date();
			} else {
				history.items.push({
					product: p._id,
					category: p.category,
					brand: p.brand || "",
					viewedAt: new Date(),
					viewCount: 1,
				});
			}
		}

		await history.save();
		res.json({ success: true, message: "Guest history synced" });
	} catch (error) {
		console.error("Error in syncGuestHistory:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Get user browsing history
export const getBrowsingHistory = async (req, res) => {
	try {
		if (!req.user) return res.json({ items: [] });

		const history = await BrowsingHistory.findOne({ user: req.user._id }).populate({
			path: "items.product",
			select: "name price originalPrice image images category brand rating numReviews stock variants slug",
		});

		if (!history) return res.json({ items: [] });

		// Filter out deleted products, deduplicate strictly by product ID, and sort by viewedAt desc
		const seenProductIds = new Set();
		const deduplicatedItems = [];
		for (const item of history.items) {
			if (!item.product) continue;
			const pId = item.product._id ? item.product._id.toString() : item.product.toString();
			if (!seenProductIds.has(pId)) {
				seenProductIds.add(pId);
				deduplicatedItems.push(item);
			}
		}

		deduplicatedItems.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));
		res.json({ items: deduplicatedItems.slice(0, 50) });
	} catch (error) {
		console.error("Error in getBrowsingHistory:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Remove single item from browsing history
export const deleteBrowsingHistoryItem = async (req, res) => {
	try {
		const { productId } = req.params;
		if (!req.user) return res.json({ success: true });
		await BrowsingHistory.findOneAndUpdate(
			{ user: req.user._id },
			{ $pull: { items: { product: productId } } }
		);
		res.json({ success: true, message: "Item removed from recently viewed" });
	} catch (error) {
		console.error("Error in deleteBrowsingHistoryItem:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Clear browsing history
export const clearBrowsingHistory = async (req, res) => {
	try {
		if (!req.user) return res.json({ success: true });
		await BrowsingHistory.findOneAndUpdate({ user: req.user._id }, { items: [] });
		res.json({ success: true, message: "Browsing history cleared" });
	} catch (error) {
		console.error("Error in clearBrowsingHistory:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Get personalized recommendations
export const getPersonalizedRecommendations = async (req, res) => {
	try {
		const userId = req.user?._id;
		let recommendedProducts = [];

		if (userId) {
			const history = await BrowsingHistory.findOne({ user: userId });
			if (history && history.items.length > 0) {
				// Calculate category frequency
				const categoryCounts = {};
				const brandCounts = {};
				const viewedProductIds = new Set();

				history.items.forEach((item) => {
					viewedProductIds.add(item.product.toString());
					if (item.category) {
						categoryCounts[item.category] = (categoryCounts[item.category] || 0) + item.viewCount;
					}
					if (item.brand) {
						brandCounts[item.brand] = (brandCounts[item.brand] || 0) + item.viewCount;
					}
				});

				// Top 2 categories
				const topCategories = Object.entries(categoryCounts)
					.sort((a, b) => b[1] - a[1])
					.map(([cat]) => cat)
					.slice(0, 2);

				// Find products in top categories
				recommendedProducts = await Product.find({
					category: { $in: topCategories },
					status: { $ne: "archived" },
				})
					.sort({ rating: -1, isFeatured: -1 })
					.limit(8);
			}
		}

		// Fallback: If no history or fewer than 4 recommendations, add top-rated/featured products
		if (recommendedProducts.length < 4) {
			const existingIds = recommendedProducts.map((p) => p._id);
			const fallbacks = await Product.find({
				_id: { $nin: existingIds },
				status: { $ne: "archived" },
			})
				.sort({ isFeatured: -1, rating: -1 })
				.limit(8 - recommendedProducts.length);

			recommendedProducts = [...recommendedProducts, ...fallbacks];
		}

		res.json(recommendedProducts);
	} catch (error) {
		console.error("Error in getPersonalizedRecommendations:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
