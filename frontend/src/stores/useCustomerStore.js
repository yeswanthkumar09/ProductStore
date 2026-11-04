import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCustomerStore = create((set, get) => ({
	customers: [],
	total: 0,
	page: 1,
	pages: 1,
	loading: false,
	selectedCustomer: null,
	loadingDetail: false,

	fetchCustomers: async (params = {}) => {
		set({ loading: true });
		try {
			const query = new URLSearchParams(params).toString();
			const res = await axios.get(`/admin/customers?${query}`);
			set({
				customers: res.data.customers,
				total: res.data.total,
				page: res.data.page,
				pages: res.data.pages,
				loading: false,
			});
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to load customers.");
		}
	},

	fetchCustomerDetail: async (id) => {
		set({ loadingDetail: true, selectedCustomer: null });
		try {
			const res = await axios.get(`/admin/customers/${id}`);
			set({ selectedCustomer: res.data, loadingDetail: false });
			return res.data;
		} catch (error) {
			set({ loadingDetail: false });
			toast.error(error.response?.data?.message || "Failed to load customer profile.");
		}
	},

	clearCustomerDetail: () => {
		set({ selectedCustomer: null });
	},

	updateCustomerStatus: async (id, status) => {
		try {
			const res = await axios.patch(`/admin/customers/${id}/status`, { status });
			set((state) => ({
				customers: state.customers.map((c) => (c._id === id ? { ...c, accountStatus: status } : c)),
				selectedCustomer: state.selectedCustomer?.user?._id === id
					? { ...state.selectedCustomer, user: { ...state.selectedCustomer.user, accountStatus: status } }
					: state.selectedCustomer,
			}));
			toast.success(res.data.message || `Customer status updated to ${status}.`);
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to update status.");
		}
	},

	exportCsv: async () => {
		try {
			const res = await axios.get("/admin/customers/export-csv", { responseType: "blob" });
			const url = window.URL.createObjectURL(new Blob([res.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", `customers_directory_${new Date().toISOString().slice(0, 10)}.csv`);
			document.body.appendChild(link);
			link.click();
			link.remove();
			toast.success("Customers exported to CSV.");
		} catch (error) {
			toast.error("Failed to export customers list.");
		}
	},
}));
