import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useOrderStore = create((set, get) => ({
	orders: [],
	currentOrder: null,
	loading: false,
	cancellingId: null,

	// Admin state
	adminOrders: [],
	adminTotal: 0,
	adminPage: 1,
	adminPages: 1,
	adminMetrics: {
		totalRevenue: 0,
		totalRefunded: 0,
		totalOrders: 0,
		cancelledOrders: 0,
	},
	adminLoading: false,

	/**
	 * Customer: Fetch list of all orders
	 */
	fetchOrders: async () => {
		set({ loading: true });
		try {
			const res = await axios.get("/orders");
			set({ orders: res.data, loading: false });
			return res.data;
		} catch (error) {
			set({ loading: false });
			const msg = error.response?.data?.message || error.response?.data?.error || "Failed to fetch orders";
			toast.error(msg);
			return [];
		}
	},

	/**
	 * Customer & Admin: Fetch single order by ID
	 */
	fetchOrderDetail: async (orderId) => {
		set({ loading: true });
		try {
			const res = await axios.get(`/orders/${orderId}`);
			set({ currentOrder: res.data, loading: false });
			return res.data;
		} catch (error) {
			set({ loading: false });
			const msg = error.response?.data?.error || error.response?.data?.message || "Failed to load order details";
			toast.error(msg);
			return null;
		}
	},

	/**
	 * Customer: Cancel order
	 */
	cancelOrder: async (orderId, { reason, comment } = {}) => {
		set({ cancellingId: orderId });
		try {
			const res = await axios.post(`/orders/${orderId}/cancel`, { reason, comment });
			const updatedOrder = res.data.order;

			// Update in orders list
			set((state) => ({
				orders: state.orders.map((o) => (o._id === orderId ? updatedOrder : o)),
				currentOrder: state.currentOrder?._id === orderId ? updatedOrder : state.currentOrder,
				cancellingId: null,
			}));

			toast.success(res.data.message || "Order cancelled successfully.");
			return { success: true, order: updatedOrder };
		} catch (error) {
			set({ cancellingId: null });
			const msg = error.response?.data?.error || error.response?.data?.message || "Failed to cancel order.";
			toast.error(msg);
			return { success: false, error: msg };
		}
	},

	/**
	 * Admin: Fetch orders with filters, search, and pagination
	 */
	fetchAdminOrders: async (params = {}) => {
		set({ adminLoading: true });
		try {
			const query = new URLSearchParams();
			Object.entries(params).forEach(([key, val]) => {
				if (val !== undefined && val !== null && val !== "") {
					query.append(key, val);
				}
			});

			const res = await axios.get(`/orders/admin/all?${query.toString()}`);
			set({
				adminOrders: res.data.orders,
				adminTotal: res.data.total,
				adminPage: res.data.page,
				adminPages: res.data.pages,
				adminMetrics: res.data.metrics || get().adminMetrics,
				adminLoading: false,
			});
			return res.data;
		} catch (error) {
			set({ adminLoading: false });
			const msg = error.response?.data?.error || error.response?.data?.message || "Failed to fetch admin orders";
			toast.error(msg);
			return null;
		}
	},

	/**
	 * Admin: Cancel order
	 */
	adminCancelOrder: async (orderId, { reason, initiateRefund = true, comment } = {}) => {
		try {
			const res = await axios.post(`/orders/admin/${orderId}/cancel`, {
				reason,
				initiateRefund,
				comment,
			});
			const updatedOrder = res.data.order;

			set((state) => ({
				adminOrders: state.adminOrders.map((o) => (o._id === orderId ? updatedOrder : o)),
				currentOrder: state.currentOrder?._id === orderId ? updatedOrder : state.currentOrder,
			}));

			toast.success(res.data.message || "Order cancelled successfully.");
			return { success: true, order: updatedOrder, refund: res.data.refund };
		} catch (error) {
			const msg = error.response?.data?.error || error.response?.data?.message || "Admin order cancellation failed";
			toast.error(msg);
			return { success: false, error: msg };
		}
	},

	/**
	 * Admin: Initiate or retry refund
	 */
	adminRefundOrder: async (orderId, { amount, reason } = {}) => {
		try {
			const res = await axios.post(`/orders/admin/${orderId}/refund`, { amount, reason });
			const refund = res.data.refund;

			set((state) => ({
				adminOrders: state.adminOrders.map((o) =>
					o._id === orderId ? { ...o, refund, paymentStatus: "refunded" } : o
				),
				currentOrder:
					state.currentOrder?._id === orderId
						? { ...state.currentOrder, refund, paymentStatus: "refunded" }
						: state.currentOrder,
			}));

			toast.success(res.data.message || "Refund processed successfully.");
			return { success: true, refund };
		} catch (error) {
			const msg = error.response?.data?.error || error.response?.data?.message || "Failed to process refund";
			toast.error(msg);
			return { success: false, error: msg, details: error.response?.data?.details };
		}
	},

	/**
	 * Admin: Update order status
	 */
	adminUpdateOrderStatus: async (orderId, { status, shipmentStatus, note } = {}) => {
		try {
			const res = await axios.put(`/orders/admin/${orderId}/status`, { status, shipmentStatus, note });
			const updatedOrder = res.data.order;

			set((state) => ({
				adminOrders: state.adminOrders.map((o) => (o._id === orderId ? updatedOrder : o)),
				currentOrder: state.currentOrder?._id === orderId ? updatedOrder : state.currentOrder,
			}));

			toast.success(res.data.message || "Order status updated.");
			return { success: true, order: updatedOrder };
		} catch (error) {
			const msg = error.response?.data?.error || error.response?.data?.message || "Failed to update status";
			toast.error(msg);
			return { success: false, error: msg };
		}
	},
}));

