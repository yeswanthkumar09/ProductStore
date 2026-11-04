import express from "express";
import { protectRoute, adminRoute, optionalAuth } from "../middleware/auth.middleware.js";
import {
	getCoupon,
	getAvailableStoreCoupons,
	validateCoupon,
	getAllCouponsAdmin,
	createCouponAdmin,
	updateCouponAdmin,
	deleteCouponAdmin,
} from "../controllers/coupon.controller.js";

const router = express.Router();

// User endpoints
router.get("/", optionalAuth, getCoupon);
router.get("/available", optionalAuth, getAvailableStoreCoupons);
router.post("/validate", optionalAuth, validateCoupon);

// Admin endpoints
router.get("/admin", protectRoute, adminRoute, getAllCouponsAdmin);
router.post("/admin", protectRoute, adminRoute, createCouponAdmin);
router.put("/admin/:id", protectRoute, adminRoute, updateCouponAdmin);
router.delete("/admin/:id", protectRoute, adminRoute, deleteCouponAdmin);

export default router;
