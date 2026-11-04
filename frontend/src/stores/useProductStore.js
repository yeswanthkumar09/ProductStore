import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios.js";

/**
 * Robust helper to extract a clean string error message from any error shape.
 * Guarantees that an object (such as { code, message }) is never returned or passed to React children.
 */
export const extractErrorMessage = (error, defaultMessage = "An unexpected error occurred") => {
	if (!error) return defaultMessage;
	if (typeof error === "string") return error;
	if (typeof error.normalizedMessage === "string") return error.normalizedMessage;

	// Check response data properties
	const data = error.response?.data;
	if (typeof data === "string") return data;
	if (data && typeof data === "object") {
		if (typeof data.message === "string") return data.message;
		if (typeof data.error === "string") return data.error;
		if (data.error && typeof data.error.message === "string") return data.error.message;
		if (data.message && typeof data.message === "object" && typeof data.message.message === "string") {
			return data.message.message;
		}
		if (typeof data.code === "string" && typeof data.message === "string") return data.message;
	}

	// Check error instance properties
	if (typeof error.message === "string") return error.message;
	if (typeof error.error === "string") return error.error;

	return defaultMessage;
};

export const useProductStore = create((set, get) => ({
	products: [],
	featuredProducts: [],
	currentProduct: null,
	reviews: [],
	loading: false,
	error: null, // Explicit error state (guaranteed null or string)
	total: 0,
	page: 1,
	pages: 1,

	setProducts: (products) => set({ products: Array.isArray(products) ? products : [] }),

	createProduct: async (productData) => {
		set({ loading: true, error: null });
		try {
			const res = await axios.post("/products", productData);
			set((prevState) => ({
				products: [...prevState.products, res.data],
				loading: false,
				error: null,
			}));
			toast.success("Product created successfully!");
			return res.data;
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to create product");
			toast.error(msg);
			set({ loading: false, error: msg });
			throw error;
		}
	},

	updateProduct: async (productId, productData) => {
		set({ loading: true, error: null });
		try {
			const res = await axios.put(`/products/${productId}`, productData);
			set((prevState) => ({
				products: prevState.products.map((p) => (p._id === productId ? res.data : p)),
				currentProduct: prevState.currentProduct?._id === productId ? res.data : prevState.currentProduct,
				loading: false,
				error: null,
			}));
			toast.success("Product updated successfully!");
			return res.data;
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to update product");
			toast.error(msg);
			set({ loading: false, error: msg });
			throw error;
		}
	},

	fetchAllProducts: async () => {
		set({ loading: true, error: null });
		try {
			const response = await axios.get("/products");
			const rawProducts = Array.isArray(response.data)
				? response.data
				: Array.isArray(response.data?.products)
				? response.data.products
				: [];
			set({ products: rawProducts, loading: false, error: null });
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to fetch products");
			set({ loading: false, error: msg });
			toast.error(msg);
		}
	},

	fetchProductsByCategory: async (category, params = {}) => {
		set({ loading: true, error: null });
		try {
			const cleanCategory = typeof category === "string" ? category.toLowerCase().trim() : "";
			const query = new URLSearchParams(params).toString();
			const response = await axios.get(`/products/category/${cleanCategory}${query ? `?${query}` : ""}`);
			const data = response.data;

			// Handle potential error payload delivered with 200 OK (e.g., { code, message })
			if (data && typeof data === "object" && !Array.isArray(data) && !data.products && (data.code || data.error)) {
				const errorMsg =
					typeof data.message === "string"
						? data.message
						: typeof data.error === "string"
						? data.error
						: typeof data.error?.message === "string"
						? data.error.message
						: "Category not found";

				set({
					products: [],
					total: 0,
					page: 1,
					pages: 1,
					loading: false,
					error: errorMsg,
				});
				return;
			}

			// Normalize products: handle array response, { products: [...] }, or missing fields
			const rawProducts = Array.isArray(data)
				? data
				: Array.isArray(data?.products)
				? data.products
				: [];

			set({
				products: rawProducts,
				total: typeof data?.total === "number" ? data.total : rawProducts.length,
				page: Number(data?.page) || 1,
				pages: Number(data?.pages) || 1,
				loading: false,
				error: null,
			});
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to fetch category products");
			set({ loading: false, products: [], error: msg });
			toast.error(msg);
		}
	},

	searchProducts: async (params = {}) => {
		set({ loading: true, error: null });
		try {
			const query = new URLSearchParams(params).toString();
			const response = await axios.get(`/products/search?${query}`);
			const data = response.data;
			const rawProducts = Array.isArray(data)
				? data
				: Array.isArray(data?.products)
				? data.products
				: [];
			set({
				products: rawProducts,
				total: typeof data?.total === "number" ? data.total : rawProducts.length,
				page: Number(data?.page) || 1,
				pages: Number(data?.pages) || 1,
				loading: false,
				error: null,
			});
			return response.data;
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to search products");
			set({ loading: false, products: [], error: msg });
			toast.error(msg);
		}
	},

	fetchProductById: async (productId) => {
		set({ loading: true, currentProduct: null, error: null });
		try {
			const response = await axios.get(`/products/${productId}`);
			set({ currentProduct: response.data, loading: false, error: null });
			return response.data;
		} catch (error) {
			const msg = extractErrorMessage(error, "Product not found");
			set({ loading: false, currentProduct: null, error: msg });
			toast.error(msg, { id: "product-not-found" });
			return null;
		}
	},

	fetchReviews: async (productId) => {
		try {
			const response = await axios.get(`/products/${productId}/reviews`);
			const list = Array.isArray(response.data) ? response.data : [];
			set({ reviews: list });
		} catch (error) {
			console.error("Error fetching reviews:", error);
			set({ reviews: [] });
		}
	},

	addReview: async (arg1, arg2) => {
		const productId = typeof arg1 === "object" ? arg1.productId : arg1;
		const payload = typeof arg1 === "object" ? arg1 : arg2;
		const { rating, comment, title, images } = payload || {};

		try {
			const response = await axios.post(`/products/${productId}/reviews`, { rating, comment, title, images });
			set((state) => ({ reviews: [response.data, ...state.reviews] }));
			toast.success("Verified review submitted!");
			get().fetchProductById(productId);
			return response.data;
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to submit review");
			toast.error(msg);
			throw error;
		}
	},

	updateReview: async (reviewId, { rating, comment, title, images, productId }) => {
		try {
			const response = await axios.put(`/reviews/${reviewId}`, { rating, comment, title, images });
			set((state) => ({
				reviews: state.reviews.map((r) => (r._id === reviewId ? response.data : r)),
			}));
			toast.success("Review updated successfully!");
			if (productId) get().fetchProductById(productId);
			return response.data;
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to update review");
			toast.error(msg);
			throw error;
		}
	},

	deleteReview: async (productId, reviewId) => {
		try {
			await axios.delete(`/products/${productId}/reviews/${reviewId}`);
			set((state) => ({
				reviews: state.reviews.filter((r) => r._id !== reviewId),
			}));
			toast.success("Review deleted");
			get().fetchProductById(productId);
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to delete review");
			toast.error(msg);
		}
	},

	deleteProduct: async (productId) => {
		set({ loading: true, error: null });
		try {
			await axios.delete(`/products/${productId}`);
			set((prevState) => ({
				products: (prevState.products || []).filter((product) => product._id !== productId),
				loading: false,
				error: null,
			}));
			toast.success("Product deleted successfully");
			return true;
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to delete product");
			set({ loading: false, error: msg });
			toast.error(msg);
			return false;
		}
	},

	toggleFeaturedProduct: async (productId) => {
		set({ loading: true, error: null });
		try {
			const response = await axios.patch(`/products/${productId}`);
			set((prevProducts) => ({
				products: prevProducts.products.map((product) =>
					product._id === productId ? { ...product, isFeatured: response.data.isFeatured } : product
				),
				loading: false,
				error: null,
			}));
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to update product");
			set({ loading: false, error: msg });
			toast.error(msg);
		}
	},

	fetchFeaturedProducts: async () => {
		set({ loading: true, error: null });
		try {
			const response = await axios.get("/products/featured");
			const rawProducts = Array.isArray(response.data)
				? response.data
				: Array.isArray(response.data?.products)
				? response.data.products
				: [];
			set({ featuredProducts: rawProducts, products: rawProducts, loading: false, error: null });
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to fetch featured products");
			set({ loading: false, error: msg });
			console.log("Error fetching featured products:", msg);
		}
	},

	previewBulkProducts: async (payload) => {
		set({ loading: true, error: null });
		try {
			const res = await axios.post("/products/bulk-preview", payload);
			set({ loading: false, error: null });
			return res.data;
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to validate product records.");
			set({ loading: false, error: msg });
			toast.error(msg);
			throw error;
		}
	},

	executeBulkImport: async (products) => {
		set({ loading: true, error: null });
		try {
			const res = await axios.post("/products/bulk-import", { products });
			await get().fetchAllProducts();
			set({ loading: false, error: null });
			toast.success(res.data?.message || "Bulk products imported successfully!");
			return res.data;
		} catch (error) {
			const msg = extractErrorMessage(error, "Bulk import failed.");
			set({ loading: false, error: msg });
			toast.error(msg);
			throw error;
		}
	},
}));
