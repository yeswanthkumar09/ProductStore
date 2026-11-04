import express from "express";
import { rateLimit } from "express-rate-limit";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
	getUserOrders,
	getOrderById,
	cancelUserOrder,
	getAdminOrders,
	adminCancelOrder,
	adminRefundOrder,
	adminUpdateOrderStatus,
} from "../controllers/order.controller.js";

const router = express.Router();

// Sensitive action rate limiters
const cancelLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 30,
	message: { error: "Too many cancellation requests, please try again later." },
	standardHeaders: true,
	legacyHeaders: false,
});

const refundLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 30,
	message: { error: "Too many refund requests, please try again later." },
	standardHeaders: true,
	legacyHeaders: false,
});

// ==========================================
// CUSTOMER ORDER ROUTES (Protected)
// ==========================================
router.get("/", protectRoute, getUserOrders);
router.get("/:id", protectRoute, getOrderById);
router.post("/:id/cancel", protectRoute, cancelLimiter, cancelUserOrder);

// ==========================================
// ADMIN ORDER MANAGEMENT ROUTES (Protected + Admin)
// ==========================================
router.get("/admin/all", protectRoute, adminRoute, getAdminOrders);
router.post("/admin/:id/cancel", protectRoute, adminRoute, cancelLimiter, adminCancelOrder);
router.post("/admin/:id/refund", protectRoute, adminRoute, refundLimiter, adminRefundOrder);
router.put("/admin/:id/status", protectRoute, adminRoute, adminUpdateOrderStatus);

export default router;

