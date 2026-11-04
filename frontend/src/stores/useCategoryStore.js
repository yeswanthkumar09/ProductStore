import { create } from "zustand";
import axios from "../lib/axios.js";
import toast from "react-hot-toast";
import { extractErrorMessage } from "./useProductStore.js";

export const useCategoryStore = create((set, get) => ({
	categories: [],
	currentCategory: null,
	loading: false,
	error: null,

	fetchCategories: async (includeArchived = false) => {
		set({ loading: true, error: null });
		try {
			const res = await axios.get(`/categories${includeArchived ? "?includeArchived=true" : ""}`);
			const rawData = res.data;
			// Normalize: ensure categories is always an array
			const categoriesList = Array.isArray(rawData)
				? rawData
				: Array.isArray(rawData?.categories)
				? rawData.categories
				: [];
			set({ categories: categoriesList, loading: false, error: null });
			return categoriesList;
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to load categories");
			console.error("Error fetching categories:", msg);
			set({ categories: [], loading: false, error: msg });
			return [];
		}
	},

	fetchCategoryBySlug: async (slug) => {
		set({ loading: true, error: null });
		try {
			const cleanSlug = typeof slug === "string" ? slug.toLowerCase().trim() : "";
			const res = await axios.get(`/categories/${cleanSlug}`);
			const data = res.data;

			// If data is an error object without category fields
			if (data && typeof data === "object" && (data.code || data.error) && !data.slug && !data._id) {
				const msg = extractErrorMessage(data, "Category not found");
				set({ currentCategory: null, loading: false, error: msg });
				return null;
			}

			set({ currentCategory: data, loading: false, error: null });
			return data;
		} catch (error) {
			const msg = extractErrorMessage(error, "Category not found");
			console.error("Error fetching category:", msg);
			set({ currentCategory: null, loading: false, error: msg });
			return null;
		}
	},

	createCategory: async (categoryData) => {
		set({ loading: true, error: null });
		try {
			const res = await axios.post("/categories", categoryData);
			set((state) => ({
				categories: [...state.categories, res.data],
				loading: false,
				error: null,
			}));
			const name = typeof res.data?.name === "string" ? res.data.name : "Category";
			toast.success(`Category "${name}" created successfully!`);
			return res.data;
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to create category");
			set({ loading: false, error: msg });
			toast.error(msg);
			throw error;
		}
	},

	updateCategory: async (id, categoryData) => {
		set({ loading: true, error: null });
		try {
			const res = await axios.put(`/categories/${id}`, categoryData);
			set((state) => ({
				categories: state.categories.map((c) => (c._id === id ? res.data : c)),
				currentCategory: state.currentCategory?._id === id ? res.data : state.currentCategory,
				loading: false,
				error: null,
			}));
			const name = typeof res.data?.name === "string" ? res.data.name : "Category";
			toast.success(`Category "${name}" updated successfully!`);
			return res.data;
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to update category");
			set({ loading: false, error: msg });
			toast.error(msg);
			throw error;
		}
	},

	reorderCategories: async (orders) => {
		set({ loading: true, error: null });
		try {
			const res = await axios.patch("/categories/reorder", { orders });
			const list = Array.isArray(res.data) ? res.data : [];
			set({ categories: list, loading: false, error: null });
			toast.success("Category sequence saved!");
			return list;
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to reorder categories");
			set({ loading: false, error: msg });
			toast.error(msg);
			throw error;
		}
	},

	deleteCategory: async (id, force = false) => {
		set({ loading: true, error: null });
		try {
			const res = await axios.delete(`/categories/${id}${force ? "?force=true" : ""}`);
			if (res.data?.archived) {
				set((state) => ({
					categories: state.categories.map((c) => (c._id === id ? { ...c, isArchived: true, isActive: false } : c)),
					loading: false,
					error: null,
				}));
				const msg = typeof res.data?.message === "string" ? res.data.message : "Category archived safely";
				toast(msg, { icon: "📦" });
			} else {
				set((state) => ({
					categories: state.categories.filter((c) => c._id !== id),
					loading: false,
					error: null,
				}));
				const msg = typeof res.data?.message === "string" ? res.data.message : "Category deleted successfully!";
				toast.success(msg);
			}
			return res.data;
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to delete category");
			set({ loading: false, error: msg });
			toast.error(msg);
			throw error;
		}
	},

	addSubcategory: async (categoryId, subcategoryData) => {
		set({ loading: true, error: null });
		try {
			const res = await axios.post(`/categories/${categoryId}/subcategories`, subcategoryData);
			set((state) => ({
				categories: state.categories.map((c) => (c._id === categoryId ? res.data : c)),
				currentCategory: state.currentCategory?._id === categoryId ? res.data : state.currentCategory,
				loading: false,
				error: null,
			}));
			toast.success("Subcategory added successfully!");
			return res.data;
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to add subcategory");
			set({ loading: false, error: msg });
			toast.error(msg);
			throw error;
		}
	},

	updateSubcategory: async (categoryId, subId, subcategoryData) => {
		set({ loading: true, error: null });
		try {
			const res = await axios.put(`/categories/${categoryId}/subcategories/${subId}`, subcategoryData);
			set((state) => ({
				categories: state.categories.map((c) => (c._id === categoryId ? res.data : c)),
				currentCategory: state.currentCategory?._id === categoryId ? res.data : state.currentCategory,
				loading: false,
				error: null,
			}));
			toast.success("Subcategory updated successfully!");
			return res.data;
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to update subcategory");
			set({ loading: false, error: msg });
			toast.error(msg);
			throw error;
		}
	},

	deleteSubcategory: async (categoryId, subId) => {
		set({ loading: true, error: null });
		try {
			const res = await axios.delete(`/categories/${categoryId}/subcategories/${subId}`);
			const updatedCat = res.data?.category || res.data;
			set((state) => ({
				categories: state.categories.map((c) => (c._id === categoryId ? updatedCat : c)),
				currentCategory: state.currentCategory?._id === categoryId ? updatedCat : state.currentCategory,
				loading: false,
				error: null,
			}));
			toast.success("Subcategory removed!");
			return res.data;
		} catch (error) {
			const msg = extractErrorMessage(error, "Failed to delete subcategory");
			set({ loading: false, error: msg });
			toast.error(msg);
			throw error;
		}
	},
}));
