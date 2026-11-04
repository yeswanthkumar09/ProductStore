import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useCampaignSlideStore = create((set, get) => ({
	slides: [],
	allSlides: [],
	loading: false,

	fetchActiveSlides: async () => {
		try {
			const res = await axios.get("/campaign-slides");
			const data = Array.isArray(res.data) ? res.data : [];
			set({ slides: data });
			return data;
		} catch (error) {
			console.error("Error fetching campaign slides:", error);
			return [];
		}
	},

	fetchAllSlidesAdmin: async () => {
		set({ loading: true });
		try {
			const res = await axios.get("/campaign-slides/admin");
			set({ allSlides: res.data || [], loading: false });
			return res.data;
		} catch (error) {
			set({ loading: false });
			console.error("Error fetching admin slides:", error);
			throw error;
		}
	},

	createSlide: async (data) => {
		set({ loading: true });
		try {
			const res = await axios.post("/campaign-slides", data);
			set((state) => ({
				allSlides: [...state.allSlides, res.data],
				loading: false,
			}));
			get().fetchActiveSlides();
			toast.success("Campaign slide created successfully!");
			return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to create campaign slide");
			throw error;
		}
	},

	updateSlide: async (id, data) => {
		set({ loading: true });
		try {
			const res = await axios.put(`/campaign-slides/${id}`, data);
			set((state) => ({
				allSlides: state.allSlides.map((s) => (s._id === id ? res.data : s)),
				loading: false,
			}));
			get().fetchActiveSlides();
			toast.success("Campaign slide updated successfully!");
			return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to update campaign slide");
			throw error;
		}
	},

	deleteSlide: async (id) => {
		set({ loading: true });
		try {
			await axios.delete(`/campaign-slides/${id}`);
			set((state) => ({
				allSlides: state.allSlides.filter((s) => s._id !== id),
				loading: false,
			}));
			get().fetchActiveSlides();
			toast.success("Campaign slide deleted successfully!");
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to delete campaign slide");
			throw error;
		}
	},

	toggleSlide: async (id) => {
		try {
			const res = await axios.patch(`/campaign-slides/${id}/toggle`);
			set((state) => ({
				allSlides: state.allSlides.map((s) => (s._id === id ? res.data : s)),
			}));
			get().fetchActiveSlides();
			toast.success(res.data.isActive ? "Slide activated" : "Slide paused");
			return res.data;
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to toggle slide");
			throw error;
		}
	},
}));

