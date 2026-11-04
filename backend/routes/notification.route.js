import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
	getUserNotifications,
	markAsRead,
	markAllAsRead,
	broadcastNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUserNotifications);
router.patch("/:id/read", protectRoute, markAsRead);
router.patch("/read-all", protectRoute, markAllAsRead);
router.post("/broadcast", protectRoute, adminRoute, broadcastNotification);

export default router;
