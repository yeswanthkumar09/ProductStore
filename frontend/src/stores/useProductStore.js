import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useProductStore = create((set, get) => ({
	products: [],
	featuredProducts: [],
	currentProduct: null,
	reviews: [],
	loading: false,
	total: 0,
	page: 1,
	pages: 1,

	setProducts: (products) => set({ products }),

	createProduct: async (productData) => {
		set({ loading: true });
		try {
			const res = await axios.post("/products", productData);
			set((prevState) => ({
				products: [...prevState.products, res.data],
				loading: false,
			}));
			toast.success("Product created successfully!");
			return res.data;
		} catch (error) {
			toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to create product");
			set({ loading: false });
			throw error;
		}
	},

	updateProduct: async (productId, productData) => {
		set({ loading: true });
		try {
			const res = await axios.put(`/products/${productId}`, productData);
			set((prevState) => ({
				products: prevState.products.map((p) => (p._id === productId ? res.data : p)),
				currentProduct: prevState.currentProduct?._id === productId ? res.data : prevState.currentProduct,
				loading: false,
			}));
			toast.success("Product updated successfully!");
			return res.data;
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to update product");
			set({ loading: false });
			throw error;
		}
	},

	fetchAllProducts: async () => {
		set({ loading: true });
		try {
			const response = await axios.get("/products");
			set({ products: response.data.products, loading: false });
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.error || "Failed to fetch products");
		}
	},

	fetchProductsByCategory: async (category, params = {}) => {
		set({ loading: true });
		try {
			const query = new URLSearchParams(params).toString();
			const response = await axios.get(`/products/category/${category}${query ? `?${query}` : ""}`);
			set({
				products: response.data.products || [],
				total: response.data.total || 0,
				page: response.data.page || 1,
				pages: response.data.pages || 1,
				loading: false,
			});
		} catch (error) {
			set({ loading: false, products: [] });
			toast.error(error.response?.data?.error || "Failed to fetch category products");
		}
	},

	searchProducts: async (params = {}) => {
		set({ loading: true });
		try {
			const query = new URLSearchParams(params).toString();
			const response = await axios.get(`/products/search?${query}`);
			set({
				products: response.data.products || [],
				total: response.data.total || 0,
				page: response.data.page || 1,
				pages: response.data.pages || 1,
				loading: false,
			});
			return response.data;
		} catch (error) {
			set({ loading: false, products: [] });
			toast.error(error.response?.data?.message || "Failed to search products");
		}
	},

	fetchProductById: async (productId) => {
		set({ loading: true, currentProduct: null });
		try {
			const response = await axios.get(`/products/${productId}`);
			set({ currentProduct: response.data, loading: false });
			return response.data;
		} catch (error) {
			set({ loading: false, currentProduct: null });
			toast.error(error.response?.data?.message || "Product not found", {
				id: "product-not-found",
			});
			return null;
		}
	},

	fetchReviews: async (productId) => {
		try {
			const response = await axios.get(`/products/${productId}/reviews`);
			set({ reviews: response.data });
		} catch (error) {
			console.error("Error fetching reviews:", error);
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
			const msg = error.response?.data?.message || "Failed to submit review";
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
			const msg = error.response?.data?.message || "Failed to update review";
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
			toast.error(error.response?.data?.message || "Failed to delete review");
		}
	},

	deleteProduct: async (productId) => {
		set({ loading: true });
		try {
			await axios.delete(`/products/${productId}`);
			set((prevState) => ({
				products: (prevState.products || []).filter((product) => product._id !== productId),
				loading: false,
			}));
			toast.success("Product deleted successfully");
			return true;
		} catch (error) {
			set({ loading: false });
			const msg =
				error.response?.data?.message ||
				error.response?.data?.error ||
				"Failed to delete product";
			toast.error(msg);
			return false;
		}
	},

	toggleFeaturedProduct: async (productId) => {
		set({ loading: true });
		try {
			const response = await axios.patch(`/products/${productId}`);
			set((prevProducts) => ({
				products: prevProducts.products.map((product) =>
					product._id === productId ? { ...product, isFeatured: response.data.isFeatured } : product
				),
				loading: false,
			}));
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.error || "Failed to update product");
		}
	},

	fetchFeaturedProducts: async () => {
		set({ loading: true });
		try {
			const response = await axios.get("/products/featured");
			set({ featuredProducts: response.data, products: response.data, loading: false });
		} catch (error) {
			set({ loading: false });
			console.log("Error fetching featured products:", error);
		}
	},

	previewBulkProducts: async (payload) => {
		set({ loading: true });
		try {
			const res = await axios.post("/products/bulk-preview", payload);
			set({ loading: false });
			return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to validate product records.");
			throw error;
		}
	},

	executeBulkImport: async (products) => {
		set({ loading: true });
		try {
			const res = await axios.post("/products/bulk-import", { products });
			await get().fetchAllProducts();
			set({ loading: false });
			toast.success(res.data.message || "Bulk products imported successfully!");
			return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Bulk import failed.");
			throw error;
		}
	},
}));
