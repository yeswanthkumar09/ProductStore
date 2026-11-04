import express from "express";
import {
	getPublishedSection,
	getAllPublishedSections,
	getAllSectionsAdmin,
	saveSectionAdmin,
	publishSectionAdmin,
	rollbackVersionAdmin,
} from "../controllers/cmsContent.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public customer-facing routes (with caching support)
router.get("/published", getAllPublishedSections);
router.get("/published/:sectionKey", getPublishedSection);

// Admin content-management routes
router.get("/admin", protectRoute, adminRoute, getAllSectionsAdmin);
router.post("/admin/:sectionKey", protectRoute, adminRoute, saveSectionAdmin);
router.put("/admin/:sectionKey", protectRoute, adminRoute, saveSectionAdmin);
router.post("/admin/:sectionKey/publish", protectRoute, adminRoute, publishSectionAdmin);
router.post("/admin/:sectionKey/rollback/:version", protectRoute, adminRoute, rollbackVersionAdmin);

export default router;

