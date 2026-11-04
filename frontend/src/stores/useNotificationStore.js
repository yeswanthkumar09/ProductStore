import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useNotificationStore = create((set, get) => ({
	notifications: [],
	unreadCount: 0,
	loading: false,

	fetchNotifications: async () => {
		try {
			set({ loading: true });
			const res = await axios.get("/notifications");
			set({
				notifications: res.data.notifications || [],
				unreadCount: res.data.unreadCount || 0,
				loading: false,
			});
		} catch (error) {
			set({ loading: false });
		}
	},

	markAsRead: async (id) => {
		try {
			await axios.patch(`/notifications/${id}/read`);
			set((state) => {
				const updated = state.notifications.map((n) =>
					n._id === id ? { ...n, isRead: true } : n
				);
				return {
					notifications: updated,
					unreadCount: Math.max(0, state.unreadCount - 1),
				};
			});
		} catch (error) {
			console.error("Error marking notification read:", error);
		}
	},

	markAllAsRead: async () => {
		try {
			await axios.patch("/notifications/read-all");
			set((state) => ({
				notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
				unreadCount: 0,
			}));
			toast.success("All notifications marked as read");
		} catch (error) {
			toast.error("Failed to mark all as read");
		}
	},

	broadcastNotification: async (payload) => {
		try {
			const res = await axios.post("/notifications/broadcast", payload);
			toast.success(res.data.message || "Announcement sent to all users!");
			get().fetchNotifications();
			return res.data;
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to broadcast announcement");
			throw error;
		}
	},
}));
