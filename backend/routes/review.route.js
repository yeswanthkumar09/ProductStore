import express from "express";
import {
	getProductReviews,
	checkReviewEligibility,
	createReview,
	updateReview,
	deleteReview,
	getAllReviewsAdmin,
	updateReviewAdmin,
} from "../controllers/review.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router({ mergeParams: true });

// Product reviews (nested at /api/products/:productId/reviews)
router.get("/", getProductReviews);
router.get("/eligibility", protectRoute, checkReviewEligibility);
router.post("/", protectRoute, createReview);
router.put("/:reviewId", protectRoute, updateReview);
router.delete("/:reviewId", protectRoute, deleteReview);

// Admin review management (mounted at /api/reviews)
router.get("/admin/all", protectRoute, adminRoute, getAllReviewsAdmin);
router.put("/admin/:reviewId", protectRoute, adminRoute, updateReviewAdmin);
router.delete("/admin/:reviewId", protectRoute, adminRoute, deleteReview);

export default router;
