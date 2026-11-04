import express from "express";
import {
	getActiveAnnouncements,
	getAllAnnouncementsAdmin,
	createAnnouncement,
	updateAnnouncement,
	deleteAnnouncement,
	toggleAnnouncement,
} from "../controllers/announcement.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getActiveAnnouncements);
router.get("/admin", protectRoute, adminRoute, getAllAnnouncementsAdmin);
router.post("/", protectRoute, adminRoute, createAnnouncement);
router.put("/:id", protectRoute, adminRoute, updateAnnouncement);
router.delete("/:id", protectRoute, adminRoute, deleteAnnouncement);
router.patch("/:id/toggle", protectRoute, adminRoute, toggleAnnouncement);

export default router;

