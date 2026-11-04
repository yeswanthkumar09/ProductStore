import express from "express";
import { protectRoute, optionalAuth } from "../middleware/auth.middleware.js";
import {
	trackProductView,
	syncGuestHistory,
	getBrowsingHistory,
	clearBrowsingHistory,
	deleteBrowsingHistoryItem,
	getPersonalizedRecommendations,
} from "../controllers/recommendation.controller.js";

const router = express.Router();

router.post("/track", optionalAuth, trackProductView);
router.post("/sync", protectRoute, syncGuestHistory);
router.get("/history", protectRoute, getBrowsingHistory);
router.delete("/history/:productId", protectRoute, deleteBrowsingHistoryItem);
router.delete("/history", protectRoute, clearBrowsingHistory);
router.get("/", optionalAuth, getPersonalizedRecommendations);

export default router;
