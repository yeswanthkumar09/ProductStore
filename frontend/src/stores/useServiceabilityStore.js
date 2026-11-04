import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useServiceabilityStore = create((set, get) => ({
	locations: [],
	total: 0,
	page: 1,
	pages: 1,
	states: [],
	stats: null,
	loading: false,
	warehouseSettings: null,
	warehouseLoading: false,

	fetchWarehouseSettings: async () => {
		set({ warehouseLoading: true });
		try {
			const res = await axios.get("/serviceability/admin/warehouse");
			set({ warehouseSettings: res.data, warehouseLoading: false });
			return res.data;
		} catch (error) {
			set({ warehouseLoading: false });
			toast.error(error.response?.data?.message || "Failed to load warehouse settings.");
		}
	},

	updateWarehouseSettings: async (settingsData) => {
		set({ warehouseLoading: true });
		try {
			const res = await axios.put("/serviceability/admin/warehouse", settingsData);
			set({ warehouseSettings: res.data, warehouseLoading: false });
			toast.success("Warehouse pickup settings updated successfully!");
			return res.data;
		} catch (error) {
			set({ warehouseLoading: false });
			toast.error(error.response?.data?.message || "Failed to update warehouse settings.");
			throw error;
		}
	},

	testShiprocket: async (params) => {
		try {
			const res = await axios.post("/serviceability/admin/test-serviceability", params);
			return res.data;
		} catch (error) {
			const msg = error.response?.data?.message || "Shiprocket serviceability test failed.";
			toast.error(msg);
			throw error;
		}
	},

	fetchLocations: async (params = {}) => {
		set({ loading: true });
		try {
			const query = new URLSearchParams(params).toString();
			const res = await axios.get(`/serviceability/admin?${query}`);
			set({
				locations: res.data.locations,
				total: res.data.total,
				page: res.data.page,
				pages: res.data.pages,
				states: res.data.states || [],
				loading: false,
			});
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to load serviceable locations.");
		}
	},

	fetchStats: async () => {
		try {
			const res = await axios.get("/serviceability/admin/stats");
			set({ stats: res.data });
		} catch (error) {
			console.error("Failed to load serviceability stats:", error);
		}
	},

	createLocation: async (locationData) => {
		set({ loading: true });
		try {
			const res = await axios.post("/serviceability/admin", locationData);
			set((state) => ({
				locations: [res.data, ...state.locations],
				total: state.total + 1,
				loading: false,
			}));
			toast.success(`PIN ${res.data.pincode} (${res.data.city}) added successfully!`);
			get().fetchStats();
			return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to create location.");
			throw error;
		}
	},

	updateLocation: async (id, locationData) => {
		try {
			const res = await axios.put(`/serviceability/admin/${id}`, locationData);
			set((state) => ({
				locations: state.locations.map((loc) => (loc._id === id ? res.data : loc)),
			}));
			toast.success("Location updated successfully!");
			get().fetchStats();
			return res.data;
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to update location.");
			throw error;
		}
	},

	deleteLocation: async (id) => {
		try {
			const res = await axios.delete(`/serviceability/admin/${id}`);
			set((state) => ({
				locations: state.locations.filter((loc) => loc._id !== id),
				total: Math.max(0, state.total - 1),
			}));
			toast.success(res.data.message || "Location deleted successfully.");
			get().fetchStats();
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to delete location.");
		}
	},

	importCsv: async (fileOrText, isPreview = false) => {
		set({ loading: true });
		try {
			let res;
			if (typeof fileOrText === "string") {
				res = await axios.post("/serviceability/admin/import-csv", {
					csvData: fileOrText,
					preview: isPreview,
				});
			} else {
				const formData = new FormData();
				formData.append("file", fileOrText);
				if (isPreview) formData.append("preview", "true");
				res = await axios.post("/serviceability/admin/import-csv", formData, {
					headers: { "Content-Type": "multipart/form-data" },
				});
			}
			set({ loading: false });
			if (!isPreview) {
				toast.success(res.data.message || "CSV imported successfully!");
				get().fetchLocations();
				get().fetchStats();
			}
			return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to process CSV import.");
			throw error;
		}
	},

	downloadTemplate: async () => {
		try {
			const res = await axios.get("/serviceability/admin/template-csv", { responseType: "blob" });
			const url = window.URL.createObjectURL(new Blob([res.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", "serviceable_locations_template.csv");
			document.body.appendChild(link);
			link.click();
			link.remove();
		} catch (error) {
			toast.error("Failed to download CSV template.");
		}
	},

	exportCsv: async () => {
		try {
			const res = await axios.get("/serviceability/admin/export-csv", { responseType: "blob" });
			const url = window.URL.createObjectURL(new Blob([res.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", `serviceable_locations_${new Date().toISOString().slice(0, 10)}.csv`);
			document.body.appendChild(link);
			link.click();
			link.remove();
			toast.success("Locations exported to CSV.");
		} catch (error) {
			toast.error("Failed to export locations.");
		}
	},
}));
