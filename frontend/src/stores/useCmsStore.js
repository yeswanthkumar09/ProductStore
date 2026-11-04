import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useCmsStore = create((set, get) => ({
	publishedSections: {},
	allSectionsAdmin: [],
	loading: false,

	fetchPublishedSections: async () => {
		try {
			const res = await axios.get("/cms/published");
			const data = res.data || {};
			set({ publishedSections: data });
			try {
				localStorage.setItem("luxestore_cms_cache", JSON.stringify(data));
			} catch (e) {}
			return data;
		} catch (error) {
			console.warn("CMS published fetch notice:", error.message);
			// Fallback to local cache if offline
			try {
				const cached = localStorage.getItem("luxestore_cms_cache");
				if (cached) {
					const parsed = JSON.parse(cached);
					set({ publishedSections: parsed });
					return parsed;
				}
			} catch (e) {}
			return {};
		}
	},

	fetchPublishedSection: async (sectionKey) => {
		try {
			const res = await axios.get(`/cms/published/${sectionKey}`);
			set((state) => ({
				publishedSections: {
					...state.publishedSections,
					[sectionKey]: res.data,
				},
			}));
			return res.data;
		} catch (error) {
			console.warn(`CMS section "${sectionKey}" fetch notice:`, error.message);
			return null;
		}
	},

	fetchAllSectionsAdmin: async () => {
		set({ loading: true });
		try {
			const res = await axios.get("/cms/admin");
			set({ allSectionsAdmin: res.data || [], loading: false });
			return res.data;
		} catch (error) {
			set({ loading: false });
			console.error("Error fetching admin CMS sections:", error);
			throw error;
		}
	},

	saveSectionAdmin: async (sectionKey, payload) => {
		set({ loading: true });
		try {
			const res = await axios.post(`/cms/admin/${sectionKey}`, payload);
			set((state) => ({
				allSectionsAdmin: state.allSectionsAdmin.map((s) =>
					s.sectionKey === sectionKey ? res.data.section : s
				),
				loading: false,
			}));
			get().fetchPublishedSections();
			toast.success(res.data.message || `Section "${sectionKey}" saved!`);
			return res.data.section;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to save CMS section");
			throw error;
		}
	},

	publishSectionAdmin: async (sectionKey) => {
		set({ loading: true });
		try {
			const res = await axios.post(`/cms/admin/${sectionKey}/publish`);
			set((state) => ({
				allSectionsAdmin: state.allSectionsAdmin.map((s) =>
					s.sectionKey === sectionKey ? res.data.section : s
				),
				loading: false,
			}));
			get().fetchPublishedSections();
			toast.success(res.data.message || "Draft published to live storefront!");
			return res.data.section;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to publish draft");
			throw error;
		}
	},

	rollbackVersionAdmin: async (sectionKey, version) => {
		set({ loading: true });
		try {
			const res = await axios.post(`/cms/admin/${sectionKey}/rollback/${version}`);
			set((state) => ({
				allSectionsAdmin: state.allSectionsAdmin.map((s) =>
					s.sectionKey === sectionKey ? res.data.section : s
				),
				loading: false,
			}));
			get().fetchPublishedSections();
			toast.success(res.data.message || `Restored version ${version}`);
			return res.data.section;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to rollback version");
			throw error;
		}
	},
}));

