import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";

// Customer & Public: Get reviews for a specific product
export const getProductReviews = async (req, res) => {
	try {
		const reviews = await Review.find({ product: req.params.productId })
			.populate("user", "name email")
			.sort({ createdAt: -1 });
		res.json(reviews);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Customer: Check review eligibility for a product
export const checkReviewEligibility = async (req, res) => {
	try {
		const { productId } = req.params;
		const userId = req.user._id;

		// 1. Check if already reviewed
		const existingReview = await Review.findOne({ product: productId, user: userId });
		if (existingReview) {
			return res.json({
				eligible: true,
				alreadyReviewed: true,
				existingReview,
				message: "You have reviewed this piece. You may update your feedback anytime.",
			});
		}

		// 2. Check if product exists
		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({ eligible: false, message: "Product not found." });
		}

		// 3. Find verified purchase in paid orders
		const verifiedOrder = await Order.findOne({
			user: userId,
			$or: [
				{ "products.product": productId },
				{ "products.variantId": productId },
				{ "products.name": new RegExp(`^${product.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
			],
			paymentStatus: { $in: ["paid", "captured"] },
			status: { $nin: ["cancelled", "refunded"] },
		});

		if (!verifiedOrder) {
			return res.json({
				eligible: false,
				alreadyReviewed: false,
				message: "Only patrons who have purchased this garment from our store can submit a verified review.",
			});
		}

		res.json({
			eligible: true,
			alreadyReviewed: false,
			orderId: verifiedOrder._id,
			message: "Verified Buyer. You are eligible to share feedback.",
		});
	} catch (error) {
		console.error("Error in checkReviewEligibility:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Customer: Create a genuine product review (strictly requires verified purchase)
export const createReview = async (req, res) => {
	try {
		const { rating, comment, title = "", images = [] } = req.body;
		const productId = req.params.productId;

		if (!rating || !comment || !comment.trim()) {
			return res.status(400).json({ message: "Rating and review comment are required." });
		}

		const numRating = Number(rating);
		if (isNaN(numRating) || numRating < 1 || numRating > 5) {
			return res.status(400).json({ message: "Rating must be an integer between 1 and 5." });
		}

		if (comment.trim().length < 5) {
			return res.status(400).json({ message: "Review comment must be at least 5 characters long." });
		}

		const product = await Product.findById(productId);
		if (!product) return res.status(404).json({ message: "Product not found." });

		// Verify whether customer actually purchased this product in a completed/paid order
		const verifiedOrder = await Order.findOne({
			user: req.user._id,
			$or: [
				{ "products.product": productId },
				{ "products.variantId": productId },
				{ "products.name": new RegExp(`^${product.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
			],
			paymentStatus: { $in: ["paid", "captured"] },
			status: { $nin: ["cancelled", "refunded"] },
		});

		if (!verifiedOrder) {
			return res.status(403).json({
				message: "Only patrons who have purchased and received this garment can submit a verified review.",
			});
		}

		// Prevent duplicate reviews; offer update if already exists
		const existing = await Review.findOne({ product: productId, user: req.user._id });
		if (existing) {
			existing.rating = numRating;
			existing.comment = comment.trim();
			existing.title = (title || "").trim();
			if (Array.isArray(images)) {
				existing.images = images.filter((img) => typeof img === "string" && img.trim());
			}
			existing.isVerifiedPurchase = true;
			await existing.save();
			await recalculateProductRating(productId);
			return res.json({ ...existing.toObject(), message: "Review updated successfully." });
		}

		const review = await Review.create({
			product: productId,
			user: req.user._id,
			name: req.user.name,
			rating: numRating,
			comment: comment.trim(),
			title: (title || "").trim(),
			images: Array.isArray(images) ? images.filter((img) => typeof img === "string" && img.trim()) : [],
			isVerifiedPurchase: true,
		});

		// Authoritatively recalculate dynamic product rating & review count
		await recalculateProductRating(productId);

		res.status(201).json(review);
	} catch (error) {
		console.error("Error in createReview:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Customer: Update own review
export const updateReview = async (req, res) => {
	try {
		const { reviewId } = req.params;
		const { rating, comment, title, images } = req.body;

		const review = await Review.findById(reviewId);
		if (!review) return res.status(404).json({ message: "Review not found." });

		if (review.user.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "You can only update your own review." });
		}

		if (rating !== undefined) {
			const numRating = Number(rating);
			if (isNaN(numRating) || numRating < 1 || numRating > 5) {
				return res.status(400).json({ message: "Rating must be between 1 and 5." });
			}
			review.rating = numRating;
		}

		if (comment !== undefined) {
			if (comment.trim().length < 5) {
				return res.status(400).json({ message: "Review comment must be at least 5 characters long." });
			}
			review.comment = comment.trim();
		}

		if (title !== undefined) {
			review.title = title.trim();
		}

		if (Array.isArray(images)) {
			review.images = images.filter((img) => typeof img === "string" && img.trim());
		}

		await review.save();
		await recalculateProductRating(review.product);

		res.json(review);
	} catch (error) {
		console.error("Error in updateReview:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Customer / Admin: Delete a review
export const deleteReview = async (req, res) => {
	try {
		const review = await Review.findById(req.params.reviewId);
		if (!review) return res.status(404).json({ message: "Review not found." });

		// Only review owner or admin can delete
		if (review.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
			return res.status(403).json({ message: "Not authorized to delete this review." });
		}

		const productId = review.product;
		await review.deleteOne();

		// Recalculate dynamic product rating
		await recalculateProductRating(productId);

		res.json({ message: "Review deleted successfully." });
	} catch (error) {
		console.error("Error in deleteReview:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Get all customer reviews across all products
export const getAllReviewsAdmin = async (req, res) => {
	try {
		const reviews = await Review.find({})
			.populate("product", "name image price")
			.populate("user", "name email")
			.sort({ createdAt: -1 });
		res.json(reviews);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Edit any customer review
export const updateReviewAdmin = async (req, res) => {
	try {
		const { rating, comment } = req.body;
		const review = await Review.findById(req.params.reviewId);
		if (!review) return res.status(404).json({ message: "Review not found." });

		if (rating !== undefined) review.rating = Number(rating);
		if (comment !== undefined) review.comment = comment.trim();

		await review.save();

		// Recalculate dynamic product rating
		await recalculateProductRating(review.product);

		const updated = await Review.findById(req.params.reviewId)
			.populate("product", "name image price")
			.populate("user", "name email");

		res.json(updated);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Helper to keep product rating completely dynamic from persisted records
async function recalculateProductRating(productId) {
	try {
		const product = await Product.findById(productId);
		if (product) {
			const allReviews = await Review.find({ product: productId });
			product.numReviews = allReviews.length;
			product.rating =
				allReviews.length > 0
					? Number((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1))
					: 0;
			await product.save();
		}
	} catch (err) {
		console.error("Error recalculating product rating:", err);
	}
}
