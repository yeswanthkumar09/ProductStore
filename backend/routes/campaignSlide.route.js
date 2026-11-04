import express from "express";
import {
	getActiveSlides,
	getAllSlidesAdmin,
	createSlide,
	updateSlide,
	deleteSlide,
	toggleSlide,
} from "../controllers/campaignSlide.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes for storefront
router.get("/", getActiveSlides);
router.get("/active", getActiveSlides);

// Admin slide management routes (support both direct and /admin prefix)
router.get("/admin", protectRoute, adminRoute, getAllSlidesAdmin);

router.post("/", protectRoute, adminRoute, createSlide);
router.post("/admin", protectRoute, adminRoute, createSlide);

router.put("/:id", protectRoute, adminRoute, updateSlide);
router.put("/admin/:id", protectRoute, adminRoute, updateSlide);

router.delete("/:id", protectRoute, adminRoute, deleteSlide);
router.delete("/admin/:id", protectRoute, adminRoute, deleteSlide);

router.patch("/:id/toggle", protectRoute, adminRoute, toggleSlide);
router.patch("/admin/:id/toggle", protectRoute, adminRoute, toggleSlide);

export default router;

