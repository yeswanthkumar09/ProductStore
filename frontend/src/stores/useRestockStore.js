import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useRestockStore = create((set, get) => ({
	mySubscriptions: [],
	adminSubscriptions: [],
	adminMetrics: { total: 0, active: 0, notified: 0, failed: 0, cancelled: 0 },
	adminTotal: 0,
	adminPages: 1,
	loading: false,

	subscribe: async ({ productId, variantId, size, color, email }) => {
		set({ loading: true });
		try {
			const res = await axios.post("/restock-subscriptions/subscribe", {
				productId,
				variantId,
				size,
				color,
				email,
			});
			set({ loading: false });
			if (res.data.alreadySubscribed) {
				toast.success(res.data.message);
			} else {
				toast.success(res.data.message || "Subscribed to restock alerts!");
			}
			return res.data;
		} catch (error) {
			set({ loading: false });
			const msg = error.response?.data?.message || "Failed to subscribe to restock alerts";
			toast.error(msg);
			throw error;
		}
	},

	fetchMySubscriptions: async () => {
		set({ loading: true });
		try {
			const res = await axios.get("/restock-subscriptions/my");
			set({ mySubscriptions: res.data || [], loading: false });
			return res.data;
		} catch (error) {
			set({ loading: false });
			console.error("Error fetching my restock subscriptions:", error);
			return [];
		}
	},

	cancelSubscription: async (id) => {
		try {
			const res = await axios.delete(`/restock-subscriptions/${id}`);
			set((state) => ({
				mySubscriptions: state.mySubscriptions.map((s) =>
					s._id === id ? { ...s, status: "cancelled" } : s
				),
				adminSubscriptions: state.adminSubscriptions.map((s) =>
					s._id === id ? { ...s, status: "cancelled" } : s
				),
			}));
			toast.success("Subscription cancelled");
			return res.data;
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to cancel subscription");
			throw error;
		}
	},

	fetchAdminSubscriptions: async ({ page = 1, limit = 20, status = "all", search = "" } = {}) => {
		set({ loading: true });
		try {
			const res = await axios.get("/restock-subscriptions/admin", {
				params: { page, limit, status, search },
			});
			set({
				adminSubscriptions: res.data.subscriptions || [],
				adminMetrics: res.data.metrics || {},
				adminTotal: res.data.total || 0,
				adminPages: res.data.pages || 1,
				loading: false,
			});
			return res.data;
		} catch (error) {
			set({ loading: false });
			console.error("Error fetching admin restock subscriptions:", error);
			throw error;
		}
	},

	retryNotification: async (id) => {
		try {
			const res = await axios.post(`/restock-subscriptions/admin/${id}/retry`);
			set((state) => ({
				adminSubscriptions: state.adminSubscriptions.map((s) =>
					s._id === id ? res.data.subscription : s
				),
			}));
			toast.success(res.data.message || "Notification re-triggered!");
			return res.data;
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to retry notification");
			throw error;
		}
	},
}));

