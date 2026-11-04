import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useCategoryStore = create((set, get) => ({
	categories: [],
	currentCategory: null,
	loading: false,

	fetchCategories: async (includeArchived = false) => {
		set({ loading: true });
		try {
			const res = await axios.get(`/categories${includeArchived ? "?includeArchived=true" : ""}`);
			const data = res.data || [];
			set({ categories: data, loading: false });
			return data;
		} catch (error) {
			console.error("Error fetching categories:", error);
			set({ loading: false });
			return [];
		}
	},

	fetchCategoryBySlug: async (slug) => {
		set({ loading: true });
		try {
			const res = await axios.get(`/categories/${slug}`);
			set({ currentCategory: res.data, loading: false });
			return res.data;
		} catch (error) {
			console.error("Error fetching category:", error);
			set({ loading: false });
			return null;
		}
	},

	createCategory: async (categoryData) => {
		set({ loading: true });
		try {
			const res = await axios.post("/categories", categoryData);
			set((state) => ({
				categories: [...state.categories, res.data],
				loading: false,
			}));
			toast.success(`Category "${res.data.name}" created successfully!`);
			return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to create category");
			throw error;
		}
	},

	updateCategory: async (id, categoryData) => {
		set({ loading: true });
		try {
			const res = await axios.put(`/categories/${id}`, categoryData);
			set((state) => ({
				categories: state.categories.map((c) => (c._id === id ? res.data : c)),
				currentCategory: state.currentCategory?._id === id ? res.data : state.currentCategory,
				loading: false,
			}));
			toast.success(`Category "${res.data.name}" updated successfully!`);
			return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to update category");
			throw error;
		}
	},

	reorderCategories: async (orders) => {
		set({ loading: true });
		try {
			const res = await axios.patch("/categories/reorder", { orders });
			set({ categories: res.data || [], loading: false });
			toast.success("Category sequence saved!");
			return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to reorder categories");
			throw error;
		}
	},

	deleteCategory: async (id, force = false) => {
		set({ loading: true });
		try {
			const res = await axios.delete(`/categories/${id}${force ? "?force=true" : ""}`);
			if (res.data.archived) {
				set((state) => ({
					categories: state.categories.map((c) => (c._id === id ? { ...c, isArchived: true, isActive: false } : c)),
					loading: false,
				}));
				toast(res.data.message || "Category archived safely", { icon: "📦" });
			} else {
				set((state) => ({
					categories: state.categories.filter((c) => c._id !== id),
					loading: false,
				}));
				toast.success(res.data.message || "Category deleted successfully!");
			}
			return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to delete category");
			throw error;
		}
	},

	addSubcategory: async (categoryId, subcategoryData) => {
		set({ loading: true });
		try {
			const res = await axios.post(`/categories/${categoryId}/subcategories`, subcategoryData);
			set((state) => ({
				categories: state.categories.map((c) => (c._id === categoryId ? res.data : c)),
				currentCategory: state.currentCategory?._id === categoryId ? res.data : state.currentCategory,
				loading: false,
			}));
			toast.success("Subcategory added successfully!");
			return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to add subcategory");
			throw error;
		}
	},

	updateSubcategory: async (categoryId, subId, subcategoryData) => {
		set({ loading: true });
		try {
			const res = await axios.put(`/categories/${categoryId}/subcategories/${subId}`, subcategoryData);
			set((state) => ({
				categories: state.categories.map((c) => (c._id === categoryId ? res.data : c)),
				currentCategory: state.currentCategory?._id === categoryId ? res.data : state.currentCategory,
				loading: false,
			}));
			toast.success("Subcategory updated successfully!");
			return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to update subcategory");
			throw error;
		}
	},

	deleteSubcategory: async (categoryId, subId) => {
		set({ loading: true });
		try {
			const res = await axios.delete(`/categories/${categoryId}/subcategories/${subId}`);
			set((state) => ({
				categories: state.categories.map((c) => (c._id === categoryId ? res.data.category : c)),
				currentCategory: state.currentCategory?._id === categoryId ? res.data.category : state.currentCategory,
				loading: false,
			}));
			toast.success("Subcategory removed!");
			return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to delete subcategory");
			throw error;
		}
	},
}));
