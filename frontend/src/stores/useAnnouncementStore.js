import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useAnnouncementStore = create((set, get) => ({
	announcements: [],
	allAnnouncements: [],
	loading: false,

	fetchActiveAnnouncements: async () => {
		try {
			const res = await axios.get("/announcements");
			const data = Array.isArray(res.data) ? res.data : [];
			set({ announcements: data });
			return data;
		} catch (error) {
			console.error("Error fetching announcements:", error);
			return [];
		}
	},

	fetchAllAnnouncementsAdmin: async () => {
		set({ loading: true });
		try {
			const res = await axios.get("/announcements/admin");
			set({ allAnnouncements: res.data || [], loading: false });
			return res.data;
		} catch (error) {
			set({ loading: false });
			console.error("Error fetching admin announcements:", error);
			throw error;
		}
	},

	createAnnouncement: async (data) => {
		set({ loading: true });
		try {
			const res = await axios.post("/announcements/admin", data);
			set((state) => ({
				allAnnouncements: [res.data, ...state.allAnnouncements],
				loading: false,
			}));
			get().fetchActiveAnnouncements();
			toast.success("Announcement published successfully!");
			return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to create announcement");
			throw error;
		}
	},

	updateAnnouncement: async (id, data) => {
		set({ loading: true });
		try {
			const res = await axios.put(`/announcements/admin/${id}`, data);
			set((state) => ({
				allAnnouncements: state.allAnnouncements.map((a) => (a._id === id ? res.data : a)),
				loading: false,
			}));
			get().fetchActiveAnnouncements();
			toast.success("Announcement updated successfully!");
			return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to update announcement");
			throw error;
		}
	},

	deleteAnnouncement: async (id) => {
		set({ loading: true });
		try {
			await axios.delete(`/announcements/admin/${id}`);
			set((state) => ({
				allAnnouncements: state.allAnnouncements.filter((a) => a._id !== id),
				loading: false,
			}));
			get().fetchActiveAnnouncements();
			toast.success("Announcement deleted successfully!");
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to delete announcement");
			throw error;
		}
	},

	toggleAnnouncement: async (id) => {
		try {
			const res = await axios.patch(`/announcements/admin/${id}/toggle`);
			set((state) => ({
				allAnnouncements: state.allAnnouncements.map((a) => (a._id === id ? res.data : a)),
			}));
			get().fetchActiveAnnouncements();
			toast.success(res.data.isActive ? "Announcement activated" : "Announcement paused");
			return res.data;
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to toggle announcement");
			throw error;
		}
	},
}));

