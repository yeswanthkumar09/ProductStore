import express from "express";
import {
	createProduct,
	deleteProduct,
	getAllProducts,
	getFeaturedProducts,
	getNewArrivals,
	getProductById,
	getProductsByCategory,
	getRecommendedProducts,
	getSimilarProducts,
	searchProducts,
	getPopularSearches,
	toggleFeaturedProduct,
	updateProduct,
	previewBulkProducts,
	executeBulkImport,
} from "../controllers/product.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/new-arrivals", getNewArrivals);
router.get("/search", searchProducts);
router.get("/popular-searches", getPopularSearches);
router.get("/category/:category", getProductsByCategory);
router.get("/recommendations", getRecommendedProducts);
router.post("/bulk-preview", protectRoute, adminRoute, previewBulkProducts);
router.post("/bulk-import", protectRoute, adminRoute, executeBulkImport);
router.get("/:id", getProductById);
router.get("/:id/similar", getSimilarProducts);
router.post("/", protectRoute, adminRoute, createProduct);
router.put("/:id", protectRoute, adminRoute, updateProduct);
router.patch("/:id", protectRoute, adminRoute, toggleFeaturedProduct);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);

export default router;
