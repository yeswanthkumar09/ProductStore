import express from "express";
import {
	getAllCategories,
	getCategoryBySlug,
	createCategory,
	updateCategory,
	reorderCategories,
	deleteCategory,
	addSubcategory,
	updateSubcategory,
	deleteSubcategory,
} from "../controllers/category.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllCategories);
router.get("/:slug", getCategoryBySlug);

// Admin protected routes
router.patch("/reorder", protectRoute, adminRoute, reorderCategories);
router.post("/", protectRoute, adminRoute, createCategory);
router.put("/:id", protectRoute, adminRoute, updateCategory);
router.delete("/:id", protectRoute, adminRoute, deleteCategory);

// Subcategory management routes
router.post("/:id/subcategories", protectRoute, adminRoute, addSubcategory);
router.put("/:id/subcategories/:subId", protectRoute, adminRoute, updateSubcategory);
router.delete("/:id/subcategories/:subId", protectRoute, adminRoute, deleteSubcategory);

export default router;
