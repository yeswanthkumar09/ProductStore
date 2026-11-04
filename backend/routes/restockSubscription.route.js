import express from "express";
import {
	subscribeRestock,
	getMySubscriptions,
	cancelSubscription,
	getAdminSubscriptions,
	retryNotificationAdmin,
} from "../controllers/restockSubscription.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Optional user attachment for guest vs authenticated
const optionalAuth = (req, res, next) => {
	protectRoute(req, res, () => next()).catch(() => next());
};

// Public / Customer routes
router.post("/subscribe", (req, res, next) => {
	// Try protectRoute if token present, otherwise proceed as guest
	if (req.cookies.accessToken || req.headers.authorization) {
		return protectRoute(req, res, () => subscribeRestock(req, res, next));
	}
	return subscribeRestock(req, res, next);
});

router.get("/my", protectRoute, getMySubscriptions);
router.delete("/:id", protectRoute, cancelSubscription);
router.patch("/:id/cancel", protectRoute, cancelSubscription);

// Admin management routes
router.get("/admin", protectRoute, adminRoute, getAdminSubscriptions);
router.post("/admin/:id/retry", protectRoute, adminRoute, retryNotificationAdmin);

export default router;

